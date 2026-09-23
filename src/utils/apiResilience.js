/**
 * apiResilience.js
 * 
 * Handles Render free-tier cold-start dormancy for form submissions:
 * 1. Proactive prewarming (triggered once on section visibility or field focus).
 * 2. Submission idempotency (submissionId / Idempotency-Key) to prevent duplicate DB records or emails.
 * 3. Cold-start detection (502, 503, 504, network error, timeout).
 * 4. Graceful 4–5s health polling loop (up to max ~75s total).
 * 5. Single automatic retry once backend is ready.
 */

let prewarmTriggered = false;

/**
 * Generates a unique submission/idempotency ID.
 */
export function generateSubmissionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `sub_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

/**
 * Prewarms the backend if it might be asleep.
 * Safe, idempotent, non-blocking — fires only once per browser session.
 */
export function prewarmBackend(apiUrl) {
  if (prewarmTriggered || !apiUrl) return;
  prewarmTriggered = true;

  const base = apiUrl.replace(/\/$/, '');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  fetch(`${base}/api/health`, {
    method: 'GET',
    mode: 'cors',
    cache: 'no-store',
    signal: controller.signal,
  })
    .catch(() => {
      // Completely silent — this is just a warm-up ping
    })
    .finally(() => {
      clearTimeout(timeoutId);
    });
}

/**
 * Helper to delay execution for a given number of milliseconds.
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Checks if an error or HTTP status indicates a cold-start sleep or gateway failure.
 */
function isColdStartIssue(status, error) {
  if ([502, 503, 504].includes(status)) return true;
  if (error) {
    if (error.name === 'AbortError') return true;
    if (error instanceof TypeError) return true; // e.g. "Failed to fetch" / network dropped
  }
  return false;
}

/**
 * Submits form data with cold-start detection, safe health polling, and idempotency protection.
 *
 * @param {Object} options
 * @param {string} options.url - Full endpoint URL (e.g. https://.../api/contact)
 * @param {string} options.healthUrl - Health check URL (e.g. https://.../api/health)
 * @param {Object} options.data - Form payload
 * @param {Function} [options.onStatusChange] - Callback receiving ({ phase, message })
 * @param {number} [options.maxWaitMs=75000] - Total maximum wait window
 * @param {number} [options.initialTimeoutMs=11000] - Timeout for initial direct attempt
 * @param {number} [options.pollIntervalMs=4500] - Time to wait between health checks
 */
export async function submitWithColdStartRetry({
  url,
  healthUrl,
  data,
  onStatusChange = () => {},
  maxWaitMs = 75000,
  initialTimeoutMs = 11000,
  pollIntervalMs = 4500,
}) {
  const submissionId = generateSubmissionId();
  const startTime = Date.now();

  const payload = {
    ...data,
    submissionId,
  };

  const headers = {
    'Content-Type': 'application/json',
    'X-Submission-Id': submissionId,
    'Idempotency-Key': submissionId,
  };

  // ── PHASE 1: DIRECT ATTEMPT ──────────────────────────────────────────────
  onStatusChange({
    phase: 'submitting',
    message: 'Submitting...',
  });

  let initialFailedDueToColdStart = false;
  let initialResponse = null;
  let initialResult = null;

  const directController = new AbortController();
  const directTimeout = setTimeout(() => directController.abort(), initialTimeoutMs);

  try {
    initialResponse = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: directController.signal,
    });

    try {
      initialResult = await initialResponse.json();
    } catch {
      // Non-JSON response (e.g. HTML 502/503 from reverse proxy)
    }

    if (initialResponse.ok) {
      // Immediate success — server was awake!
      return initialResult || { success: true };
    }

    if (isColdStartIssue(initialResponse.status, null)) {
      initialFailedDueToColdStart = true;
    } else {
      // Real client / application error (400 validation, 429 rate limit, etc.)
      const errorMsg = initialResult?.message || `Server error (${initialResponse.status}). Please try again.`;
      const err = new Error(errorMsg);
      err.status = initialResponse.status;
      throw err;
    }
  } catch (err) {
    if (isColdStartIssue(0, err)) {
      initialFailedDueToColdStart = true;
    } else {
      throw err;
    }
  } finally {
    clearTimeout(directTimeout);
  }

  if (!initialFailedDueToColdStart) {
    throw new Error('Unable to submit enquiry. Please check your connection.');
  }

  // ── PHASE 2: COLD START DETECTED ────────────────────────────────────────
  onStatusChange({
    phase: 'waking',
    message: 'Server is spinning up from sleep mode. Please hold on — your message will submit automatically.',
  });

  // Wait 4–5 seconds before first health check probe
  await delay(pollIntervalMs);

  // ── PHASE 3: WAKE DETECTION VIA /api/health ─────────────────────────────
  let isServerAwake = false;

  while (Date.now() - startTime < maxWaitMs) {
    try {
      const probeController = new AbortController();
      const probeTimeout = setTimeout(() => probeController.abort(), 6000);

      const healthRes = await fetch(healthUrl, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-store',
        signal: probeController.signal,
      });

      clearTimeout(probeTimeout);

      if (healthRes.ok) {
        isServerAwake = true;
        break;
      }
    } catch {
      // Still waking up, continue polling
    }

    onStatusChange({
      phase: 'waking',
      message: 'Server is spinning up from sleep mode. Please hold on — your message will submit automatically.',
    });

    await delay(pollIntervalMs);
  }

  if (!isServerAwake) {
    throw new Error('Server took too long to wake up. Please check your connection and try again in a moment.');
  }

  // ── PHASE 4: API AVAILABLE — RETRY POST (EXACTLY 1 RETRY) ─────────────────
  onStatusChange({
    phase: 'connecting',
    message: 'Server ready! Transmitting message...',
  });

  const retryController = new AbortController();
  const retryTimeout = setTimeout(() => retryController.abort(), 20000);

  try {
    const retryResponse = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: retryController.signal,
    });

    let retryResult = null;
    try {
      retryResult = await retryResponse.json();
    } catch {
      // Non-JSON response
    }

    if (!retryResponse.ok) {
      const errorMsg = retryResult?.message || `Server error (${retryResponse.status}). Please try again.`;
      const err = new Error(errorMsg);
      err.status = retryResponse.status;
      throw err;
    }

    return retryResult || { success: true };
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Submission timed out while sending. Please try again.');
    }
    throw err;
  } finally {
    clearTimeout(retryTimeout);
  }
}

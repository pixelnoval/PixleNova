import { useEffect, useRef, useState } from 'react';

/**
 * CinematicIntro — PixelNova Brand Intro Overlay
 *
 * Architecture:
 * - Uses a `started` ref to guarantee timers fire exactly ONCE,
 *   even in React StrictMode (which mounts→unmounts→remounts in dev).
 * - The overlay is always fully opaque on mount (no flash).
 *
 * Timeline (production):
 *   0.10s  – Icon fades in (scale 0.92→1, opacity 0→1)
 *   0.80s  – Brand name reveals (translateY + letter-spacing)
 *   1.40s  – Tagline appears (gold, opacity + translateY)
 *
 *   1.80s  – *** onTransitionStart fires ***
 *            Homepage reveals begin (1.2–1.8s transitions start NOW)
 *            Hero is fully visible by ~3.5s
 *
 *   3.20s  – Brand composition starts fading (icon, name, tagline)
 *   3.60s  – Overlay begins CSS fade-out (1.2s → opacity 0)
 *            At this point hero is ALREADY fully visible underneath.
 *
 *   4.80s  – onComplete fires, intro unmounts cleanly.
 *
 * The key insight: onTransitionStart must fire 1.8s BEFORE the overlay
 * starts fading, so hero content is already fully revealed when the
 * overlay becomes transparent. This eliminates the blank-screen gap.
 */
export default function CinematicIntro({ onTransitionStart, onComplete }) {
  const wrapperRef  = useRef(null);
  const iconRef     = useRef(null);
  const textRef     = useRef(null);
  const taglineRef  = useRef(null);

  // Guard: ensures sequence starts exactly once (StrictMode-safe)
  const started = useRef(false);

  // Triggers the CSS fade-out class on the wrapper
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      if (onTransitionStart) onTransitionStart();
      setFading(true);
      const t = setTimeout(() => { if (onComplete) onComplete(); }, 300);
      return () => clearTimeout(t);
    }

    const timers = [];
    const after = (ms, fn) => { const id = setTimeout(fn, ms); timers.push(id); };

    // ── BRAND REVEAL ────────────────────────────────────────────────
    // Phase 1: icon scales in
    after(100, () => {
      if (iconRef.current) iconRef.current.classList.add('intro-icon-visible');
    });

    // Phase 2: PIXELNOVA wordmark
    after(800, () => {
      if (textRef.current) textRef.current.classList.add('intro-text-visible');
    });

    // Phase 3: tagline
    after(1400, () => {
      if (taglineRef.current) taglineRef.current.classList.add('intro-tagline-visible');
    });

    // ── HOMEPAGE PRE-REVEAL ─────────────────────────────────────────
    // Phase 4: signal App to start hero reveals NOW — 1.8s before overlay fades.
    // The hero's longest reveal (1.2s transition + 0.6s delay = 1.8s) will be
    // COMPLETE by the time the overlay reaches opacity:0.
    after(1800, () => {
      if (onTransitionStart) onTransitionStart();
    });

    // ── BRAND EXIT ──────────────────────────────────────────────────
    // Phase 5: brand composition fades while homepage is revealing underneath
    after(3200, () => {
      if (iconRef.current)    iconRef.current.classList.add('intro-fadeout');
      if (textRef.current)    textRef.current.classList.add('intro-fadeout');
      if (taglineRef.current) taglineRef.current.classList.add('intro-fadeout');
    });

    // Phase 6: overlay starts fading. Hero is already fully visible at this point.
    after(3600, () => {
      setFading(true); // CSS: opacity 1 → 0 over 1.2s
    });

    // Phase 7: unmount once CSS transition is done (3600 + 1200 = 4800ms)
    after(4800, () => {
      if (onComplete) onComplete();
    });

    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`cinematic-intro-wrapper${fading ? ' fade-out' : ''}`}
      ref={wrapperRef}
      aria-hidden="true"
    >
      <div className="cinematic-brand-composition">
        <img
          src="/pixelnova-logo-icon.png"
          alt="PixelNova"
          className="cinematic-brand-icon"
          ref={iconRef}
        />
        <div className="cinematic-brand-name" ref={textRef}>PIXELNOVA</div>
        <div className="cinematic-brand-tagline" ref={taglineRef}>YOUR BUSINESS, ACCELERATED</div>
      </div>
    </div>
  );
}

import { useEffect, useState, useRef } from 'react';

/**
 * ContactSuccessState
 * Renders inside the existing form-panel after a confirmed successful API response.
 * Props:
 *   visible (boolean) — triggers the full cinematic sequence when true
 */
export default function ContactSuccessState({ visible }) {
  const [ringActive, setRingActive]         = useState(false);
  const [checkActive, setCheckActive]       = useState(false);
  const [expandActive, setExpandActive]     = useState(false);
  const [titleActive, setTitleActive]       = useState(false);
  const [subtitleActive, setSubtitleActive] = useState(false);
  const [statusActive, setStatusActive]     = useState(false);

  const timersRef = useRef([]);

  useEffect(() => {
    if (!visible) return;

    const schedule = (fn, delay) => {
      const id = setTimeout(fn, delay);
      timersRef.current.push(id);
      return id;
    };

    schedule(() => setRingActive(true),     250);
    schedule(() => setCheckActive(true),    450);
    schedule(() => setExpandActive(true),   600);
    schedule(() => setTitleActive(true),   1000);
    schedule(() => setSubtitleActive(true),1200);
    schedule(() => setStatusActive(true),  1500);

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [visible]);

  return (
    <div
      className={`contact-success-state${visible ? ' cs-visible' : ''}`}
      aria-live="polite"
      aria-atomic="true"
      role="status"
    >
      {/* ── Visual ring + checkmark ── */}
      <div className="cs-ring-wrapper" aria-hidden="true">
        {/* Expanding halo behind the ring */}
        <div className={`cs-ring-expand${expandActive ? ' cs-ring-expand--active' : ''}`} />

        {/* Primary ring drawn via SVG stroke-dashoffset */}
        <svg
          className={`cs-ring-svg${ringActive ? ' cs-ring-svg--active' : ''}`}
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* faint static track */}
          <circle
            cx="60" cy="60" r="52"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
          {/* animated ring */}
          <circle
            className="cs-ring-path"
            cx="60" cy="60" r="52"
            stroke="rgba(143,176,255,0.7)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          {/* small accent arc */}
          <circle
            className="cs-ring-accent"
            cx="60" cy="60" r="48"
            stroke="rgba(79,123,255,0.35)"
            strokeWidth="0.6"
            strokeLinecap="round"
          />
        </svg>

        {/* Checkmark */}
        <svg
          className={`cs-check-svg${checkActive ? ' cs-check-svg--active' : ''}`}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Success checkmark"
        >
          <polyline
            className="cs-check-path"
            points="10,25 20,35 38,14"
            stroke="var(--ink)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Subtle particles (hidden on reduced-motion via CSS) */}
        <div className="cs-particles" aria-hidden="true">
          {[...Array(6)].map((_, i) => (
            <span
              key={i}
              className={`cs-particle cs-particle--${i + 1}${ringActive ? ' cs-particle--active' : ''}`}
            />
          ))}
        </div>
      </div>

      {/* ── Copy ── */}
      <div className="cs-copy">
        <p className={`cs-title${titleActive ? ' cs-title--active' : ''}`}>
          MESSAGE TRANSMITTED
        </p>
        <p className={`cs-subtitle${subtitleActive ? ' cs-subtitle--active' : ''}`}>
          Your enquiry has been successfully received.<br />
          We&rsquo;ll be in touch soon.
        </p>
        <p className={`cs-status${statusActive ? ' cs-status--active' : ''}`}>
          TRANSMISSION COMPLETE
        </p>
      </div>
    </div>
  );
}

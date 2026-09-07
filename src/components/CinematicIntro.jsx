import { useEffect, useRef, useState } from 'react';

/**
 * CinematicIntro — PixelNova Brand Intro Overlay
 *
 * StrictMode fix: `started.current` is RESET to false in the cleanup
 * function so that StrictMode's mount→cleanup→remount cycle re-runs
 * the timer sequence correctly on the second (real) mount.
 *
 * Timeline:
 *   0.10s  – Icon fades in
 *   0.60s  – PIXELNOVA wordmark reveals
 *   1.10s  – Tagline appears
 *   1.80s  – onTransitionStart: hero gets .in classes DIRECTLY (no observer)
 *            Hero fully visible by ~2.75s (1.8 + 0.55s transition + 0.4s max delay)
 *   2.50s  – Brand composition fades
 *   2.80s  – Overlay CSS fade begins (1.2s) — hero already fully visible
 *   4.00s  – onComplete: intro unmounts cleanly
 */
export default function CinematicIntro({ onTransitionStart, onComplete }) {
  const wrapperRef  = useRef(null);
  const iconRef     = useRef(null);
  const textRef     = useRef(null);
  const taglineRef  = useRef(null);
  const started     = useRef(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      if (onTransitionStart) onTransitionStart();
      setFading(true);
      const t = setTimeout(() => { if (onComplete) onComplete(); }, 300);
      return () => {
        clearTimeout(t);
        started.current = false; // reset for StrictMode remount
      };
    }

    const timers = [];
    const after = (ms, fn) => { const id = setTimeout(fn, ms); timers.push(id); };

    // Phase 1 — icon
    after(100, () => {
      if (iconRef.current) iconRef.current.classList.add('intro-icon-visible');
    });

    // Phase 2 — wordmark
    after(600, () => {
      if (textRef.current) textRef.current.classList.add('intro-text-visible');
    });

    // Phase 3 — tagline
    after(1100, () => {
      if (taglineRef.current) taglineRef.current.classList.add('intro-tagline-visible');
    });

    // Phase 4 — signal App: directly add .in to hero (synchronous, no observer)
    after(1800, () => {
      if (onTransitionStart) onTransitionStart();
    });

    // Phase 5 — brand fades while hero is already revealing underneath
    after(2500, () => {
      if (iconRef.current)    iconRef.current.classList.add('intro-fadeout');
      if (textRef.current)    textRef.current.classList.add('intro-fadeout');
      if (taglineRef.current) taglineRef.current.classList.add('intro-fadeout');
    });

    // Phase 6 — overlay fades. Hero is fully visible at this point (1800+550+400=2750ms).
    after(2800, () => {
      setFading(true); // CSS: opacity 1 → 0 over 1.2s
    });

    // Phase 7 — unmount (2800 + 1200 = 4000ms)
    after(4000, () => {
      if (onComplete) onComplete();
    });

    return () => {
      timers.forEach(clearTimeout);
      started.current = false; // CRITICAL: reset so StrictMode's re-mount re-runs correctly
    };
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

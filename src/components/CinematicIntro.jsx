import { useEffect, useRef, useState } from 'react';

/**
 * CinematicIntro — PixelNova Brand Intro Overlay
 *
 * Architecture:
 * - Uses a `started` ref to guarantee timers fire exactly ONCE,
 *   even in React StrictMode (which mounts→unmounts→remounts in dev).
 * - All callbacks are called once via the ref guard.
 * - The overlay is always fully opaque on mount (no flash).
 *
 * Timeline:
 *   0.10s  – Icon fades in
 *   0.70s  – Brand name reveals
 *   1.20s  – Tagline appears
 *   1.60s  – onBlendStart (globe timeline starts in useThreeBackground)
 *   2.60s  – Brand elements begin fading
 *   2.80s  – onTransitionStart: homepage reveals begin, overlay fades (1.2s CSS)
 *   4.00s  – onComplete: intro unmounts (CSS fade done)
 */
export default function CinematicIntro({ onTransitionStart, onComplete }) {
  const wrapperRef = useRef(null);
  const iconRef   = useRef(null);
  const textRef   = useRef(null);
  const taglineRef = useRef(null);

  // Guard: ensures the animation sequence starts exactly once,
  // even under React StrictMode double-invocation.
  const started = useRef(false);

  // Controls the wrapper's CSS fade-out class
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Strictly once — ignore the StrictMode cleanup+re-run cycle
    if (started.current) return;
    started.current = true;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      // Skip animation — immediately transition and complete
      if (onTransitionStart) onTransitionStart();
      setFading(true);
      const t = setTimeout(() => { if (onComplete) onComplete(); }, 400);
      return () => clearTimeout(t);
    }

    const timers = [];
    const after = (ms, fn) => { const id = setTimeout(fn, ms); timers.push(id); };

    // Phase 1 — icon reveal
    after(100, () => {
      if (iconRef.current) iconRef.current.classList.add('intro-icon-visible');
    });

    // Phase 2 — brand name reveal
    after(700, () => {
      if (textRef.current) textRef.current.classList.add('intro-text-visible');
    });

    // Phase 3 — tagline reveal
    after(1200, () => {
      if (taglineRef.current) taglineRef.current.classList.add('intro-tagline-visible');
    });

    // Phase 5 — begin exit: brand composition fades
    after(2600, () => {
      if (iconRef.current)    iconRef.current.classList.add('intro-fadeout');
      if (textRef.current)    textRef.current.classList.add('intro-fadeout');
      if (taglineRef.current) taglineRef.current.classList.add('intro-fadeout');
    });

    // Phase 6 — simultaneously: start overlay CSS fade + signal homepage to reveal
    after(2800, () => {
      if (onTransitionStart) onTransitionStart(); // App sets state → hero reveals start
      setFading(true);                            // overlay opacity: 1 → 0 (1.2s CSS)
    });

    // Phase 7 — unmount after CSS transition completes (2800 + 1200 = 4000ms)
    after(4000, () => {
      if (onComplete) onComplete();
    });

    return () => timers.forEach(clearTimeout);
    // Empty deps — runs once on first real mount only (started ref guards re-runs)
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

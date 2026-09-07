import { useEffect, useRef, useState } from 'react';

/**
 * CinematicIntro — PixelNova Brand Intro Overlay
 *
 * Pure visual overlay: homepage is already rendered underneath.
 * StrictMode-safe timer cleanup.
 *
 * Timeline:
 *   0.10s  – Icon fades in
 *   0.60s  – PIXELNOVA wordmark reveals
 *   1.10s  – Tagline appears
 *   2.50s  – Brand composition fades
 *   2.80s  – Overlay CSS fade begins (1.2s)
 *   ~4.00s – onTransitionEnd calls onComplete to unmount
 */
export default function CinematicIntro({ onComplete }) {
  const [isExiting, setIsExiting] = useState(false);
  const wrapperRef = useRef(null);
  const iconRef = useRef(null);
  const textRef = useRef(null);
  const taglineRef = useRef(null);

  useEffect(() => {
    const timers = [];

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setIsExiting(true);
      return;
    }

    timers.push(setTimeout(() => {
      iconRef.current?.classList.add('intro-icon-visible');
    }, 100));

    timers.push(setTimeout(() => {
      textRef.current?.classList.add('intro-text-visible');
    }, 600));

    timers.push(setTimeout(() => {
      taglineRef.current?.classList.add('intro-tagline-visible');
    }, 1100));

    timers.push(setTimeout(() => {
      iconRef.current?.classList.add('intro-fadeout');
      textRef.current?.classList.add('intro-fadeout');
      taglineRef.current?.classList.add('intro-fadeout');
    }, 2500));

    timers.push(setTimeout(() => {
      setIsExiting(true); // Triggers CSS opacity transition
    }, 2800));

    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  const handleTransitionEnd = (e) => {
    // Only unmount when the wrapper itself finishes its opacity transition
    if (e.target === wrapperRef.current && isExiting) {
      if (onComplete) onComplete();
    }
  };

  return (
    <div
      className={`cinematic-intro-wrapper${isExiting ? ' exiting' : ''}`}
      ref={wrapperRef}
      onTransitionEnd={handleTransitionEnd}
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

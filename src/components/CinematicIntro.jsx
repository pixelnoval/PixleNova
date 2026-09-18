import { useEffect, useRef, useState } from 'react';

/**
 * CinematicIntro — PixelNova Visual Bridge Intro
 *
 * Architecture:
 * - Pure visual overlay positioned above the already-mounted homepage (z-index: 9999).
 * - Timeline:
 *   0–100ms: Official PixelNova icon appears.
 *   ~700ms: PIXELNOVA wordmark appears.
 *   ~1200ms: YOUR BUSINESS, ACCELERATED tagline appears.
 *   1200–3800ms: Complete brand composition holds.
 *   3800–4800ms: Entire intro overlay smoothly fades out (opacity: 1 -> 0 over 1.0s).
 *   ~4900ms: Clean unmount.
 *
 * The homepage DOM and CSS background exist underneath from frame 0.
 * There is ZERO blank interval between intro and homepage.
 */
export default function CinematicIntro({ onComplete }) {
  const [isExiting, setIsExiting] = useState(false);
  const wrapperRef = useRef(null);
  const iconRef = useRef(null);
  const textRef = useRef(null);
  const taglineRef = useRef(null);
  const hasCompleted = useRef(false);

  const finish = () => {
    if (hasCompleted.current) return;
    hasCompleted.current = true;
    if (onComplete) onComplete();
  };

  useEffect(() => {
    const timers = [];

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      finish();
      return;
    }

    // Step 1: Icon reveals
    timers.push(setTimeout(() => {
      iconRef.current?.classList.add('intro-icon-visible');
    }, 100));

    // Step 2: "PIXELNOVA" wordmark reveals
    timers.push(setTimeout(() => {
      textRef.current?.classList.add('intro-text-visible');
    }, 700));

    // Step 3: Tagline reveals
    timers.push(setTimeout(() => {
      taglineRef.current?.classList.add('intro-tagline-visible');
    }, 1200));

    // Step 4: Overlay initiates smooth crossfade exit at 3800ms
    // The homepage is already rendered and active underneath.
    // The overlay fades opacity 1 -> 0 over 1.0s (3800ms to 4800ms).
    timers.push(setTimeout(() => {
      setIsExiting(true);
    }, 3800));

    // Guaranteed unmount safety timer at 4900ms (3800ms + 1000ms transition + 100ms buffer)
    timers.push(setTimeout(() => {
      finish();
    }, 4900));

    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  const handleTransitionEnd = (e) => {
    if (e.target === wrapperRef.current && isExiting) {
      finish();
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

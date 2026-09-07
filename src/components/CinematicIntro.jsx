import { useEffect, useRef, useState } from 'react';

/**
 * CinematicIntro — PixelNova Visual Bridge Intro
 *
 * Architecture:
 * - Visual Bridge overlay matching homepage background.
 * - Icon appears at 100ms
 * - Wordmark appears at 700ms
 * - Tagline appears at 1200ms
 * - Full brand mark holds until 2400ms
 * - At 2400ms, smooth 0.8s crossfade into the already-mounted homepage underneath
 * - At 3300ms, unmounts cleanly
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
    console.log(`[${performance.now().toFixed(1)}ms] Intro fully removed`);
    if (onComplete) onComplete();
  };

  useEffect(() => {
    console.log(`[${performance.now().toFixed(1)}ms] Intro mounted`);
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

    // Step 4: Visual Bridge crossfade exit at 2400ms
    // The homepage and background are already rendered underneath.
    // The overlay smoothly fades from opacity 1 -> 0 over 0.8s.
    timers.push(setTimeout(() => {
      console.log(`[${performance.now().toFixed(1)}ms] Intro exit started`);
      setIsExiting(true);
    }, 2400));

    // Guaranteed unmount safety timer (2400ms + 800ms transition + 100ms buffer)
    timers.push(setTimeout(() => {
      finish();
    }, 3300));

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

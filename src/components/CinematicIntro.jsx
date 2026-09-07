import { useEffect, useRef, useState } from 'react';

/**
 * CinematicIntro — PixelNova Brand Intro Overlay
 *
 * Architecture:
 * - Pure visual overlay above already-mounted homepage (z-index: 99999).
 * - Logo icon, wordmark, and tagline animate in.
 * - At 2.2s, overlay fades smoothly (opacity: 1 -> 0 over 0.8s) while homepage is fully visible underneath.
 * - NO PREMATURE LOGO FADEOUT: The logo does NOT vanish before the overlay fades.
 * - Fallback safety timer ensures unmount even if transitionend is interrupted.
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
    console.log(`[${performance.now().toFixed(1)}ms] CinematicIntro unmounted`);
    if (onComplete) onComplete();
  };

  useEffect(() => {
    console.log(`[${performance.now().toFixed(1)}ms] CinematicIntro mounted`);
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
    }, 600));

    // Step 3: Tagline reveals
    timers.push(setTimeout(() => {
      taglineRef.current?.classList.add('intro-tagline-visible');
    }, 1100));

    // Step 4: Overlay initiates crossfade exit (Homepage already active underneath!)
    // Logo remains visible as the overlay dissolves into the homepage
    timers.push(setTimeout(() => {
      console.log(`[${performance.now().toFixed(1)}ms] Intro fade started`);
      setIsExiting(true); // Triggers CSS opacity 1 -> 0 over 0.8s
    }, 2200));

    // Safety fallback: guaranteed unmount at 3100ms (2200ms + 800ms transition + 100ms buffer)
    timers.push(setTimeout(() => {
      console.log(`[${performance.now().toFixed(1)}ms] Intro fully hidden (timer fallback)`);
      finish();
    }, 3100));

    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  const handleTransitionEnd = (e) => {
    if (e.target === wrapperRef.current && isExiting) {
      console.log(`[${performance.now().toFixed(1)}ms] Intro fully hidden (transitionend)`);
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

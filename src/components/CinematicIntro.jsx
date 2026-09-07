import { useEffect, useRef, useState } from 'react';

/**
 * CinematicIntro — PixelNova Brand Intro Overlay
 *
 * Timeline (no reduced-motion):
 *   0.10s  – Icon fades in (scale 0.92→1, opacity 0→1)
 *   0.70s  – Brand name reveals (translateY + letter-spacing)
 *   1.20s  – Tagline appears (gold accent)
 *   1.60s  – onBlendStart: globe starts appearing (handled by useThreeBackground internally)
 *   2.60s  – onTextHandoffStart: brand elements begin fading out
 *   2.80s  – onTextHandoffComplete: hero reveal observers start (TEXT_HANDOFF→HERO_REVEAL)
 *            intro overlay starts its CSS fade-out (1.2s transition)
 *   4.00s  – onComplete: intro unmounts (transition is done)
 *
 * The hero content becomes visible ~2.8s while the overlay is still fading —
 * this eliminates the blank-screen gap entirely.
 */
export default function CinematicIntro({
  onComplete,
  onBlendStart,
  onTextHandoffStart,
  onTextHandoffComplete,
  brandRef
}) {
  const wrapperRef = useRef(null);
  const iconRef = useRef(null);
  const textRef = useRef(null);
  const taglineRef = useRef(null);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      // Immediately hand off and complete — no animation delay
      if (onTextHandoffStart) onTextHandoffStart();
      if (onTextHandoffComplete) onTextHandoffComplete();
      setFading(true);
      const t = setTimeout(() => onComplete && onComplete(), 400);
      return () => clearTimeout(t);
    }

    // PHASE 1 — Icon reveal
    const t1 = setTimeout(() => {
      if (iconRef.current) iconRef.current.classList.add('intro-icon-visible');
    }, 100);

    // PHASE 2 — Brand name reveal
    const t2 = setTimeout(() => {
      if (textRef.current) textRef.current.classList.add('intro-text-visible');
    }, 700);

    // PHASE 3 — Tagline reveal
    const t3 = setTimeout(() => {
      if (taglineRef.current) taglineRef.current.classList.add('intro-tagline-visible');
    }, 1200);

    // PHASE 4 — Blend start: globe begins appearing (managed inside useThreeBackground)
    const t4 = setTimeout(() => {
      if (onBlendStart) onBlendStart();
    }, 1600);

    // PHASE 5 — Begin exit: brand composition starts fading out
    const t5 = setTimeout(() => {
      if (onTextHandoffStart) onTextHandoffStart();
      if (iconRef.current) iconRef.current.classList.add('intro-fadeout');
      if (textRef.current) textRef.current.classList.add('intro-fadeout');
      if (taglineRef.current) taglineRef.current.classList.add('intro-fadeout');
    }, 2600);

    // PHASE 6 — Start overlay fade-out & trigger hero reveals simultaneously
    // Hero content starts appearing while the overlay is still transitioning
    const t6 = setTimeout(() => {
      if (onTextHandoffComplete) onTextHandoffComplete();
      setFading(true); // triggers CSS opacity 0 transition (1.2s)
    }, 2800);

    // PHASE 7 — Unmount the intro once CSS transition is done
    const t7 = setTimeout(() => {
      if (onComplete) onComplete();
    }, 4000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
      clearTimeout(t7);
    };
  }, [onBlendStart, onComplete, onTextHandoffComplete, onTextHandoffStart]);

  return (
    <div className={`cinematic-intro-wrapper ${fading ? 'fade-out' : ''}`} ref={wrapperRef}>
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

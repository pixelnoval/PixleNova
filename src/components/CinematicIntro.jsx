import { useEffect, useRef, useState } from 'react';

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
      if (onTextHandoffComplete) onTextHandoffComplete();
      setFading(true);
      setTimeout(() => onComplete && onComplete(), 500);
      return;
    }

    // PHASE 1 - ICON REVEAL
    const t1 = setTimeout(() => {
      if (iconRef.current) iconRef.current.classList.add('intro-icon-visible');
    }, 100);

    // PHASE 2 - NAME REVEAL
    const t2 = setTimeout(() => {
      if (textRef.current) textRef.current.classList.add('intro-text-visible');
    }, 600);

    // PHASE 3 - TAGLINE REVEAL
    const t3 = setTimeout(() => {
      if (taglineRef.current) taglineRef.current.classList.add('intro-tagline-visible');
    }, 1100);

    // BLEND START (Background starts appearing)
    const t4 = setTimeout(() => {
      if (onBlendStart) onBlendStart();
    }, 1600);

    // PHASE 6 - CINEMATIC PAUSE & PREPARE REVEAL
    const t5 = setTimeout(() => {
      if (onTextHandoffStart) onTextHandoffStart();
      if (iconRef.current) iconRef.current.classList.add('intro-fadeout');
      if (textRef.current) textRef.current.classList.add('intro-fadeout');
      if (taglineRef.current) taglineRef.current.classList.add('intro-fadeout');
    }, 3400);

    // PHASE 7 - HERO TEXT REVEAL
    const t6 = setTimeout(() => {
      if (onTextHandoffComplete) onTextHandoffComplete();
      setFading(true);
    }, 3700);

    // COMPLETE STATE
    const t7 = setTimeout(() => {
      if (onComplete) onComplete();
    }, 5100);

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
        <img src="/pixelnova-logo-icon.png" alt="PixelNova official icon" className="cinematic-brand-icon" ref={iconRef} />
        <div className="cinematic-brand-name" ref={textRef}>PIXELNOVA</div>
        <div className="cinematic-brand-tagline" ref={taglineRef}>YOUR BUSINESS, ACCELERATED</div>
      </div>
    </div>
  );
}

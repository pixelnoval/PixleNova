import { useEffect, useRef, useState } from 'react';

export default function CinematicIntro({
  onComplete,
  onBlendStart,
  onTextHandoffStart,
  onTextHandoffComplete,
  brandRef
}) {
  const wrapperRef = useRef(null);
  const textRef = useRef(null);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      if (onTextHandoffComplete) onTextHandoffComplete();
      setFading(true);
      setTimeout(() => onComplete && onComplete(), 500);
      return;
    }

    // PHASE 2 - PIXLENOVA IDENTITY REVEAL
    // Wait a brief moment before revealing text (Dark open)
    const t1 = setTimeout(() => {
      if (textRef.current) {
        textRef.current.classList.add('intro-text-visible');
      }
    }, 400);

    // PHASE 3 - GLOBE REVEAL STARTS
    const t2 = setTimeout(() => {
      if (onBlendStart) onBlendStart();
    }, 1000);

    // PHASE 6 - CINEMATIC PAUSE & PREPARE REVEAL
    const t3 = setTimeout(() => {
      if (onTextHandoffStart) onTextHandoffStart();
      if (textRef.current) {
        textRef.current.classList.add('intro-text-fadeout');
      }
    }, 2800);

    // PHASE 7 - HERO TEXT REVEAL
    const t4 = setTimeout(() => {
      if (onTextHandoffComplete) onTextHandoffComplete();
      setFading(true);
    }, 3100);

    // COMPLETE STATE
    const t5 = setTimeout(() => {
      if (onComplete) onComplete();
    }, 4500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [onBlendStart, onComplete, onTextHandoffComplete, onTextHandoffStart]);

  return (
    <div className={`cinematic-intro-wrapper ${fading ? 'fade-out' : ''}`} ref={wrapperRef}>
      <div className="cinematic-brand-text" ref={textRef}>
        PIXELNOVA
      </div>
    </div>
  );
}

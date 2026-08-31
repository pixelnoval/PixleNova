import { useEffect, useRef } from 'react';

export function useStarfield() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let stars = [];
    let animationFrameId;

    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const handleMouseMove = (e) => {
      targetMouseX = (e.clientX / window.innerWidth) - 0.5;
      targetMouseY = (e.clientY / window.innerHeight) - 0.5;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const resizeStars = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
      
      const numStars = Math.min(130, Math.floor(window.innerWidth / 12));
      stars = Array.from({ length: numStars }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 0.9 + 0.15,
        a: Math.random() * 0.35 + 0.05,
        s: Math.random() * 0.08 + 0.01
      }));
    };

    const drawStars = () => {
      mouseX += (targetMouseX - mouseX) * 0.03;
      mouseY += (targetMouseY - mouseY) * 0.03;
      
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (const s of stars) {
        s.y += s.s;
        if (s.y > window.innerHeight) s.y = 0;
        
        const pX = s.x - (mouseX * s.r * 20);
        const pY = s.y - (mouseY * s.r * 20);
        
        let rX = pX;
        let rY = pY;
        if (rX < -10) rX += window.innerWidth + 20;
        if (rX > window.innerWidth + 10) rX -= window.innerWidth + 20;
        if (rY < -10) rY += window.innerHeight + 20;
        if (rY > window.innerHeight + 10) rY -= window.innerHeight + 20;
        
        ctx.globalAlpha = s.a;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(rX, rY, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      animationFrameId = requestAnimationFrame(drawStars);
    };

    window.addEventListener('resize', resizeStars, { passive: true });
    resizeStars();
    drawStars();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', resizeStars);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return canvasRef;
}

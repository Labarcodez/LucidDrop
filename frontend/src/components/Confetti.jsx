import React, { useEffect, useRef } from 'react';

export const Confetti = ({ active, onComplete }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#00ff88', '#ff00cc', '#00ccff', '#ff8800', '#ffff00', '#ff4444'];
    const pieces = Array.from({ length: 200 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      w: Math.random() * 8 + 4,
      h: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 6,
      vy: Math.random() * 4 + 2,
      rot: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 8,
    }));

    let animationId;
    let frames = 0;
    const maxFrames = 120;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      pieces.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.rotSpeed;
        p.vy += 0.05;
        
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
        ctx.restore();
      });

      frames++;
      if (frames < maxFrames) {
        animationId = requestAnimationFrame(animate);
      } else {
        onComplete();
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [active, onComplete]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
    />
  );
};
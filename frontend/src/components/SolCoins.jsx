import React, { useEffect, useRef } from 'react';

export const SolCoins = ({ active, onComplete }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const coins = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      size: Math.random() * 20 + 10,
      speed: Math.random() * 3 + 2,
      wobble: Math.random() * 4,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 4,
    }));

    let animationId;
    let frames = 0;
    const maxFrames = 90;

    const drawCoin = (ctx, x, y, size, rotation) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((rotation * Math.PI) / 180);
      
      // Coin circle
      ctx.beginPath();
      ctx.arc(0, 0, size/2, 0, Math.PI * 2);
      ctx.fillStyle = '#00ff88';
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.strokeStyle = '#00ccff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // "SOL" text
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#050508';
      ctx.font = `${size * 0.5}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✦', 0, 2);
      
      ctx.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      coins.forEach(c => {
        c.y += c.speed;
        c.x += Math.sin(c.y * 0.02) * c.wobble;
        c.rotation += c.rotSpeed;
        if (c.y < canvas.height + 50) {
          drawCoin(ctx, c.x, c.y, c.size, c.rotation);
        }
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
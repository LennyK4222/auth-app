'use client';

import { useEffect, useRef, useState } from 'react';

export default function ParticleNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasEl = canvas as HTMLCanvasElement;

    const ctx = canvasEl.getContext('2d')!;

    let particles: Particle[] = [];
    let animationId: number;
    let resizeTimer: NodeJS.Timeout;

    class Particle {
      x: number; y: number; vx: number; vy: number; radius: number; opacity: number;

      constructor() {
        this.x = Math.random() * canvasEl.width;
        this.y = Math.random() * canvasEl.height;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.radius = Math.random() * 1.5 + 1;
        this.opacity = Math.random() * 0.3 + 0.7;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > canvasEl.width) this.vx = -this.vx;
        if (this.y < 0 || this.y > canvasEl.height) this.vy = -this.vy;
        this.x = Math.max(0, Math.min(canvasEl.width, this.x));
        this.y = Math.max(0, Math.min(canvasEl.height, this.y));
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 5, 0, Math.PI * 2);
        const glowGradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 5);
        glowGradient.addColorStop(0, `rgba(59, 130, 246, ${this.opacity * 0.3})`);
        glowGradient.addColorStop(0.5, `rgba(147, 197, 253, ${this.opacity * 0.2})`);
        glowGradient.addColorStop(1, 'rgba(147, 197, 253, 0)');
        ctx.fillStyle = glowGradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${this.opacity})`);
        gradient.addColorStop(0.5, `rgba(147, 197, 253, ${this.opacity})`);
        gradient.addColorStop(1, `rgba(59, 130, 246, ${this.opacity * 0.8})`);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity * 0.9})`;
        ctx.fill();
      }
    }

    const drawConnections = () => {
      const maxDistance = 120;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < maxDistance) {
            const opacity = (1 - distance / maxDistance) * 0.6;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.shadowBlur = 3;
            ctx.shadowColor = 'rgba(147, 197, 253, 0.8)';
            const gradient = ctx.createLinearGradient(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
            gradient.addColorStop(0, `rgba(147, 197, 253, ${opacity * particles[i].opacity})`);
            gradient.addColorStop(0.5, `rgba(96, 165, 250, ${opacity})`);
            gradient.addColorStop(1, `rgba(147, 197, 253, ${opacity * particles[j].opacity})`);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
      particles.forEach(p => p.update());
      drawConnections();
      particles.forEach(p => p.draw());
      animationId = requestAnimationFrame(animate);
    };

    const init = () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (canvasEl) {
        canvasEl.width = window.innerWidth;
        canvasEl.height = window.innerHeight;
      }
      particles = [];
      const particleCount = window.innerWidth < 768 ? 100 : 200;
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
      animate();
    };

    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(init, 100);
    };

    init();
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(resizeTimer);
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isClient]);

  if (!isClient) {
    return <div className="absolute inset-0 bg-black" />;
  }

  return (
    <>
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at center, #0a1628 0%, #020817 40%, #000000 100%)` }} />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 60%)', filter: 'blur(80px)', animation: 'slowDrift 30s ease-in-out infinite' }} />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, transparent 60%)', filter: 'blur(80px)', animation: 'slowDrift 35s ease-in-out infinite reverse' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(96, 165, 250, 0.1) 0%, transparent 50%)', filter: 'blur(100px)' }} />
      </div>
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.4) 100%)` }} />
      <style jsx>{` @keyframes slowDrift { 0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.5; } 33% { transform: translate(50px, -50px) scale(1.1); opacity: 0.3; } 66% { transform: translate(-30px, 30px) scale(0.95); opacity: 0.6; } } `}</style>
    </>
  );
}


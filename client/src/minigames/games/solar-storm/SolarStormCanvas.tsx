import { useEffect, useRef } from 'react';
import type { SolarStormData } from './SolarStormEngine';

interface SolarStormCanvasProps {
  data: SolarStormData;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  deflected: boolean;
}

export function SolarStormCanvas({ data }: SolarStormCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    const particles = particlesRef.current;

    const render = () => {
      time += 0.03;
      const w = canvas.width;
      const h = canvas.height;

      // Fondo del espacio interplanetario profundo
      ctx.fillStyle = '#060a12';
      ctx.fillRect(0, 0, w, h);

      // Estrellas lejanas estáticas de fondo
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      for (let i = 0; i < 40; i++) {
        const sx = ((i * 73 + 17) % w);
        const sy = ((i * 47 + 29) % h);
        ctx.fillRect(sx, sy, 1, 1);
      }

      // 1. El Sol (Lado izquierdo)
      const sunX = -20;
      const sunY = h / 2;
      const sunRadius = 75;

      // Resplandor de la corona solar
      const isFlareActive =
        data.activeAlert?.type === 'FLR' || data.activeImpact?.type === 'FLR';
      const coronaSize = isFlareActive ? 140 : 105;

      const sunGlow = ctx.createRadialGradient(sunX, sunY, 30, sunX, sunY, coronaSize);
      sunGlow.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
      sunGlow.addColorStop(0.35, isFlareActive ? 'rgba(239, 68, 68, 0.85)' : 'rgba(249, 115, 22, 0.7)');
      sunGlow.addColorStop(0.7, 'rgba(234, 88, 12, 0.25)');
      sunGlow.addColorStop(1, 'transparent');

      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, coronaSize, 0, Math.PI * 2);
      ctx.fill();

      // Disco del Sol
      ctx.fillStyle = isFlareActive ? '#fef08a' : '#f59e0b';
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
      ctx.fill();

      // Llamarada solar activa (Bucle coronal brillante)
      if (isFlareActive) {
        ctx.save();
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 4 + Math.sin(time * 8) * 2;
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(sunX + sunRadius * 0.9, sunY, 35, -Math.PI / 3, Math.PI / 3);
        ctx.stroke();
        ctx.restore();
      }

      // 2. Marte y la Base de Investigación (Lado derecho)
      const marsX = w - 85;
      const marsY = h / 2;
      const marsRadius = 42;

      // Atmósfera fina de Marte
      const marsGlow = ctx.createRadialGradient(marsX, marsY, marsRadius - 4, marsX, marsY, marsRadius + 14);
      marsGlow.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
      marsGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = marsGlow;
      ctx.beginPath();
      ctx.arc(marsX, marsY, marsRadius + 14, 0, Math.PI * 2);
      ctx.fill();

      // Disco planetario de Marte
      const marsGrad = ctx.createLinearGradient(marsX - marsRadius, marsY, marsX + marsRadius, marsY);
      marsGrad.addColorStop(0, '#c2410c'); // Lado iluminado
      marsGrad.addColorStop(0.7, '#9a3412');
      marsGrad.addColorStop(1, '#431407'); // Lado oscuro
      ctx.fillStyle = marsGrad;
      ctx.beginPath();
      ctx.arc(marsX, marsY, marsRadius, 0, Math.PI * 2);
      ctx.fill();

      // Casquete polar marciano
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.beginPath();
      ctx.ellipse(marsX, marsY - marsRadius + 6, 12, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Base marciana (Módulos cúpula y antena)
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(marsX - marsRadius * 0.45, marsY, 6, 0, Math.PI * 2);
      ctx.fill();

      // 3. Sistemas defensivos visuales
      const { shield, shelter, panelsProtected, purge } = data.defenses;

      // Búnker de Regolito subterráneo (Aura ámbar de protección)
      if (shelter) {
        ctx.save();
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(marsX - marsRadius * 0.45, marsY, 13, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Paneles solares protegidos
      if (panelsProtected) {
        ctx.fillStyle = '#34d399';
        ctx.fillRect(marsX - marsRadius * 0.45 - 8, marsY + 9, 16, 3);
      } else {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(marsX - marsRadius * 0.45 - 14, marsY + 9, 28, 3);
      }

      // Disipador iónico de sobrecarga
      if (purge) {
        ctx.save();
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 12;
        for (let k = 0; k < 3; k++) {
          const sparkAngle = time * 6 + (k * Math.PI * 2) / 3;
          ctx.beginPath();
          ctx.moveTo(marsX, marsY);
          ctx.lineTo(marsX + Math.cos(sparkAngle) * 55, marsY + Math.sin(sparkAngle) * 55);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Deflector Magnético Toroidal (Burbuja de plasma)
      if (shield) {
        ctx.save();
        const pulse = Math.sin(time * 5) * 3;
        const shieldR = marsRadius + 24 + pulse;

        // Doble arco deflector frontal encarando al Sol
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#0284c7';
        ctx.shadowBlur = 20;

        ctx.beginPath();
        ctx.arc(marsX, marsY, shieldR, Math.PI * 0.55, Math.PI * 1.45);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(125, 211, 252, 0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(marsX, marsY, shieldR + 8, Math.PI * 0.6, Math.PI * 1.4);
        ctx.stroke();
        ctx.restore();
      }

      // 4. Onda de Choque de Eyección de Masa Coronal (CME)
      if (data.activeImpact?.type === 'CME' || data.activeAlert?.type === 'CME') {
        const isImpact = data.activeImpact?.type === 'CME';
        const progressWave = isImpact
          ? 0.75 + ((time * 0.4) % 0.25)
          : Math.max(0.15, 1.0 - (data.timeToImpactSec / 8.0));

        const waveX = sunX + progressWave * (marsX - sunX);
        const waveSpan = 90;

        ctx.save();
        ctx.strokeStyle = isImpact ? 'rgba(239, 68, 68, 0.9)' : 'rgba(249, 115, 22, 0.7)';
        ctx.lineWidth = 5;
        ctx.shadowColor = '#ea580c';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(waveX, sunY, waveSpan, -Math.PI / 3, Math.PI / 3);
        ctx.stroke();
        ctx.restore();
      }

      // 5. Partículas de viento solar y protones
      const spawnRate = data.activeImpact ? 8 : 3;
      for (let s = 0; s < spawnRate; s++) {
        if (particles.length < 120) {
          const speed = data.activeImpact?.type === 'CME' ? 7 + Math.random() * 5 : 3 + Math.random() * 3;
          particles.push({
            x: sunX + sunRadius + Math.random() * 20,
            y: sunY + (Math.random() - 0.5) * (h * 0.8),
            vx: speed,
            vy: (Math.random() - 0.5) * 1.4,
            size: Math.random() * 2.2 + 1.0,
            color: data.activeImpact ? '#f87171' : '#fde047',
            alpha: 1.0,
            deflected: false,
          });
        }
      }

      // Actualizar y dibujar partículas
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        // Comprobar colisión con escudo magnético
        const dMars = Math.hypot(p.x - marsX, p.y - marsY);
        if (shield && dMars < marsRadius + 32 && p.x < marsX) {
          p.deflected = true;
          p.vx = -p.vx * 0.3 + 1.2;
          p.vy = (p.y > marsY ? 1 : -1) * (5 + Math.random() * 3);
          p.color = '#38bdf8';
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        if (p.x > w + 20 || p.y < -20 || p.y > h + 20) {
          particles.splice(i, 1);
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [data]);

  return (
    <div className="solar-canvas-wrapper">
      <canvas ref={canvasRef} width={580} height={240} className="solar-canvas" />
    </div>
  );
}

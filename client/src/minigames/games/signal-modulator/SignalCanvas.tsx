import { useEffect, useRef } from 'react';
import type { SignalModulatorData } from './SignalModulatorEngine';

interface SignalCanvasProps {
  data: SignalModulatorData;
}

export function SignalCanvas({ data }: SignalCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const phaseRef = useRef(0);
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const syncCanvasSize = () => {
      const parent = canvas.parentElement;
      const targetW = parent ? Math.max(480, Math.round(parent.clientWidth)) : 1080;
      const targetH = parent ? Math.max(200, Math.round(parent.clientHeight)) : 320;
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
    };

    syncCanvasSize();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(syncCanvasSize) : null;
    if (observer && canvas.parentElement) {
      observer.observe(canvas.parentElement);
    }

    const render = () => {
      phaseRef.current += 0.012;
      const phase = phaseRef.current;
      const d = dataRef.current;

      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      // 1. Fondo del osciloscopio: negro CRT profundo
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      // 2. Retícula analógica sutil
      const cols = 10;
      const rows = 8;
      const colStep = width / cols;
      const rowStep = height / rows;

      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
      ctx.lineWidth = 1;

      for (let c = 1; c < cols; c++) {
        const x = c * colStep;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      for (let r = 1; r < rows; r++) {
        const y = r * rowStep;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Eje central
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();
      ctx.restore();

      // Escala visual
      const visualCycles = 2.0;
      const maxAmpY = (height / 2) * 0.75;

      const targetFreqCycles = d.targetFreq * visualCycles;
      const targetAmpY = Math.max(14, d.targetAmp * maxAmpY);

      const playerFreqCycles = d.playerFreq * visualCycles;
      const playerAmpY = Math.max(14, d.playerAmp * maxAmpY);

      const isStorm = d.isJammed;

      // 3. Onda Objetivo (Tierra DSN) - Ámbar cálido
      ctx.save();
      ctx.lineWidth = 3.2;
      ctx.strokeStyle = d.isAligned ? 'rgba(245, 158, 11, 0.35)' : '#f59e0b';
      ctx.beginPath();

      for (let x = 0; x < width; x++) {
        const nx = x / width;
        const angle = nx * targetFreqCycles * Math.PI * 2 + phase;

        let rfNoise = 0;
        if (isStorm) {
          rfNoise = (Math.sin(nx * 120 + phase * 10) * 0.4 + (Math.random() - 0.5)) * 14;
        }

        const y = centerY - Math.sin(angle) * targetAmpY + rfNoise;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();

      // 4. Onda del Jugador (Base) - Azul Cielo
      ctx.save();
      ctx.lineWidth = 3.2;
      ctx.strokeStyle = d.isAligned ? '#22c55e' : '#38bdf8';
      ctx.beginPath();

      for (let x = 0; x < width; x++) {
        const nx = x / width;
        const angle = nx * playerFreqCycles * Math.PI * 2 + phase;
        const y = centerY - Math.sin(angle) * playerAmpY;

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();

      // 5. Interferencia constructiva al estar en fase
      if (d.isAligned) {
        ctx.save();
        ctx.lineWidth = 4.4;
        ctx.strokeStyle = '#22c55e';
        ctx.beginPath();

        for (let x = 0; x < width; x++) {
          const nx = x / width;
          const angle = nx * targetFreqCycles * Math.PI * 2 + phase;
          const y = centerY - Math.sin(angle) * targetAmpY;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // 6. Rótulos en esquinas con tipografía del proyecto (Archivo)
      ctx.save();
      ctx.font = '800 14px "Archivo", sans-serif';

      ctx.fillStyle = '#f59e0b';
      ctx.fillText('● DSN TIERRA', 18, 26);

      ctx.fillStyle = '#38bdf8';
      ctx.fillText('● TU SEÑAL', 148, 26);

      ctx.textAlign = 'right';
      if (d.isAligned) {
        ctx.fillStyle = '#22c55e';
        ctx.fillText('● SINTONIZADO', width - 18, 26);
      } else if (isStorm) {
        ctx.fillStyle = '#fc3d21';
        ctx.fillText('⚡ RUIDO SOLAR', width - 18, 26);
      }

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      observer?.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={1080}
      height={320}
      className="signal-canvas"
      aria-label="Osciloscopio de modulación"
    />
  );
}

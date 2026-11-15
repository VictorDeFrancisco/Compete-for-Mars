import { useEffect, useRef } from 'react';
import {
  playSfxDeflect,
  playSfxError,
  playSfxHeal,
} from '../../../utils/uiAudio';
import type { SolarStormData } from './SolarStormEngine';
import {
  getSolarSceneLayout,
  SOLAR_CANVAS_HEIGHT,
  SOLAR_CANVAS_WIDTH,
} from './solarLayout';
import {
  drawSolarStormScene,
  type FloatingText,
  type RingShockwave,
  type Spark,
} from './solarSceneRenderer';

export {
  getSolarSceneLayout,
  SOLAR_CANVAS_HEIGHT,
  SOLAR_CANVAS_WIDTH,
  type SolarSceneLayout,
} from './solarLayout';

interface SolarStormCanvasProps {
  data: SolarStormData;
}

export function SolarStormCanvas({ data }: SolarStormCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dataRef = useRef<SolarStormData>(data);
  const viewportRef = useRef<{ width: number; height: number }>({
    width: SOLAR_CANVAS_WIDTH,
    height: SOLAR_CANVAS_HEIGHT,
  });
  const sparksRef = useRef<Spark[]>([]);
  const ringsRef = useRef<RingShockwave[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const animFrameRef = useRef<number>(0);

  const prevBlockedCount = useRef(data.blockedCount);
  const prevCriticalCount = useRef(data.criticalParryCount);
  const prevBreachedCount = useRef(data.breachedCount);
  const prevIonsCount = useRef(data.ionsCollectedCount);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Eventos de partículas y efectos visuales (coordenadas relativas a baseX, baseCenterY)
  useEffect(() => {
    const canopyR = 138;

    if (data.criticalParryCount > prevCriticalCount.current) {
      prevCriticalCount.current = data.criticalParryCount;
      playSfxDeflect(true);
      const angleRad = ((data.shieldAngle - 180) * Math.PI) / 180;
      const hitX = Math.sin(angleRad) * canopyR;
      const hitY = -Math.cos(angleRad) * canopyR;

      ringsRef.current.push({ x: hitX, y: hitY, radius: 12, maxRadius: 90, color: '#c084fc', alpha: 1.0 });
      floatingTextsRef.current.push({
        x: hitX - 50,
        y: hitY - 20,
        text: `CRITICAL PARRY! x${data.combo}`,
        color: '#fef08a',
        life: 0,
        maxLife: 40,
      });

      for (let i = 0; i < 45; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 3.5 + Math.random() * 7;
        sparksRef.current.push({
          x: hitX,
          y: hitY,
          vx: Math.cos(ang) * spd,
          vy: -Math.abs(Math.sin(ang) * spd) - 1.8,
          life: 0,
          maxLife: 32 + Math.random() * 16,
          color: Math.random() > 0.4 ? '#fef08a' : '#c084fc',
          size: 2.8,
        });
      }
    } else if (data.blockedCount > prevBlockedCount.current) {
      prevBlockedCount.current = data.blockedCount;
      playSfxDeflect(false);
      const angleRad = ((data.shieldAngle - 180) * Math.PI) / 180;
      const hitX = Math.sin(angleRad) * canopyR;
      const hitY = -Math.cos(angleRad) * canopyR;

      ringsRef.current.push({ x: hitX, y: hitY, radius: 10, maxRadius: 70, color: '#38bdf8', alpha: 0.9 });
      floatingTextsRef.current.push({
        x: hitX - 40,
        y: hitY - 18,
        text: data.combo > 1 ? `COMBO x${data.combo}!` : 'DEFLECTED!',
        color: '#38bdf8',
        life: 0,
        maxLife: 30,
      });

      for (let i = 0; i < 25; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 2.5 + Math.random() * 5.5;
        sparksRef.current.push({
          x: hitX,
          y: hitY,
          vx: Math.cos(ang) * spd,
          vy: -Math.abs(Math.sin(ang) * spd) - 1.2,
          life: 0,
          maxLife: 24 + Math.random() * 14,
          color: '#7dd3fc',
          size: 2.0,
        });
      }
    }

    if (data.breachedCount > prevBreachedCount.current) {
      prevBreachedCount.current = data.breachedCount;
      playSfxError();
      const lastBreached = data.waves.find(w => w.status === 'breached');
      const targetDeg = lastBreached ? lastBreached.template.approachAngleDeg : 180;
      const targetRad = ((targetDeg - 180) * Math.PI) / 180;
      const hitX = Math.sin(targetRad) * 55;
      const hitY = -4;

      ringsRef.current.push({ x: hitX, y: hitY, radius: 12, maxRadius: 90, color: '#ef4444', alpha: 1.0 });
      floatingTextsRef.current.push({
        x: hitX - 40,
        y: hitY - 25,
        text: 'BASE DAMAGED!',
        color: '#f87171',
        life: 0,
        maxLife: 35,
      });

      for (let i = 0; i < 45; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 2.5 + Math.random() * 6;
        sparksRef.current.push({
          x: hitX,
          y: hitY,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - 1,
          life: 0,
          maxLife: 30 + Math.random() * 16,
          color: Math.random() > 0.4 ? '#ef4444' : '#f97316',
          size: 2.6,
        });
      }
    }

    if (data.ionsCollectedCount > prevIonsCount.current) {
      prevIonsCount.current = data.ionsCollectedCount;
      playSfxHeal();
      const angleRad = ((data.shieldAngle - 180) * Math.PI) / 180;
      const px = Math.sin(angleRad) * canopyR;
      const py = -Math.cos(angleRad) * canopyR;

      floatingTextsRef.current.push({
        x: px - 38,
        y: py - 18,
        text: '+12% HP',
        color: '#22c55e',
        life: 0,
        maxLife: 28,
      });

      for (let i = 0; i < 18; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 1.8 + Math.random() * 3.5;
        sparksRef.current.push({
          x: px,
          y: py,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          life: 0,
          maxLife: 20,
          color: '#4ade80',
          size: 1.8,
        });
      }
    }
  }, [data.blockedCount, data.criticalParryCount, data.breachedCount, data.ionsCollectedCount, data.combo]);

  // Observar tamaño real del viewport para evitar deformaciones al escalar o en pantalla completa
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const updateSize = (rect?: DOMRectReadOnly) => {
      const box = rect ?? wrapper.getBoundingClientRect();
      if (box.width > 0 && box.height > 0) {
        viewportRef.current = { width: box.width, height: box.height };
      }
    };

    updateSize();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        updateSize(entry.contentRect);
      }
    });
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  // Bucle de renderizado continuo a 60 fps
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let tick = 0;

    const render = () => {
      tick += 0.04;
      const currentData = dataRef.current;
      const { width: viewW, height: viewH } = viewportRef.current;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const targetPixelW = Math.max(1, Math.round(viewW * dpr));
      const targetPixelH = Math.max(1, Math.round(viewH * dpr));
      if (canvas.width !== targetPixelW || canvas.height !== targetPixelH) {
        canvas.width = targetPixelW;
        canvas.height = targetPixelH;
      }

      const layout = getSolarSceneLayout(viewW, viewH);
      const scaleX = (targetPixelW / Math.max(1, viewW)) * layout.scale;
      const scaleY = (targetPixelH / Math.max(1, viewH)) * layout.scale;

      ctx.save();
      ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);

      if (currentData.shakeIntensity > 0.1) {
        const sx = (Math.random() - 0.5) * currentData.shakeIntensity;
        const sy = (Math.random() - 0.5) * currentData.shakeIntensity;
        ctx.translate(sx, sy);
      }

      drawSolarStormScene({
        ctx,
        layout,
        data: currentData,
        tick,
        sparks: sparksRef.current,
        rings: ringsRef.current,
        floatingTexts: floatingTextsRef.current,
      });

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  return (
    <div ref={wrapperRef} className="solar-canvas-wrapper">
      <canvas
        ref={canvasRef}
        width={SOLAR_CANVAS_WIDTH}
        height={SOLAR_CANVAS_HEIGHT}
        className="solar-canvas"
      />
    </div>
  );
}

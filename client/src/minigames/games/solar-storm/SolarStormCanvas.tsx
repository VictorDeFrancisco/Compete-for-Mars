import { useEffect, useRef } from 'react';
import type { SolarStormData } from './SolarStormEngine';

interface SolarStormCanvasProps {
  data: SolarStormData;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface RingShockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export function SolarStormCanvas({ data }: SolarStormCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dataRef = useRef<SolarStormData>(data);
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

  // Manejo de eventos de partículas y efectos visuales temporales
  useEffect(() => {
    const w = 680;
    const baseX = w / 2; // 340
    const groundY = 415;
    const baseCenterY = groundY - 14;
    const canopyR = 135;

    // 1. Deflexión Crítica (Parry)
    if (data.criticalParryCount > prevCriticalCount.current) {
      prevCriticalCount.current = data.criticalParryCount;
      const angleRad = ((data.shieldAngle - 180) * Math.PI) / 180;
      const hitX = baseX + Math.sin(angleRad) * canopyR;
      const hitY = baseCenterY - Math.cos(angleRad) * canopyR;

      ringsRef.current.push({
        x: hitX,
        y: hitY,
        radius: 12,
        maxRadius: 90,
        color: '#c084fc',
        alpha: 1.0,
      });

      floatingTextsRef.current.push({
        x: hitX - 50,
        y: hitY - 20,
        text: `¡PARRY CRÍTICO! x${data.combo}`,
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
      // 2. Deflexión Normal en el dosel
      prevBlockedCount.current = data.blockedCount;
      const angleRad = ((data.shieldAngle - 180) * Math.PI) / 180;
      const hitX = baseX + Math.sin(angleRad) * canopyR;
      const hitY = baseCenterY - Math.cos(angleRad) * canopyR;

      ringsRef.current.push({
        x: hitX,
        y: hitY,
        radius: 10,
        maxRadius: 70,
        color: '#38bdf8',
        alpha: 0.9,
      });

      floatingTextsRef.current.push({
        x: hitX - 40,
        y: hitY - 18,
        text: data.combo > 1 ? `COMBO x${data.combo}!` : '¡DEFLECTADO!',
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

    // 3. Impacto en la Base Marciana
    if (data.breachedCount > prevBreachedCount.current) {
      prevBreachedCount.current = data.breachedCount;
      const lastBreached = data.waves.find(w => w.status === 'breached');
      const targetDeg = lastBreached ? lastBreached.template.approachAngleDeg : 180;
      const targetRad = ((targetDeg - 180) * Math.PI) / 180;
      const hitX = baseX + Math.sin(targetRad) * 55;
      const hitY = groundY - 18;

      ringsRef.current.push({
        x: hitX,
        y: hitY,
        radius: 12,
        maxRadius: 90,
        color: '#ef4444',
        alpha: 1.0,
      });

      floatingTextsRef.current.push({
        x: hitX - 40,
        y: hitY - 25,
        text: '¡DAÑO EN BASE!',
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

    // 4. Captura de iones
    if (data.ionsCollectedCount > prevIonsCount.current) {
      prevIonsCount.current = data.ionsCollectedCount;
      const angleRad = ((data.shieldAngle - 180) * Math.PI) / 180;
      const px = baseX + Math.sin(angleRad) * canopyR;
      const py = baseCenterY - Math.cos(angleRad) * canopyR;

      floatingTextsRef.current.push({
        x: px - 38,
        y: py - 18,
        text: '+12% VIDA',
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
      const w = canvas.width;
      const h = canvas.height;
      const baseX = w / 2; // 340
      const groundY = 415;
      const baseCenterY = groundY - 14;
      const canopyR = 135;

      ctx.save();

      // Screen shake en impactos fuertes
      if (currentData.shakeIntensity > 0.1) {
        const sx = (Math.random() - 0.5) * currentData.shakeIntensity;
        const sy = (Math.random() - 0.5) * currentData.shakeIntensity;
        ctx.translate(sx, sy);
      }

      // 1. Cielo crepuscular marciano profundo (Amplio y alto)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
      skyGrad.addColorStop(0, '#090308');
      skyGrad.addColorStop(0.35, '#220b08');
      skyGrad.addColorStop(0.7, '#4c1708');
      skyGrad.addColorStop(1, '#7c2d12');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Estrellas en el cielo marciano
      for (let i = 0; i < 60; i++) {
        const sx = (i * 97 + 17) % w;
        const sy = (i * 47 + 11) % (groundY - 60);
        const alpha = 0.2 + 0.35 * Math.sin(tick * 2 + i);
        ctx.fillStyle = `rgba(255, 240, 220, ${alpha})`;
        ctx.fillRect(sx, sy, 1.3, 1.3);
      }

      // Auroras atmosféricas marcianas
      ctx.save();
      ctx.globalAlpha = 0.22 + 0.12 * Math.sin(tick * 1.5);
      const auroraGrad = ctx.createLinearGradient(0, 20, 0, 160);
      auroraGrad.addColorStop(0, '#22c55e');
      auroraGrad.addColorStop(0.6, '#a855f7');
      auroraGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = auroraGrad;
      ctx.beginPath();
      ctx.moveTo(0, 80);
      for (let x = 0; x <= w; x += 45) {
        const ay = 65 + Math.sin(tick + x * 0.02) * 24 + Math.cos(tick * 2 + x * 0.04) * 12;
        ctx.lineTo(x, ay);
      }
      ctx.lineTo(w, 0);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // El Sol visto desde Marte
      const sunX = 100;
      const sunY = 65;
      const sunGlow = ctx.createRadialGradient(sunX, sunY, 6, sunX, sunY, 70);
      sunGlow.addColorStop(0, 'rgba(255, 255, 240, 0.95)');
      sunGlow.addColorStop(0.25, 'rgba(251, 191, 36, 0.6)');
      sunGlow.addColorStop(0.65, 'rgba(234, 88, 12, 0.2)');
      sunGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 70, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 14, 0, Math.PI * 2);
      ctx.fill();

      // 2. Montañas y cráteres marcianos en el horizonte
      ctx.fillStyle = '#3f1306';
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(0, groundY - 65);
      ctx.lineTo(85, groundY - 90);
      ctx.lineTo(170, groundY - 62);
      ctx.lineTo(270, groundY - 95);
      ctx.lineTo(370, groundY - 68);
      ctx.lineTo(470, groundY - 92);
      ctx.lineTo(570, groundY - 64);
      ctx.lineTo(w, groundY - 75);
      ctx.lineTo(w, groundY);
      ctx.closePath();
      ctx.fill();

      // Capa media de dunas
      ctx.fillStyle = '#5c1d09';
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(0, groundY - 38);
      ctx.bezierCurveTo(110, groundY - 52, 220, groundY - 28, 340, groundY - 44);
      ctx.bezierCurveTo(460, groundY - 56, 570, groundY - 32, w, groundY - 42);
      ctx.lineTo(w, groundY);
      ctx.closePath();
      ctx.fill();

      // Suelo marciano (regolito rojo)
      const groundGrad = ctx.createLinearGradient(0, groundY - 18, 0, h);
      groundGrad.addColorStop(0, '#9a3412');
      groundGrad.addColorStop(0.35, '#7c2d12');
      groundGrad.addColorStop(1, '#431407');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, groundY - 16, w, h - (groundY - 16));

      // Rocas en el terreno
      ctx.fillStyle = 'rgba(67, 20, 7, 0.7)';
      for (let r = 0; r < 28; r++) {
        const rx = (r * 73 + 23) % w;
        const ry = groundY + ((r * 19) % (h - groundY - 40));
        ctx.beginPath();
        ctx.ellipse(rx, ry, 7 + (r % 4), 3.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. LA BASE MARCIANA (Ares Base Alpha) en el suelo
      // Módulo 1 (Izquierda, x = 180..220): Paneles Solares
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(180, groundY - 24, 38, 24);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      for (let p = 0; p < 4; p++) {
        ctx.strokeRect(182 + p * 9, groundY - 22, 7, 20);
      }
      ctx.fillStyle = currentData.colonyIntegrity > 30 ? '#4ade80' : '#ef4444';
      ctx.fillRect(222, groundY - 14, 5, 12);

      // Módulo 2 (Medio-Izq, x = 235..280): Soporte Vital / Tanques O2
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.roundRect(238, groundY - 32, 18, 32, 4);
      ctx.roundRect(260, groundY - 28, 16, 28, 4);
      ctx.fill();
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(256, groundY - 18);
      ctx.lineTo(294, groundY - 18);
      ctx.stroke();

      // Módulo 3 (CENTRO, x = 295..385): CÚPULA BIOCLIMÁTICA CENTRAL
      const domeGlow = ctx.createRadialGradient(baseX, groundY - 14, 10, baseX, groundY - 14, 52);
      domeGlow.addColorStop(0, 'rgba(254, 240, 138, 0.85)');
      domeGlow.addColorStop(0.5, 'rgba(56, 189, 248, 0.4)');
      domeGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = domeGlow;
      ctx.beginPath();
      ctx.arc(baseX, groundY - 12, 52, Math.PI, 0);
      ctx.fill();

      ctx.fillStyle = 'rgba(241, 245, 249, 0.25)';
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(baseX, groundY - 12, 45, Math.PI, 0);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1.2;
      for (let a = 1; a < 5; a++) {
        const ang = Math.PI + (a * Math.PI) / 5;
        ctx.beginPath();
        ctx.moveTo(baseX, groundY - 12);
        ctx.lineTo(baseX + Math.cos(ang) * 45, groundY - 12 + Math.sin(ang) * 45);
        ctx.stroke();
      }

      ctx.fillStyle = '#334155';
      ctx.fillRect(baseX - 10, groundY - 22, 20, 22);
      ctx.fillStyle = currentData.colonyIntegrity > 30 ? '#38bdf8' : '#ef4444';
      ctx.fillRect(baseX - 5, groundY - 16, 10, 8);

      // Módulo 4 (Medio-Der, x = 398..446): Laboratorio y Hábitat
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.roundRect(398, groundY - 30, 48, 30, 5);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(406, groundY - 24, 8, 7);
      ctx.fillRect(420, groundY - 24, 8, 7);
      ctx.fillRect(434, groundY - 24, 8, 7);

      // Módulo 5 (Derecha, x = 460..495): Torre de Telecomunicaciones
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(475, groundY);
      ctx.lineTo(475, groundY - 65);
      ctx.moveTo(466, groundY);
      ctx.lineTo(475, groundY - 40);
      ctx.moveTo(484, groundY);
      ctx.lineTo(475, groundY - 40);
      ctx.stroke();

      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.arc(475, groundY - 62, 12, -Math.PI / 1.5, Math.PI / 4);
      ctx.stroke();

      ctx.fillStyle = Math.sin(tick * 8) > 0 ? '#ef4444' : '#7f1d1d';
      ctx.beginPath();
      ctx.arc(475, groundY - 68, 4, 0, Math.PI * 2);
      ctx.fill();

      // 4. EL ESCUDO DEFLECTOR CANOPY (Cubre ~30% de la base, nunca el 90%)
      const centerRad = ((currentData.shieldAngle - 180) * Math.PI) / 180;
      const spanRad = (currentData.shieldWidthDeg * Math.PI) / 180;
      const arcCenterCanvas = -Math.PI / 2 + centerRad;
      const startAngle = arcCenterCanvas - spanRad / 2;
      const endAngle = arcCenterCanvas + spanRad / 2;

      ctx.save();
      // Guía de carril orbital tenue
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(baseX, baseCenterY, canopyR, -Math.PI + 0.35, -0.35);
      ctx.stroke();
      ctx.setLineDash([]);

      if (currentData.isBoosting) {
        // Super-Escudo ampliado y sobrecargado
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 9;
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 26;
        ctx.beginPath();
        ctx.arc(baseX, baseCenterY, canopyR, startAngle, endAngle);
        ctx.stroke();

        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(baseX, baseCenterY, canopyR + 4, startAngle, endAngle);
        ctx.stroke();
      } else {
        // Escudo deflector estándar
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 6;
        ctx.shadowColor = '#0284c7';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(baseX, baseCenterY, canopyR, startAngle, endAngle);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(baseX, baseCenterY, canopyR + 2, startAngle, endAngle);
        ctx.stroke();
      }
      ctx.restore();

      // Puntero de energía del escudo
      const tipX = baseX + Math.cos(arcCenterCanvas) * (canopyR + 9);
      const tipY = baseCenterY + Math.sin(arcCenterCanvas) * (canopyR + 9);
      ctx.fillStyle = currentData.isBoosting ? '#fef08a' : '#38bdf8';
      ctx.beginPath();
      ctx.arc(tipX, tipY, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // 5. ONDAS DE TORMENTA SOLAR: PUNTO EN LA CABEZA Y ESTELA DETRÁS (SIN PUNTOS PERMANENTES)
      for (const wave of currentData.waves) {
        if (wave.status !== 'in_flight') continue;

        const targetDeg = wave.template.approachAngleDeg;
        const targetRad = ((targetDeg - 180) * Math.PI) / 180;

        // Punto de intercepción en el arco del dosel
        const canopyHitX = baseX + Math.sin(targetRad) * canopyR;
        const canopyHitY = baseCenterY - Math.cos(targetRad) * canopyR;

        // Origen en el cielo
        const skyX = baseX + Math.sin(targetRad) * (canopyR + 250);
        const skyY = 15;

        // Posición de la cabeza del rayo
        const p = wave.flightProgress;
        const curX = skyX + p * (canopyHitX - skyX);
        const curY = skyY + p * (canopyHitY - skyY);

        const dx = canopyHitX - skyX;
        const dy = canopyHitY - skyY;
        const dist = Math.hypot(dx, dy) || 1;
        const ux = dx / dist;
        const uy = dy / dist;

        const tailLen = Math.min(60, p * 85);
        const tailX = curX - ux * tailLen;
        const tailY = curY - uy * tailLen;

        ctx.save();

        // 1. Estela de plasma con degradado (detrás de la cabeza)
        const tailGrad = ctx.createLinearGradient(tailX, tailY, curX, curY);
        tailGrad.addColorStop(0, 'transparent');
        tailGrad.addColorStop(1, wave.template.color);

        ctx.strokeStyle = tailGrad;
        ctx.lineWidth = wave.template.type === 'CME' ? 7 : wave.template.type === 'FLR' ? 5 : 4;
        ctx.shadowColor = wave.template.color;
        ctx.shadowBlur = 16;

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(curX, curY);
        ctx.stroke();

        // 2. Núcleo blanco caliente en la estela
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(curX - ux * (tailLen * 0.45), curY - uy * (tailLen * 0.45));
        ctx.lineTo(curX, curY);
        ctx.stroke();

        // 3. ¡EL PUNTO DELANTE! (Liderando el frente)
        const pointR = wave.template.type === 'CME' ? 7 : 5.5;

        ctx.fillStyle = wave.template.color;
        ctx.shadowColor = wave.template.color;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(curX, curY, pointR, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(curX + ux * 1.5, curY + uy * 1.5, pointR * 0.55, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // 6. Orbes Verdes Curativos descendiendo hacia la base (+12% vida de la base)
      for (const ion of currentData.ionOrbs) {
        if (ion.collected || ion.flightProgress <= 0 || ion.flightProgress >= 1.0) continue;
        const p = ion.flightProgress;
        const targetRad = ((ion.approachAngleDeg - 180) * Math.PI) / 180;
        const canopyHitX = baseX + Math.sin(targetRad) * canopyR;
        const canopyHitY = baseCenterY - Math.cos(targetRad) * canopyR;
        const skyX = baseX + Math.sin(targetRad) * (canopyR + 220);
        const skyY = 20;

        const curX = skyX + p * (canopyHitX - skyX);
        const curY = skyY + p * (canopyHitY - skyY);
        const orbR = 6.2 + Math.sin(tick * 10) * 1.1;

        ctx.save();
        ctx.fillStyle = '#22c55e';
        ctx.strokeStyle = '#ecfdf5';
        ctx.lineWidth = 1.4;
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(curX, curY, orbR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(curX - 3, curY);
        ctx.lineTo(curX + 3, curY);
        ctx.moveTo(curX, curY - 3);
        ctx.lineTo(curX, curY + 3);
        ctx.stroke();
        ctx.restore();
      }

      // 7. Anillos de Choque Expansivos Temporales
      const rings = ringsRef.current;
      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i];
        r.radius += 4.0;
        r.alpha -= 0.035;

        if (r.alpha <= 0 || r.radius >= r.maxRadius) {
          rings.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.strokeStyle = r.color;
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = Math.max(0, r.alpha);
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 8. Chispas de Plasma Temporales
      const sparks = sparksRef.current;
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.life++;

        const alpha = 1.0 - s.life / s.maxLife;
        if (s.life >= s.maxLife || alpha <= 0) {
          sparks.splice(i, 1);
          continue;
        }

        ctx.fillStyle = s.color;
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // 9. Textos Flotantes Arcade Temporales
      const texts = floatingTextsRef.current;
      for (let i = texts.length - 1; i >= 0; i--) {
        const t = texts[i];
        t.life++;
        t.y -= 0.8;

        const alpha = 1.0 - t.life / t.maxLife;
        if (t.life >= t.maxLife || alpha <= 0) {
          texts.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.font = 'bold 13px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
        ctx.fillStyle = t.color;
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 6;
        ctx.fillText(t.text, t.x, t.y);
        ctx.restore();
      }

      // 10. Insignia de Combo Activo en el Canvas
      if (currentData.combo > 1) {
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = currentData.combo >= 4 ? '#f59e0b' : '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(w - 130, 12, 118, 28, 6);
        ctx.fill();
        ctx.stroke();

        ctx.font = '800 13px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
        ctx.fillStyle = currentData.combo >= 4 ? '#fef08a' : '#38bdf8';
        ctx.fillText(`⚡ COMBO x${currentData.combo}`, w - 120, 31);
        ctx.restore();
      }

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  return (
    <div className="solar-canvas-wrapper">
      <canvas
        ref={canvasRef}
        width={680}
        height={480}
        className="solar-canvas"
      />
    </div>
  );
}

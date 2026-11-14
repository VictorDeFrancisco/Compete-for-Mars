import { marsRoverDefinition } from '../../../../../shared/minigames/marsRover';
import { BaseMinigame, type ActionState } from '../../core/BaseMinigame';
import type { MinigameContext } from '../../../../../shared/minigames/context';
import {
  generateMarsSector,
  MAP_SIZE,
  MARS_GRAVITY,
  type MarsSectorMap,
} from './jezeroMapData';
import type { NasaMarsTelemetry } from './nasaMarsApi';

export interface MarsRoverData {
  posX: number; // Metros (0..180)
  posY: number; // Metros (0..180)
  vx: number; // m/s
  vy: number; // m/s
  speed: number; // m/s
  heading: number; // Grados (0 = Norte, 90 = Este, etc.)
  pitchDeg: number; // Inclinación longitudinal del rover (morro arriba/abajo)
  rollDeg: number; // Inclinación lateral del rover (balanceo en ladera)
  suspensionOffset: number; // Desplazamiento vertical de suspensión (metros)
  angularVelocity: number; // deg/s
  energy: number; // 0..100 % (drena de forma realista)
  slopeDeg: number; // Grados de inclinación del terreno actual
  elevation: number; // Cota en metros (-6m a +18m)
  isStalled: boolean;
  lastEventMessage: string;
  movesCount: number;
  path: Array<{ x: number; y: number; heading: number }>;
  telemetry: NasaMarsTelemetry | null;
  sector: MarsSectorMap;
}

export class MarsRoverGame extends BaseMinigame<MarsRoverData> {
  readonly sector: MarsSectorMap;

  private inputState = {
    forward: false,
    reverse: false,
    turnLeft: false,
    turnRight: false,
    brake: false,
  };

  private suspensionVelocity = 0;
  private lastPathRecordTime = 0;

  constructor(
    definition = marsRoverDefinition,
    clock?: () => number,
    context?: MinigameContext,
    seed?: number
  ) {
    const sector = generateMarsSector(seed);
    const initialElevation = Math.round(sector.elevationAt(sector.startPos.x, sector.startPos.y) * 10) / 10;
    const initialData: MarsRoverData = {
      posX: sector.startPos.x,
      posY: sector.startPos.y,
      vx: 0,
      vy: 0,
      speed: 0,
      heading: sector.startPos.heading,
      pitchDeg: 0,
      rollDeg: 0,
      suspensionOffset: 0,
      angularVelocity: 0,
      energy: 100,
      slopeDeg: 0,
      elevation: initialElevation,
      isStalled: false,
      lastEventMessage: `Rover desplegado en ${sector.sectorName}. Conduce en 3D con suspensión activa.`,
      movesCount: 0,
      path: [{ x: sector.startPos.x, y: sector.startPos.y, heading: sector.startPos.heading }],
      telemetry: null,
      sector,
    };

    super(definition, initialData, clock, context);
    this.sector = sector;
  }

  public setTelemetry(telemetry: NasaMarsTelemetry): void {
    if (this.getSnapshot().status === 'running') {
      this.setData({ ...this.getSnapshot().data, telemetry });
    }
  }

  protected onAction(actionId: string, state: ActionState): void {
    const isPressed = state === 'press';

    if (actionId === 'forward') this.inputState.forward = isPressed;
    else if (actionId === 'reverse') this.inputState.reverse = isPressed;
    else if (actionId === 'turn-left') this.inputState.turnLeft = isPressed;
    else if (actionId === 'turn-right') this.inputState.turnRight = isPressed;
    else if (actionId === 'brake') this.inputState.brake = isPressed;
  }

  protected onUpdate(deltaMs: number): void {
    if (this.getSnapshot().status !== 'running') return;
    if (deltaMs <= 0) return;

    let {
      posX,
      posY,
      vx,
      vy,
      heading,
      pitchDeg,
      rollDeg,
      suspensionOffset,
      angularVelocity,
      energy,
      lastEventMessage,
      path,
    } = this.getSnapshot().data;

    const roverMass = 750;
    const maxMotorForce = 4600 * this.modifiers.speedMultiplier;
    const steeringTorque = 195;

    // Sub-pasos de física para integración continua
    const totalDt = Math.min(0.8, deltaMs / 1000);
    const subSteps = Math.min(10, Math.max(1, Math.ceil(totalDt / 0.02)));
    const dt = totalDt / subSteps;

    let isStalled = false;
    let currentSlopeDeg = 0;

    for (let step = 0; step < subSteps; step++) {
      const headingRad = (heading * Math.PI) / 180;
      const ufX = Math.sin(headingRad);
      const ufY = -Math.cos(headingRad);
      const urX = Math.cos(headingRad);
      const urY = Math.sin(headingRad);

      // 1. Giro del rover
      let angAccel = 0;
      if (this.inputState.turnLeft) angAccel -= steeringTorque;
      if (this.inputState.turnRight) angAccel += steeringTorque;

      angularVelocity = (angularVelocity + angAccel * dt) * Math.exp(-6.5 * dt);
      heading = (heading + angularVelocity * dt) % 360;
      if (heading < 0) heading += 360;

      // 2. Gravedad del terreno (F = -m * g * sin(theta))
      const { gx, gy, slopeDeg } = this.sector.gradientAt(posX, posY);
      const { fx: fGravX, fy: fGravY } = this.sector.gravityForceAt(posX, posY, roverMass);
      currentSlopeDeg = slopeDeg;

      // Cálculo de Pitch y Roll del chasis según la orientación en la ladera
      const gLong = gx * ufX + gy * ufY; // Pendiente longitudinal
      const gLat = gx * urX + gy * urY; // Pendiente transversal
      const targetPitch = Math.atan(gLong) * (180 / Math.PI);
      const targetRoll = Math.atan(gLat) * (180 / Math.PI);

      // Amortiguamiento suave de cabeceo y balanceo
      pitchDeg += (targetPitch - pitchDeg) * Math.min(1.0, 10.0 * dt);
      rollDeg += (targetRoll - rollDeg) * Math.min(1.0, 10.0 * dt);

      // 3. Físicas visuales de suspensión (muelle-amortiguador masa-resorte)
      const currentSpeed = Math.hypot(vx, vy);
      const bumpExcitation = Math.sin((posX + posY) * 2.2) * (currentSpeed * 0.04);
      const springK = 80.0;
      const dampingC = 12.0;
      const fSuspension = -springK * suspensionOffset - dampingC * this.suspensionVelocity + bumpExcitation * 15.0;
      this.suspensionVelocity += (fSuspension / 300) * dt;
      suspensionOffset += this.suspensionVelocity * dt;
      suspensionOffset = Math.max(-0.25, Math.min(0.25, suspensionOffset));

      // 4. Tracción motriz
      let tractionFactor = 1.0;
      if (slopeDeg > 20) {
        tractionFactor = Math.max(0.18, 1.0 - (slopeDeg - 20) / 14);
        if (slopeDeg > 30) isStalled = true;
      }

      let motorForce = 0;
      if (this.inputState.forward) motorForce = maxMotorForce * tractionFactor;
      else if (this.inputState.reverse) motorForce = -maxMotorForce * 0.7 * tractionFactor;

      const fMotorX = ufX * motorForce;
      const fMotorY = ufY * motorForce;

      // 5. Rozamiento y agarre
      const frictionCoeff = this.sector.frictionAt(posX, posY);
      const vLong = vx * ufX + vy * ufY;
      const vLat = vx * urX + vy * urY;

      const fRoll = roverMass * MARS_GRAVITY * frictionCoeff;
      const fRollLong = -Math.sign(vLong) * Math.min(Math.abs(vLong) * 420, fRoll);
      const fGripLat = -vLat * roverMass * 9.5;

      let fBrakeLong = 0;
      if (this.inputState.brake) {
        fBrakeLong = -Math.sign(vLong) * roverMass * 8.5;
      }

      const totalFx = fGravX + fMotorX + (fRollLong + fBrakeLong) * ufX + fGripLat * urX;
      const totalFy = fGravY + fMotorY + (fRollLong + fBrakeLong) * ufY + fGripLat * urY;

      // 6. Integración
      const ax = totalFx / roverMass;
      const ay = totalFy / roverMass;

      vx = (vx + ax * dt) * Math.exp(-0.75 * dt);
      vy = (vy + ay * dt) * Math.exp(-0.75 * dt);

      const curSpeed = Math.hypot(vx, vy);
      if (curSpeed > 8.5) {
        const factor = 8.5 / curSpeed;
        vx *= factor;
        vy *= factor;
      }

      posX += vx * dt;
      posY += vy * dt;

      // 7. Colisiones físicas con rocas y peñascos marcianos
      const roverEffectiveRadius = 1.45;
      for (const rock of this.sector.rocks) {
        const dx = posX - rock.x;
        const dy = posY - rock.y;
        const distSq = dx * dx + dy * dy;
        const minSafeDist = rock.radius + roverEffectiveRadius;
        if (distSq < minSafeDist * minSafeDist && distSq > 0.0001) {
          const dist = Math.sqrt(distSq);
          const overlap = minSafeDist - dist;
          const nx = dx / dist;
          const ny = dy / dist;

          // Empuje elástico: resolver penetración para que el rover no atraviese la roca
          posX += nx * overlap;
          posY += ny * overlap;

          // Componente normal de la velocidad
          const vDotN = vx * nx + vy * ny;
          if (vDotN < 0) {
            const restitution = 0.35;
            vx = (vx - (1 + restitution) * vDotN * nx) * 0.65;
            vy = (vy - (1 + restitution) * vDotN * ny) * 0.65;

            // Sacudida física de la suspensión
            const impactForce = Math.abs(vDotN);
            this.suspensionVelocity += impactForce * 1.6;

            // Deflexión angular por choque descentrado
            const crossImpact = ufX * ny - ufY * nx;
            angularVelocity += crossImpact * 40.0;

            // Drenaje de energía si el choque fue a velocidad significativa
            if (impactForce > 0.65) {
              const energyLost = Math.min(2.5, impactForce * 0.7);
              energy = Math.max(0, energy - energyLost);
              lastEventMessage = `¡Colisión con roca marciana! Daño a las orugas y pérdida de energía (-${energyLost.toFixed(1)}%).`;
            }
          }
        }
      }

      // Límites del mapa
      if (posX <= 3 || posX >= MAP_SIZE - 3) {
        vx = -vx * 0.2;
        posX = Math.max(3, Math.min(MAP_SIZE - 3, posX));
      }
      if (posY <= 3 || posY >= MAP_SIZE - 3) {
        vy = -vy * 0.2;
        posY = Math.max(3, Math.min(MAP_SIZE - 3, posY));
      }

      // Consumo realista de batería
      let energyDrain = 0.06 * dt;
      if (Math.abs(motorForce) > 0) {
        energyDrain += (Math.abs(motorForce) / maxMotorForce) * 0.65 * dt;
        if (slopeDeg > 12 && vLong > 0) {
          energyDrain += (slopeDeg / 20) * 1.35 * dt;
        }
      }
      if (this.inputState.brake && vLong > 0.5) {
        energyDrain -= 0.15 * dt;
      }

      energy = Math.max(0, energy - energyDrain);
    }

    const currentSpeed = Math.hypot(vx, vy);

    // Registro de estela
    const now = this.getSnapshot().elapsedMs;
    if (now - this.lastPathRecordTime > 400 && currentSpeed > 0.25) {
      this.lastPathRecordTime = now;
      path = [...path.slice(-180), { x: posX, y: posY, heading }];
    }

    // Progreso
    const targetDist = Math.hypot(this.sector.targetPos.x - posX, this.sector.targetPos.y - posY);
    const startDist = Math.hypot(
      this.sector.targetPos.x - this.sector.startPos.x,
      this.sector.targetPos.y - this.sector.startPos.y
    );
    const progress = Math.max(0, Math.min(1, (startDist - targetDist) / startDist));
    this.setProgress(progress);

    // Llegada a la meta B (radio 8.5m)
    if (targetDist <= 8.5) {
      const basePoints = 500;
      const energyPoints = Math.round(energy * 3.5);
      const timeBonus = Math.max(0, Math.round((this.getSnapshot().remainingMs / 1000) * 1.2));
      const totalScore = Math.min(1000, basePoints + energyPoints + timeBonus);

      this.setScore(totalScore);
      this.setData({
        ...this.getSnapshot().data,
        posX,
        posY,
        vx: 0,
        vy: 0,
        speed: 0,
        heading,
        pitchDeg: Math.round(pitchDeg * 10) / 10,
        rollDeg: Math.round(rollDeg * 10) / 10,
        suspensionOffset: Math.round(suspensionOffset * 100) / 100,
        angularVelocity: 0,
        energy: Math.round(energy * 10) / 10,
        elevation: Math.round(this.sector.elevationAt(posX, posY) * 10) / 10,
        slopeDeg: Math.round(currentSlopeDeg * 10) / 10,
        lastEventMessage: `¡Objetivo B alcanzado con éxito! Batería restante: ${energy.toFixed(1)}% · Puntuación: ${totalScore}`,
      });
      this.complete();
      return;
    }

    // Mensajes de estado
    if (isStalled) {
      lastEventMessage = '¡Alerta! Pared vertical (>30°): busca un paso más llano en el valle.';
    } else if (energy < 20) {
      lastEventMessage = '¡Batería crítica! Desciende por laderas para frenado regenerativo.';
    } else if (this.inputState.brake) {
      lastEventMessage = 'Freno de orugas accionado.';
    } else if (currentSlopeDeg > 18) {
      lastEventMessage = `Pendiente pronunciada (${currentSlopeDeg.toFixed(1)}°): chasis inclinado, alto consumo.`;
    }

    const currentScore = Math.round(progress * 300 + energy * 1.5);
    this.setScore(currentScore);

    this.setData({
      ...this.getSnapshot().data,
      posX,
      posY,
      vx,
      vy,
      speed: currentSpeed,
      heading,
      pitchDeg: Math.round(pitchDeg * 10) / 10,
      rollDeg: Math.round(rollDeg * 10) / 10,
      suspensionOffset: Math.round(suspensionOffset * 100) / 100,
      angularVelocity,
      energy: Math.round(energy * 10) / 10,
      slopeDeg: Math.round(currentSlopeDeg * 10) / 10,
      elevation: Math.round(this.sector.elevationAt(posX, posY) * 10) / 10,
      isStalled,
      lastEventMessage,
      path,
    });

    if (energy <= 0) {
      this.setData({ ...this.getSnapshot().data, lastEventMessage: '¡Batería agotada! Rover varado en Marte.' });
      this.fail();
    }
  }
}

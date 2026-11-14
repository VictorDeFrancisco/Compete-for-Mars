export interface TelemetryPacket {
  id: string;
  name: string;
  station: string;
  network: string;
  band: string;
  targetFreq: number; // 1.0 a 5.0 GHz
  targetAmp: number;  // 0.20 a 0.95 (amplitud relativa)
  hasSolarFlare: boolean;
  flareMessage?: string;
  nasaDataset: string;
  description: string;
  successMessage: string;
}

export const TELEMETRY_PACKETS: readonly TelemetryPacket[] = Object.freeze([
  {
    id: 'eclss-o2',
    name: 'Soporte Vital ECLSS: Nivel de O₂ y CO₂',
    station: 'Goldstone DSS-14 (California, EE.UU.)',
    network: 'NASA Deep Space Network (DSN)',
    band: 'Banda S · 2.4 GHz',
    targetFreq: 2.4,
    targetAmp: 0.50,
    hasSolarFlare: false,
    nasaDataset: 'NASA ECLSS (Environmental Control and Life Support System)',
    description: 'Sintoniza la portadora a 2.4 GHz y 50% de potencia para transmitir el informe de pureza del aire de la base.',
    successMessage: '¡ENLACE ESTABLECIDO CON GOLDSTONE! Telemetría de O₂ confirmada.',
  },
  {
    id: 'donki-solar-event',
    name: 'Alerta Solar DONKI: Flujo de Protones',
    station: 'Madrid DSS-63 (Robledo de Chavela, España)',
    network: 'NASA Deep Space Network (DSN)',
    band: 'Banda X · 3.8 GHz',
    targetFreq: 3.8,
    targetAmp: 0.80,
    hasSolarFlare: true,
    flareMessage: '¡AVISO DONKI! Eyección de Masa Coronal (CME) detectada. Activa el Filtro Solar (Espacio) para limpiar el ruido.',
    nasaDataset: 'NASA DONKI (Space Weather Database Notifications)',
    description: 'Una tormenta solar genera ruido magnético. Sube a 3.8 GHz y 80% de potencia, y activa el filtro contra la radiación.',
    successMessage: '¡SEÑAL ATRAVESÓ LA TORMENTA SOLAR! Madrid recibe el informe DONKI.',
  },
  {
    id: 'osdr-veggie',
    name: 'Invernadero OSDR: Crecimiento de Cultivos',
    station: 'Canberra DSS-43 (Australia)',
    network: 'NASA Deep Space Network (DSN)',
    band: 'Banda S · 1.6 GHz',
    targetFreq: 1.6,
    targetAmp: 0.40,
    hasSolarFlare: false,
    nasaDataset: 'NASA OSDR (Open Science Data Repository - GeneLab)',
    description: 'Modula a baja frecuencia (1.6 GHz) y potencia moderada (40%) para enviar los datos de biomasa de trigo y rábanos.',
    successMessage: '¡DATOS DE CULTIVO RECIBIDOS EN CANBERRA! Cosecha espacial validada.',
  },
  {
    id: 'dsoc-ice-map',
    name: 'Mapeo MOLA: Depósitos de Hielo Subterráneo',
    station: 'Palomar Observatory (Receptor Láser DSOC)',
    network: 'NASA Deep Space Optical Communications (DSOC)',
    band: 'Enlace Óptico Láser · 4.8 GHz',
    targetFreq: 4.8,
    targetAmp: 0.90,
    hasSolarFlare: true,
    flareMessage: '¡ENLACE LÁSER DE ALTA PRECISIÓN! Requiere alineación exacta con la estación terrena.',
    nasaDataset: 'NASA Mars Global Surveyor (MOLA) & Psyche DSOC',
    description: 'Transmisión masiva por haz de láser. Requiere 4.8 GHz y 90% de potencia para enviar gigabytes de mapas de hielo.',
    successMessage: '¡MAPA DE HIELO TRANSMITIDO CON ÉXITO! Combustible de retorno asegurado.',
  },
]);

const ENDLESS_STATIONS = [
  { station: 'Goldstone DSS-14 (California, EE.UU.)', network: 'NASA DSN', dataset: 'NASA ECLSS' },
  { station: 'Madrid DSS-63 (Robledo, España)', network: 'NASA DSN', dataset: 'NASA DONKI' },
  { station: 'Canberra DSS-43 (Australia)', network: 'NASA DSN', dataset: 'NASA OSDR' },
  { station: 'Palomar Observatory (DSOC)', network: 'NASA DSOC', dataset: 'NASA MOLA' },
] as const;

export function generateTelemetryWave(
  waveIndex: number,
  rand: () => number,
  prevTargetFreq?: number,
): TelemetryPacket {
  const stationInfo = ENDLESS_STATIONS[waveIndex % ENDLESS_STATIONS.length];
  let targetFreq = Number((1.3 + rand() * 3.8).toFixed(1));
  if (prevTargetFreq !== undefined && Math.abs(targetFreq - prevTargetFreq) < 0.7) {
    targetFreq = prevTargetFreq >= 3.2
      ? Number((targetFreq - 1.4).toFixed(1))
      : Number((targetFreq + 1.4).toFixed(1));
  }
  targetFreq = Math.max(1.2, Math.min(5.2, targetFreq));
  const targetAmp = Number((0.25 + rand() * 0.65).toFixed(2));
  const hasSolarFlare = rand() < 0.42;

  return {
    id: `wave-${waveIndex + 1}`,
    name: `Telemetría Orbital #${waveIndex + 1}`,
    station: stationInfo.station,
    network: stationInfo.network,
    band: `Banda DSN · ${targetFreq.toFixed(1)} GHz`,
    targetFreq,
    targetAmp,
    hasSolarFlare,
    flareMessage: hasSolarFlare
      ? '¡TORMENTA SOLAR DONKI! Mantén [ESPACIO] para filtrar interferencias.'
      : undefined,
    nasaDataset: stationInfo.dataset,
    description: `Sintoniza ${targetFreq.toFixed(1)} GHz y ${Math.round(targetAmp * 100)}% de potencia para transmitir el paquete #${waveIndex + 1}.`,
    successMessage: `¡PAQUETE #${waveIndex + 1} CONFIRMADO EN ${stationInfo.station.split(' ')[0].toUpperCase()}!`,
  };
}

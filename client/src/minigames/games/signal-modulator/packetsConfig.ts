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
    name: 'ECLSS Life Support: O₂ & CO₂ Levels',
    station: 'Goldstone DSS-14 (California, USA)',
    network: 'NASA Deep Space Network (DSN)',
    band: 'S-Band · 2.4 GHz',
    targetFreq: 2.4,
    targetAmp: 0.50,
    hasSolarFlare: false,
    nasaDataset: 'NASA ECLSS (Environmental Control and Life Support System)',
    description: 'Tune carrier to 2.4 GHz and 50% power to transmit the base air purity report.',
    successMessage: 'LINK ESTABLISHED WITH GOLDSTONE! O₂ telemetry confirmed.',
  },
  {
    id: 'donki-solar-event',
    name: 'DONKI Solar Alert: Proton Flux',
    station: 'Madrid DSS-63 (Robledo de Chavela, Spain)',
    network: 'NASA Deep Space Network (DSN)',
    band: 'X-Band · 3.8 GHz',
    targetFreq: 3.8,
    targetAmp: 0.80,
    hasSolarFlare: true,
    flareMessage: 'DONKI ALERT! Coronal Mass Ejection (CME) detected. Enable Solar Filter (Space) to clear noise.',
    nasaDataset: 'NASA DONKI (Space Weather Database Notifications)',
    description: 'A solar storm generates magnetic noise. Raise to 3.8 GHz and 80% power, and activate the radiation filter.',
    successMessage: 'SIGNAL PIERCED THE SOLAR STORM! Madrid received the DONKI report.',
  },
  {
    id: 'osdr-veggie',
    name: 'OSDR Greenhouse: Crop Growth',
    station: 'Canberra DSS-43 (Australia)',
    network: 'NASA Deep Space Network (DSN)',
    band: 'S-Band · 1.6 GHz',
    targetFreq: 1.6,
    targetAmp: 0.40,
    hasSolarFlare: false,
    nasaDataset: 'NASA OSDR (Open Science Data Repository - GeneLab)',
    description: 'Modulate to low frequency (1.6 GHz) and moderate power (40%) to send wheat and radish biomass data.',
    successMessage: 'CROP DATA RECEIVED IN CANBERRA! Space harvest validated.',
  },
  {
    id: 'dsoc-ice-map',
    name: 'MOLA Mapping: Subsurface Ice Deposits',
    station: 'Palomar Observatory (DSOC Laser Receiver)',
    network: 'NASA Deep Space Optical Communications (DSOC)',
    band: 'Optical Laser Link · 4.8 GHz',
    targetFreq: 4.8,
    targetAmp: 0.90,
    hasSolarFlare: true,
    flareMessage: 'HIGH-PRECISION LASER LINK! Requires exact ground station alignment.',
    nasaDataset: 'NASA Mars Global Surveyor (MOLA) & Psyche DSOC',
    description: 'Massive laser beam transmission. Requires 4.8 GHz and 90% power to send gigabytes of ice maps.',
    successMessage: 'ICE MAP TRANSMITTED! Return propellant secured.',
  },
]);

const ENDLESS_STATIONS = [
  { station: 'Goldstone DSS-14 (California, USA)', network: 'NASA DSN', dataset: 'NASA ECLSS' },
  { station: 'Madrid DSS-63 (Robledo, Spain)', network: 'NASA DSN', dataset: 'NASA DONKI' },
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
    name: `Orbital Telemetry #${waveIndex + 1}`,
    station: stationInfo.station,
    network: stationInfo.network,
    band: `DSN Band · ${targetFreq.toFixed(1)} GHz`,
    targetFreq,
    targetAmp,
    hasSolarFlare,
    flareMessage: hasSolarFlare
      ? 'DONKI SOLAR STORM! Hold [SPACE] to filter interference.'
      : undefined,
    nasaDataset: stationInfo.dataset,
    description: `Tune ${targetFreq.toFixed(1)} GHz and ${Math.round(targetAmp * 100)}% power to transmit packet #${waveIndex + 1}.`,
    successMessage: `PACKET #${waveIndex + 1} CONFIRMED AT ${stationInfo.station.split(' ')[0].toUpperCase()}!`,
  };
}

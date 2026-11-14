import { useId } from 'react';

export function PaperclipSvg({ className = 'dossier-paperclip' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 28 58" aria-hidden="true">
      <path
        d="M19 16V42C19 46.5 15.5 50 11 50C6.5 50 3 46.5 3 42V13C3 6.5 8 2 14.5 2C21 2 25 6.5 25 13V39"
        fill="none"
        stroke="#5E645D"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M18 16V42C18 46 14.8 49 11 49C7.2 49 4 46 4 42V13C4 7 8.5 3 14.5 3C20.5 3 24 7 24 13V39"
        fill="none"
        stroke="#C5CBC1"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * NASA Blue (#0B3D91) orbital ink stamp for folder headers & briefing sheets.
 */
export function NasaOrbitStampSvg({ label = 'MARS OUTPOST // MISSION TRAINER' }: { label?: string }) {
  return (
    <div className="nasa-stamp" aria-hidden="true">
      <svg className="nasa-stamp__orbit" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r="18" fill="none" stroke="currentColor" strokeWidth="2.4" />
        <ellipse
          cx="22"
          cy="22"
          rx="20"
          ry="8"
          transform="rotate(-24 22 22)"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
        />
        <circle cx="22" cy="22" r="5.5" fill="currentColor" />
        <circle cx="36" cy="15" r="2.6" fill="#FC3D21" />
      </svg>
      <div className="nasa-stamp__text">
        <span className="nasa-stamp__agency">NASA · ARES SECTOR</span>
        <span className="nasa-stamp__sub">{label}</span>
      </div>
    </div>
  );
}

/**
 * Faint Martian topographic contour lines printed into cream manila sheets.
 */
export function TopoWatermarkSvg() {
  const uid = useId().replace(/:/g, '');
  const patId = `topo-${uid}`;

  return (
    <svg className="manila-topo" aria-hidden="true" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id={patId} width="400" height="250" patternUnits="userSpaceOnUse">
          <path
            d="M-20 45 C65 18, 130 85, 220 55 C305 26, 355 78, 420 45"
            fill="none"
            stroke="#0B3D91"
            strokeWidth="1.1"
          />
          <path
            d="M-20 92 C70 64, 155 128, 240 94 C315 64, 360 110, 420 92"
            fill="none"
            stroke="#0B3D91"
            strokeWidth="1.1"
          />
          <path
            d="M-20 148 C82 115, 165 175, 255 142 C335 112, 375 162, 420 148"
            fill="none"
            stroke="#0B3D91"
            strokeWidth="1.1"
          />
          <path
            d="M-20 202 C90 175, 175 232, 265 198 C340 170, 380 218, 420 202"
            fill="none"
            stroke="#0B3D91"
            strokeWidth="1.1"
          />
          <ellipse cx="148" cy="128" rx="46" ry="26" fill="none" stroke="#C1440E" strokeWidth="1" />
          <ellipse cx="148" cy="128" rx="24" ry="13" fill="none" stroke="#C1440E" strokeWidth="1" />
          <ellipse cx="322" cy="76" rx="38" ry="20" fill="none" stroke="#0B3D91" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="800" height="500" fill={`url(#${patId})`} />
    </svg>
  );
}

import './LaunchTransition.css';

export interface LaunchTransitionProps {
  launchKey: number;
  label?: string;
}

const STREAKS = [
  { left: '7%', delay: '0ms', dur: '520ms', height: '38%' },
  { left: '14%', delay: '60ms', dur: '460ms', height: '52%' },
  { left: '22%', delay: '20ms', dur: '580ms', height: '44%' },
  { left: '31%', delay: '90ms', dur: '480ms', height: '60%' },
  { left: '41%', delay: '35ms', dur: '500ms', height: '46%' },
  { left: '52%', delay: '10ms', dur: '450ms', height: '65%' },
  { left: '63%', delay: '75ms', dur: '540ms', height: '50%' },
  { left: '74%', delay: '30ms', dur: '490ms', height: '58%' },
  { left: '84%', delay: '55ms', dur: '470ms', height: '42%' },
  { left: '92%', delay: '15ms', dur: '530ms', height: '54%' },
];

export default function LaunchTransition({
  launchKey,
  label = 'IGNITION SEQUENCE // ENTERING ARES SECTOR',
}: LaunchTransitionProps) {
  if (launchKey <= 0) return null;

  return (
    <div key={launchKey} className="launch-fx" aria-hidden="true">
      <div className="launch-fx__flash" />
      <div className="launch-fx__shockwave" />
      <div className="launch-fx__shockwave launch-fx__shockwave--outer" />

      <div className="launch-fx__streaks">
        {STREAKS.map((s, idx) => (
          <span
            key={idx}
            className="launch-fx__streak"
            style={{
              left: s.left,
              height: s.height,
              animationDelay: s.delay,
              animationDuration: s.dur,
            }}
          />
        ))}
      </div>

      <div className="launch-fx__door launch-fx__door--top">
        <div className="launch-fx__hazard" />
      </div>
      <div className="launch-fx__door launch-fx__door--bottom">
        <div className="launch-fx__hazard" />
      </div>

      <div className="launch-fx__badge">
        <svg className="launch-fx__rocket" viewBox="0 0 64 64" width="46" height="46">
          <path
            d="M32 6 C41 16, 44 30, 40 44 L24 44 C20 30, 23 16, 32 6 Z"
            fill="#F5EFE0"
            stroke="#1A1817"
            strokeWidth="3"
          />
          <circle cx="32" cy="25" r="5" fill="#0B3D91" stroke="#1A1817" strokeWidth="2.5" />
          <path d="M23 36 L14 46 L24 44 Z" fill="#FC3D21" stroke="#1A1817" strokeWidth="2.5" />
          <path d="M41 36 L50 46 L40 44 Z" fill="#FC3D21" stroke="#1A1817" strokeWidth="2.5" />
          <path d="M26 45 L32 60 L38 45 Z" fill="#F5C242" stroke="#1A1817" strokeWidth="2" />
        </svg>
        <span className="launch-fx__label">{label}</span>
      </div>
    </div>
  );
}

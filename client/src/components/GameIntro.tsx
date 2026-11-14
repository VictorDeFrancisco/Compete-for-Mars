import { useEffect } from 'react';
import './GameIntro.css';

export interface GameIntroProps {
  onComplete: () => void;
}

const INTRO_DURATION_MS = 3350;

export default function GameIntro({ onComplete }: GameIntroProps) {
  useEffect(() => {
    const timer = window.setTimeout(onComplete, INTRO_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="game-intro" role="presentation">
      <div className="game-intro__space" />
      <div className="game-intro__stars" />

      <div className="game-intro__stage">
        <div className="game-intro__planet-wrap">
          <div className="game-intro__corona" />
          <svg className="game-intro__planet-svg" viewBox="0 0 360 360" aria-hidden="true">
            <defs>
              <radialGradient id="introMarsFill" cx="38%" cy="32%" r="68%">
                <stop offset="0%" stopColor="#F48E54" />
                <stop offset="50%" stopColor="#D64918" />
                <stop offset="85%" stopColor="#6E1C07" />
                <stop offset="100%" stopColor="#260A04" />
              </radialGradient>
            </defs>

            <ellipse
              className="game-intro__orbit-arc"
              cx="180"
              cy="180"
              rx="164"
              ry="52"
              transform="rotate(-18 180 180)"
              fill="none"
              stroke="#F5C242"
              strokeWidth="3"
              strokeLinecap="round"
            />

            <circle
              cx="180"
              cy="180"
              r="112"
              fill="url(#introMarsFill)"
              stroke="#1A1817"
              strokeWidth="4"
            />
            <path
              d="M95 148 Q165 128 265 152"
              fill="none"
              stroke="#8C2D04"
              strokeWidth="8"
              strokeLinecap="round"
              opacity="0.6"
            />
            <path
              d="M84 205 Q180 226 276 196"
              fill="none"
              stroke="#5A1A05"
              strokeWidth="10"
              strokeLinecap="round"
              opacity="0.55"
            />
            <circle cx="136" cy="158" r="14" fill="#9A3209" stroke="#1A1817" strokeWidth="2.5" opacity="0.8" />
            <circle cx="218" cy="212" r="18" fill="#7A2506" stroke="#1A1817" strokeWidth="2.5" opacity="0.8" />
          </svg>
        </div>

        <div className="game-intro__titles">
          <span className="game-intro__studio">C-MOON DYNAMICS PRESENTS · SOL-014</span>
          <h1 className="game-intro__logo">
            COMPETE <span>FOR MARS</span>
          </h1>
          <div className="game-intro__bar-wrap">
            <div className="game-intro__bar-fill" />
          </div>
          <span className="game-intro__status">ESTABLISHING ARES SECTOR LINK…</span>
        </div>
      </div>

      <button type="button" className="game-intro__skip" onClick={onComplete}>
        SKIP →
      </button>
    </div>
  );
}

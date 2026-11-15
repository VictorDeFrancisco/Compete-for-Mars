import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import './BackgroundMusic.css';

interface BackgroundMusicContextValue {
  muted: boolean;
  toggleMute: () => void;
}

const BackgroundMusicContext = createContext<BackgroundMusicContextValue | null>(null);

interface BackgroundMusicProviderProps {
  ducked?: boolean;
  children: ReactNode;
}

const STORAGE_KEY = 'mars_music_muted';
const NORMAL_VOLUME = 0.3;
const DUCKED_VOLUME = 0.15;

/**
 * Provides persistent Mars theme audio across all screens and exposes mute state.
 */
export function BackgroundMusicProvider({ ducked = false, children }: BackgroundMusicProviderProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = muted ? 0 : ducked ? DUCKED_VOLUME : NORMAL_VOLUME;
    audio.muted = muted;
  }, [ducked, muted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const tryPlay = () => {
      if (muted || !audio.paused) return;
      void audio.play().catch(() => {});
    };

    tryPlay();

    const unlock = () => tryPlay();
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [muted]);

  const toggleMute = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    try {
      window.localStorage.setItem(STORAGE_KEY, nextMuted ? '1' : '0');
    } catch {
      // Ignore storage failures in restricted contexts.
    }

    const audio = audioRef.current;
    if (audio) {
      audio.muted = nextMuted;
      if (!nextMuted && audio.paused) {
        void audio.play().catch(() => {});
      }
    }
  };

  return (
    <BackgroundMusicContext.Provider value={{ muted, toggleMute }}>
      <audio ref={audioRef} src="/assets/mars-theme.aac" loop preload="auto" />
      {children}
    </BackgroundMusicContext.Provider>
  );
}

/**
 * Compact speaker icon toggle pinned in the top-right action slot of every screen.
 */
export function MusicToggleButton({ className = '' }: { className?: string }) {
  const ctx = useContext(BackgroundMusicContext);
  if (!ctx) return null;

  const { muted, toggleMute } = ctx;
  return (
    <button
      type="button"
      className={`bgm-toggle ${muted ? 'bgm-toggle--muted' : ''} ${className}`.trim()}
      onClick={toggleMute}
      aria-label={muted ? 'Unmute background music' : 'Mute background music'}
      aria-pressed={muted}
      title={muted ? 'Unmute music' : 'Mute music'}
    >
      <svg className="bgm-toggle__icon" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M11 5.5 6.2 9.2H3.5v5.6h2.7L11 18.5V5.5Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        {!muted && (
          <>
            <path
              d="M15 8.8a4.6 4.6 0 0 1 0 6.4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
            />
            <path
              d="M17.9 6.2a8.2 8.2 0 0 1 0 11.6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
            />
          </>
        )}
        {muted && (
          <line
            x1="4"
            y1="4"
            x2="20"
            y2="20"
            stroke="#dc2626"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
        )}
      </svg>
    </button>
  );
}

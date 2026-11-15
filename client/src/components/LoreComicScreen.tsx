import { useCallback, useEffect, useState } from 'react';
import { playUiClick, playUiConfirm } from '../utils/uiAudio';
import './LoreComicScreen.css';

const TOTAL_PANELS = 6;

const PANEL_SRCS = [
  '/assets/comic/panel-1.jpg',
  '/assets/comic/panel-2.jpg',
  '/assets/comic/panel-3.jpg',
  '/assets/comic/panel-4.jpg',
  '/assets/comic/panel-5.jpg',
  '/assets/comic/panel-6.jpg',
] as const;

export interface LoreComicScreenProps {
  onComplete: () => void;
}

export default function LoreComicScreen({ onComplete }: LoreComicScreenProps) {
  const [revealedCount, setRevealedCount] = useState(1);

  useEffect(() => {
    for (const src of PANEL_SRCS) {
      const img = new Image();
      img.src = src;
    }
  }, []);

  const handleSkip = useCallback(() => {
    playUiConfirm();
    onComplete();
  }, [onComplete]);

  const handleNext = useCallback(() => {
    if (revealedCount < TOTAL_PANELS) {
      playUiClick();
      setRevealedCount(prev => Math.min(prev + 1, TOTAL_PANELS));
    } else {
      playUiConfirm();
      onComplete();
    }
  }, [revealedCount, onComplete]);

  const handleBack = useCallback(() => {
    if (revealedCount > 1) {
      playUiClick();
      setRevealedCount(prev => Math.max(1, prev - 1));
    }
  }, [revealedCount]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleSkip();
      } else if (event.key === 'ArrowRight' || event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        handleNext();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        handleBack();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleNext, handleBack, handleSkip]);

  return (
    <section className="lore-screen" aria-label="Mission lore comic" onClick={handleNext}>
      <button
        type="button"
        className="lore-skip-btn"
        onClick={event => {
          event.stopPropagation();
          handleSkip();
        }}
      >
        SKIP
      </button>

      <div className="lore-screen__stage">
        {revealedCount <= 3 ? (
          <div className="lore-page lore-page--one" key="page-1">
            <div className="lore-page__top-pair">
              <div className={`lore-panel ${revealedCount >= 1 ? 'is-revealed' : ''}`}>
                <img src={PANEL_SRCS[0]} alt="" className="lore-panel__img" draggable={false} />
              </div>
              <div className={`lore-panel ${revealedCount >= 2 ? 'is-revealed' : ''}`}>
                <img src={PANEL_SRCS[1]} alt="" className="lore-panel__img" draggable={false} />
              </div>
            </div>

            <div className={`lore-panel ${revealedCount >= 3 ? 'is-revealed' : ''}`}>
              <img src={PANEL_SRCS[2]} alt="" className="lore-panel__img" draggable={false} />
            </div>
          </div>
        ) : revealedCount <= 5 ? (
          <div className="lore-page lore-page--two" key="page-2">
            <div className={`lore-panel ${revealedCount >= 4 ? 'is-revealed' : ''}`}>
              <img src={PANEL_SRCS[3]} alt="" className="lore-panel__img" draggable={false} />
            </div>
            <div className={`lore-panel ${revealedCount >= 5 ? 'is-revealed' : ''}`}>
              <img src={PANEL_SRCS[4]} alt="" className="lore-panel__img" draggable={false} />
            </div>
          </div>
        ) : (
          <div className="lore-page lore-page--finale" key="page-3">
            <div className="lore-panel is-revealed">
              <img src={PANEL_SRCS[5]} alt="" className="lore-panel__img" draggable={false} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

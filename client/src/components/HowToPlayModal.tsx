import { useEffect } from 'react';
import { EnergyIcon, FoodIcon, HealthIcon, RadiationIcon } from './ResourceIcons';
import { playUiClick } from '../utils/uiAudio';
import './HowToPlayModal.css';

export interface HowToPlayModalProps {
  open: boolean;
  onClose: () => void;
}

export default function HowToPlayModal({ open, onClose }: HowToPlayModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="htp-backdrop"
      role="presentation"
      onClick={event => {
        if (event.target === event.currentTarget) {
          playUiClick();
          onClose();
        }
      }}
    >
      <section
        className="htp-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="htp-title"
      >
        <header className="htp-modal__head">
          <div>
            <span className="htp-modal__kicker">ARES COLONY · QUICK BRIEF</span>
            <h2 id="htp-title" className="htp-modal__title">HOW TO PLAY</h2>
          </div>

          <button
            type="button"
            className="htp-close-btn"
            onClick={() => {
              playUiClick();
              onClose();
            }}
            aria-label="Close guide"
          >
            ✕
          </button>
        </header>

        <div className="htp-body">
          <p className="htp-lead">
            Compete against up to <strong>4 astronauts</strong> to be the last survivor on Mars.
          </p>

          <div className="htp-list">
            <article className="htp-item">
              <div className="htp-item__icon htp-item__icon--hp">
                <HealthIcon />
              </div>
              <div>
                <h3>PROFESSIONS &amp; HEALTH</h3>
                <p>Choose a profession for extra Energy or Food capacity. Win rounds to stay safe — finishing last drains HP, and at 0 HP you are eliminated.</p>
              </div>
            </article>

            <article className="htp-item">
              <div className="htp-item__icon htp-item__icon--energy">
                <EnergyIcon />
                <FoodIcon />
              </div>
              <div>
                <h3>ENERGY &amp; FOOD</h3>
                <p>Winning minigames earns Energy or Food, while every round drains a little of both. Running low weakens your performance, and hitting 0 costs HP.</p>
              </div>
            </article>

            <article className="htp-item">
              <div className="htp-item__icon htp-item__icon--rad">
                <RadiationIcon />
              </div>
              <div>
                <h3>RADIATION</h3>
                <p>Radiation stays with you and damages your HP every round until you clear or block it.</p>
              </div>
            </article>

            <article className="htp-item">
              <div className="htp-item__icon htp-item__icon--cards">
                ★
              </div>
              <div>
                <h3>CARDS &amp; MINIGAMES</h3>
                <p>From Round 2 onward, draft a card before each minigame for buffs, shields, risky gambles, or ways to sabotage rivals.</p>
              </div>
            </article>
          </div>
        </div>

        <footer className="htp-modal__foot">
          <button
            type="button"
            className="htp-confirm-btn"
            onClick={() => {
              playUiClick();
              onClose();
            }}
          >
            GOT IT →
          </button>
        </footer>
      </section>
    </div>
  );
}

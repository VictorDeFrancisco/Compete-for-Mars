import MarsBackdrop from './MarsBackdrop';
import './StartScreen.css';

export interface StartScreenProps {
  onCreateScreen: () => void;
  onJoinScreen: () => void;
  onOpenTest: () => void;
}

export default function StartScreen({
  onCreateScreen,
  onJoinScreen,
  onOpenTest,
}: StartScreenProps) {
  return (
    <section className="start-screen" aria-label="Compete For Mars">
      <MarsBackdrop />

      <div className="start-screen__hud">
        <header className="start-screen__top">
          <span className="start-screen__stamp">NASA · ARES SECTOR OUTPOST</span>
          <button
            type="button"
            className="start-screen__test-btn"
            onClick={onOpenTest}
          >
            TEST LAB
          </button>
        </header>

        <div className="start-screen__title-stage">
          <span className="start-screen__edition">EXPEDITION SOL-014 · 1–4 ASTRONAUTS</span>

          <h1 className="start-screen__hero-title">
            <span className="start-screen__title-line">COMPETE</span>
            <span className="start-screen__title-line start-screen__title-line--accent">
              FOR MARS
            </span>
          </h1>

          <p className="start-screen__tagline">
            Sabotage rivals, weather solar storms, and survive to conquer the Red Planet.
          </p>

          <nav className="start-screen__menu" aria-label="Main menu">
            <button
              type="button"
              className="start-screen__btn start-screen__btn--primary"
              onClick={onCreateScreen}
            >
              ▶ CREATE ROOM
            </button>
            <button
              type="button"
              className="start-screen__btn start-screen__btn--secondary"
              onClick={onJoinScreen}
            >
              JOIN ROOM
            </button>
          </nav>
        </div>

        <footer className="start-screen__footer">
          <span className="start-screen__brand">C-MOON DYNAMICS · MISSION READY</span>
        </footer>
      </div>
    </section>
  );
}

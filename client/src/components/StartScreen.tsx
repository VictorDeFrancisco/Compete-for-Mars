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
          <button
            type="button"
            className="start-screen__test-btn"
            onClick={onOpenTest}
          >
            TEST LAB
          </button>
        </header>

        <div className="start-screen__title-stage">
          <h1 className="start-screen__hero-title">
            <span className="start-screen__title-line">COMPETE</span>
            <span className="start-screen__title-line start-screen__title-line--accent">
              FOR MARS
            </span>
          </h1>

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
      </div>
    </section>
  );
}

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
          <span className="start-screen__stamp">NASA // ARES SECTOR OUTPOST</span>
          <button
            type="button"
            className="start-screen__test-btn"
            onClick={onOpenTest}
          >
            TEST LAB
          </button>
        </header>

        <div className="start-screen__center">
          <div className="start-screen__hero-card">
            <span className="start-screen__kicker">SURVIVAL PARTY MISSION · 1–4 CREW</span>
            <h1 className="start-screen__title">COMPETE FOR MARS</h1>
            <p className="start-screen__subtitle">
              Coordina o sabotea a tu tripulación en la base marciana. Gestiona energía, comida y radiación en cada ronda.
            </p>

            <nav className="start-screen__menu" aria-label="Main menu">
              <button
                type="button"
                className="start-screen__btn start-screen__btn--primary"
                onClick={onCreateScreen}
              >
                CREATE ROOM
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

        <footer className="start-screen__footer">
          <span className="start-screen__brand">C-MOON DYNAMICS · RETRO-NASA TELEMETRY</span>
        </footer>
      </div>
    </section>
  );
}

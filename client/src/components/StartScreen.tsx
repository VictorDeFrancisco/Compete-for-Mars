import { MusicToggleButton } from './BackgroundMusic';
import MarsBackdrop from './MarsBackdrop';
import './StartScreen.css';

export interface StartScreenProps {
  onCreateScreen: () => void;
  onJoinScreen: () => void;
  onOpenHowToPlay?: () => void;
  showBackdrop?: boolean;
  exiting?: boolean;
}

export default function StartScreen({
  onCreateScreen,
  onJoinScreen,
  onOpenHowToPlay,
  showBackdrop = true,
  exiting = false,
}: StartScreenProps) {
  return (
    <section
      className={`start-screen ${exiting ? 'start-screen--exiting' : ''}`.trim()}
      aria-label="Compete For Mars"
    >
      {showBackdrop && <MarsBackdrop src="/assets/mars-home.png" />}

      <div className="start-screen__hud">
        <header className="start-screen__top">
          <MusicToggleButton />
        </header>

        <div className="start-screen__title-stage">
          <div className="start-screen__hero">
            <span className="start-screen__badge">
              JUNIOR ASTRONAUT MISSION TRAINER
            </span>

            <h1 className="start-screen__hero-title">
              <span className="start-screen__title-line">COMPETE FOR</span>
              <span className="start-screen__title-line start-screen__title-line--accent">
                MARS
              </span>
            </h1>
          </div>

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
            {onOpenHowToPlay && (
              <button
                type="button"
                className="start-screen__btn start-screen__btn--secondary"
                onClick={onOpenHowToPlay}
              >
                HOW TO PLAY
              </button>
            )}
          </nav>
        </div>
      </div>
    </section>
  );
}

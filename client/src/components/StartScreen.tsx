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
      <div className="start-screen__scrim" aria-hidden="true" />

      <div className="start-screen__content">
        <div className="start-screen__left">
          <h1 className="start-screen__title">
            <span>COMPETE</span>
            <span>FOR MARS</span>
          </h1>

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
              className="start-screen__btn"
              onClick={onJoinScreen}
            >
              JOIN ROOM
            </button>
            <button
              type="button"
              className="start-screen__btn start-screen__btn--test"
              onClick={onOpenTest}
            >
              TEST
            </button>
          </nav>
        </div>
      </div>

      <div className="start-screen__footer">
        <span>C-Moon Dynamics</span>
      </div>
    </section>
  );
}

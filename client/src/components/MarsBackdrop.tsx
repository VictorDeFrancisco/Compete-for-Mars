export interface MarsBackdropProps {
  /** Reserved for compatibility with caller components */
  suitColor?: string;
}

/**
 * Full-screen Martian base background using the project's rendered outpost backdrop.
 */
export default function MarsBackdrop({ suitColor: _suitColor }: MarsBackdropProps) {
  return (
    <div className="mars-backdrop" aria-hidden="true">
      <img
        className="mars-backdrop__img"
        src="/assets/mars-bg.jpeg"
        alt=""
        decoding="async"
      />
      <div className="mars-backdrop__scrim" />
    </div>
  );
}

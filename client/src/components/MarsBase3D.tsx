import { useEffect, useRef } from 'react';
import type { GameView } from '../../../shared/types';

/**
 * Full-screen looping video backdrop of the Mars outpost (temporary replacement for the 3D canvas).
 * Keeps play/pause wired to the Lobby `autoOrbit` control while preserving zero-lag playback.
 */
export default function MarsBase3D({ game: _game, autoOrbit = true }: { game: GameView; autoOrbit?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (autoOrbit) {
      void video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [autoOrbit]);

  return (
    <div className="mars-base-bg">
      <video
        ref={videoRef}
        className="mars-base-bg__video"
        src="/assets/mars-base.mp4"
        poster="/assets/mars-bg.jpeg"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-label="Video view of the Mars base"
      />
      <div className="mars-base-bg__scrim" aria-hidden="true" />
    </div>
  );
}

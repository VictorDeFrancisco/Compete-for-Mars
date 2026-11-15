import { useEffect, useRef, useState } from 'react';
import './MarsMenuBackdrop.css';

export type MenuScene = 'home' | 'entry';
export type MenuTransitionDirection = 'forward' | 'reverse';

export interface MarsMenuBackdropProps {
  /** Which static scene is currently settled when no transition is playing */
  scene: MenuScene;
  /** Active camera transition direction, or null when idle */
  transition: MenuTransitionDirection | null;
  /** Called once the active transition finishes (or fails safely) */
  onTransitionComplete: () => void;
}

const HOME_SRC = '/assets/mars-home.png';
const ENTRY_SRC = '/assets/mars-entry.png';
const TRANSITION_VIDEO_SRC = '/assets/mars-transition.mp4';
const DEFAULT_DURATION_MS = 1000;
const CAPTURE_MIN_STEP_SEC = 0.028;
const MAX_CACHED_FRAMES = 40;

interface FrameCache {
  frames: ImageBitmap[];
  durationMs: number;
  width: number;
  height: number;
}

const frameCache: FrameCache = {
  frames: [],
  durationMs: DEFAULT_DURATION_MS,
  width: 1600,
  height: 900,
};

function resetFrameCache() {
  for (const frame of frameCache.frames) {
    frame.close();
  }
  frameCache.frames = [];
}

function getCaptureSize(videoWidth: number, videoHeight: number) {
  const maxWidth = 1600;
  if (videoWidth <= 0 || videoHeight <= 0) {
    return { width: 1600, height: 900 };
  }
  const scale = Math.min(1, maxWidth / videoWidth);
  return {
    width: Math.round(videoWidth * scale),
    height: Math.round(videoHeight * scale),
  };
}

/**
 * Persistent backdrop across the Start screen (Snapshot 6) and Room Entry screen (Snapshot 7).
 * Plays the matching transition video forward on entry and reverses through cached frames on return.
 */
export default function MarsMenuBackdrop({
  scene,
  transition,
  onTransitionComplete,
}: MarsMenuBackdropProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const homeImgRef = useRef<HTMLImageElement>(null);
  const entryImgRef = useRef<HTMLImageElement>(null);
  const onCompleteRef = useRef(onTransitionComplete);
  onCompleteRef.current = onTransitionComplete;

  const [videoPainting, setVideoPainting] = useState(false);
  const [reverseReady, setReverseReady] = useState(false);

  // Forward video playback + frame capture for reverse playback
  useEffect(() => {
    if (transition !== 'forward') {
      setVideoPainting(false);
      return;
    }

    const video = videoRef.current;
    if (!video) {
      onCompleteRef.current();
      return;
    }

    let cancelled = false;
    let rafId = 0;
    let fallbackTimer = 0;
    let finished = false;
    let lastCapturedTime = -1;
    let captureCanvas: HTMLCanvasElement | null = null;
    let captureCtx: CanvasRenderingContext2D | null = null;

    const shouldCapture = frameCache.frames.length < 18;
    const pendingBitmaps: Promise<void>[] = [];
    const capturedList: ImageBitmap[] = [];
    let nextSlot = 0;

    const finish = () => {
      if (cancelled || finished) return;
      finished = true;
      window.clearTimeout(fallbackTimer);
      window.cancelAnimationFrame(rafId);

      if (shouldCapture && pendingBitmaps.length > 0) {
        Promise.all(pendingBitmaps).then(() => {
          const validFrames = capturedList.filter(Boolean);
          if (validFrames.length >= 10) {
            resetFrameCache();
            frameCache.frames = validFrames;
            if (Number.isFinite(video.duration) && video.duration > 0.1) {
              frameCache.durationMs = Math.round(video.duration * 1000);
            }
          } else {
            for (const bmp of validFrames) bmp.close();
          }
        });
      }

      onCompleteRef.current();
    };

    const captureCurrentFrame = () => {
      if (!shouldCapture || video.readyState < 2 || video.videoWidth <= 0) return;
      if (nextSlot >= MAX_CACHED_FRAMES) return;
      if (
        lastCapturedTime >= 0 &&
        Math.abs(video.currentTime - lastCapturedTime) < CAPTURE_MIN_STEP_SEC
      ) {
        return;
      }

      lastCapturedTime = video.currentTime;
      if (!captureCanvas) {
        const size = getCaptureSize(video.videoWidth, video.videoHeight);
        frameCache.width = size.width;
        frameCache.height = size.height;
        captureCanvas = document.createElement('canvas');
        captureCanvas.width = size.width;
        captureCanvas.height = size.height;
        captureCtx = captureCanvas.getContext('2d');
      }

      if (!captureCtx || !captureCanvas) return;
      captureCtx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);

      const slot = nextSlot++;
      const p = createImageBitmap(captureCanvas)
        .then(bitmap => {
          capturedList[slot] = bitmap;
        })
        .catch(() => {});
      pendingBitmaps.push(p);
    };

    const tick = () => {
      if (cancelled || finished) return;
      if (video.readyState >= 2 && video.currentTime > 0) {
        setVideoPainting(true);
        captureCurrentFrame();
      }
      if (video.ended || (video.duration > 0 && video.currentTime >= video.duration - 0.015)) {
        captureCurrentFrame();
        finish();
        return;
      }
      rafId = window.requestAnimationFrame(tick);
    };

    const handleEnded = () => {
      captureCurrentFrame();
      finish();
    };

    const handleError = () => {
      finish();
    };

    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    try {
      video.pause();
      video.currentTime = 0;
    } catch {
      // Ignore seek error before metadata loads
    }

    const expectedDuration =
      Number.isFinite(video.duration) && video.duration > 0.1
        ? Math.round(video.duration * 1000)
        : DEFAULT_DURATION_MS;
    fallbackTimer = window.setTimeout(finish, Math.max(1800, expectedDuration + 750));

    video
      .play()
      .then(() => {
        if (cancelled || finished) return;
        setVideoPainting(true);
        captureCurrentFrame();
        rafId = window.requestAnimationFrame(tick);
      })
      .catch(() => {
        finish();
      });

    return () => {
      cancelled = true;
      window.clearTimeout(fallbackTimer);
      window.cancelAnimationFrame(rafId);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      video.pause();
    };
  }, [transition]);

  // Reverse playback using the captured frames (or smooth fallback if cache unavailable)
  useEffect(() => {
    if (transition !== 'reverse') {
      setReverseReady(false);
      return;
    }

    const frames = frameCache.frames.filter(Boolean);
    const canvas = canvasRef.current;

    // Fallback: if no cached frames exist yet, smoothly transition back over 550ms
    if (!canvas || frames.length < 6) {
      setReverseReady(false);
      const timer = window.setTimeout(() => {
        onCompleteRef.current();
      }, 550);
      return () => window.clearTimeout(timer);
    }

    canvas.width = frameCache.width;
    canvas.height = frameCache.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      onCompleteRef.current();
      return;
    }

    let cancelled = false;
    let rafId = 0;
    const totalMs = Math.max(500, frameCache.durationMs || DEFAULT_DURATION_MS);
    const lastIdx = frames.length - 1;

    // Draw the ending frame (Snapshot 7) immediately before flipping canvas visibility
    ctx.drawImage(frames[lastIdx], 0, 0, canvas.width, canvas.height);
    setReverseReady(true);

    const startTime = performance.now();
    const renderReverse = (now: number) => {
      if (cancelled) return;
      const elapsed = now - startTime;
      const progress = Math.min(1, Math.max(0, elapsed / totalMs));
      const idx = Math.min(lastIdx, Math.max(0, Math.round((1 - progress) * lastIdx)));
      const frame = frames[idx];
      if (frame) {
        ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
      }
      if (progress >= 1) {
        onCompleteRef.current();
        return;
      }
      rafId = window.requestAnimationFrame(renderReverse);
    };

    rafId = window.requestAnimationFrame(renderReverse);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(rafId);
    };
  }, [transition]);

  const showHomeImg =
    (scene === 'home' && transition === null) ||
    (transition === 'forward' && !videoPainting) ||
    (transition === 'reverse' && !reverseReady);
  const showEntryImg =
    (scene === 'entry' && transition === null) ||
    (transition === 'reverse' && !reverseReady);

  return (
    <div className="mars-backdrop mars-menu-backdrop" aria-hidden="true">
      <img
        ref={homeImgRef}
        className={`mars-backdrop__img mars-menu-backdrop__layer ${
          showHomeImg ? 'mars-menu-backdrop__layer--visible' : ''
        }`}
        src={HOME_SRC}
        alt=""
        decoding="sync"
      />
      <img
        ref={entryImgRef}
        className={`mars-backdrop__img mars-menu-backdrop__layer ${
          showEntryImg ? 'mars-menu-backdrop__layer--visible' : ''
        } ${transition === 'reverse' && !reverseReady ? 'mars-menu-backdrop__layer--crossfade-out' : ''}`}
        src={ENTRY_SRC}
        alt=""
        decoding="sync"
      />
      <video
        ref={videoRef}
        className={`mars-backdrop__img mars-menu-backdrop__media ${
          transition === 'forward' && videoPainting ? 'mars-menu-backdrop__layer--visible' : ''
        }`}
        src={TRANSITION_VIDEO_SRC}
        muted
        playsInline
        preload="auto"
      />
      <canvas
        ref={canvasRef}
        className={`mars-backdrop__img mars-menu-backdrop__media ${
          transition === 'reverse' && reverseReady ? 'mars-menu-backdrop__layer--visible' : ''
        }`}
      />
      <div className="mars-backdrop__scrim" />
    </div>
  );
}

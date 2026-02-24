'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';

// Minimal YT type declarations (YouTube IFrame API)
declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        options: {
          videoId: string;
          playerVars?: Record<string, string | number>;
          events?: {
            onReady?: (e: { target: YTPlayer }) => void;
            onStateChange?: (e: { data: number }) => void;
          };
        },
      ) => YTPlayer;
      PlayerState: { PLAYING: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }

  interface YTPlayer {
    getCurrentTime: () => number;
    seekTo: (seconds: number, allowSeekAhead: boolean) => void;
    destroy: () => void;
  }
}

interface Props {
  videoId: string;
  onTick: (timestamp: number) => void;
  seekRef: React.MutableRefObject<((seconds: number) => void) | null>;
}

export function StatTakerYouTubePlayer({ videoId, onTick, seekRef }: Props) {
  const playerRef = useRef<YTPlayer | null>(null);
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(false);
  const onTickRef = useRef(onTick);
  const containerId = 'stat-taker-yt-player';

  // Keep onTickRef current without re-running the effect
  useEffect(() => {
    onTickRef.current = onTick;
  });

  useEffect(() => {
    mountedRef.current = true;

    function initPlayer() {
      if (!window.YT?.Player) return;
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }

      new window.YT.Player(containerId, {
        videoId,
        playerVars: { enablejsapi: 1, rel: 0, modestbranding: 1 },
        events: {
          onReady(e) {
            if (!mountedRef.current) return;
            playerRef.current = e.target;
            seekRef.current = (seconds) => e.target.seekTo(seconds, true);
          },
        },
      });
    }

    // Start the tick interval immediately; it reports once the player is ready.
    // This avoids the StrictMode double-mount breaking the onReady-scoped interval.
    tickIntervalRef.current = setInterval(() => {
      if (!mountedRef.current || !playerRef.current) return;
      try {
        onTickRef.current(playerRef.current.getCurrentTime());
      } catch {
        // Player may not be ready yet — ignore and retry next tick
      }
    }, 250);

    if (window.YT?.Player) {
      initPlayer();
    } else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        if (mountedRef.current) initPlayer();
      };
    }

    return () => {
      mountedRef.current = false;
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
      playerRef.current?.destroy();
      playerRef.current = null;
      seekRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  return (
    <>
      <Script
        src="https://www.youtube.com/iframe_api"
        strategy="afterInteractive"
      />
      <div className="w-full h-full">
        <div id={containerId} className="w-full h-full" />
      </div>
    </>
  );
}

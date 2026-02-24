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
  const mountedRef = useRef(true);
  const containerId = 'stat-taker-yt-player';

  function initPlayer() {
    if (!window.YT || !window.YT.Player) return;
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }

    const player = new window.YT.Player(containerId, {
      videoId,
      playerVars: {
        enablejsapi: 1,
        rel: 0,
        modestbranding: 1,
      },
      events: {
        onReady(e) {
          playerRef.current = e.target;
          seekRef.current = (seconds) => e.target.seekTo(seconds, true);

          if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
          tickIntervalRef.current = setInterval(() => {
            if (!mountedRef.current) return;
            const t = e.target.getCurrentTime();
            onTick(t);
          }, 250);
        },
      },
    });

    return player;
  }

  useEffect(() => {
    mountedRef.current = true;

    // If the API is already loaded, init immediately
    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      // Queue behind the script onReady callback
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

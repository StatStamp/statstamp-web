'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';

// Minimal YT type declarations (YouTube IFrame API)
declare global {
  interface Window {
    YT: {
      Player: new (
        element: string | HTMLElement,
        options: {
          videoId: string;
          width?: string | number;
          height?: string | number;
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
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Keep onTickRef current without re-running the effect
  useEffect(() => {
    onTickRef.current = onTick;
  });

  useEffect(() => {
    mountedRef.current = true;

    function initPlayer() {
      if (!window.YT?.Player || !wrapperRef.current) return;
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }

      // Always create a fresh container div — avoids the StrictMode problem where
      // YouTube replaces the static div with an iframe on the first mount, leaving
      // nothing for the second mount to attach to.
      wrapperRef.current.innerHTML = '';
      const container = document.createElement('div');
      wrapperRef.current.appendChild(container);

      new window.YT.Player(container, {
        videoId,
        width: '100%',
        height: '100%',
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

    // Start the tick interval immediately; it no-ops until the player is ready.
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
      // Don't chain the previous onYouTubeIframeAPIReady — this is the only YT
      // player on the page, and chaining causes double-init on StrictMode remounts
      // (both the stale and active mount's initPlayer run, the second finds no div).
      window.onYouTubeIframeAPIReady = () => {
        if (mountedRef.current) initPlayer();
      };
    }

    return () => {
      mountedRef.current = false;
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
      playerRef.current?.destroy();
      playerRef.current = null;
      seekRef.current = null;
      // Clear the wrapper so the next mount gets a fresh container div to hand to YT.
      if (wrapperRef.current) wrapperRef.current.innerHTML = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  return (
    <>
      <Script
        src="https://www.youtube.com/iframe_api"
        strategy="afterInteractive"
      />
      <div className="w-full h-full" ref={wrapperRef} />
    </>
  );
}

'use client';

import { useRef, useEffect, useState } from 'react';

interface VideoPlayerProps {
  video: {
    id: string;
    storageUrl: string;
    filename: string;
    duration?: number;
  };
}

export default function VideoPlayer({ video }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleTimeUpdate = () => setCurrentTime(videoElement.currentTime);
    const handleLoadedMetadata = () => setDuration(videoElement.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);

    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
    };
  }, []);

  const togglePlay = async () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const src = videoElement.currentSrc || videoElement.src || video.storageUrl;
    console.debug('VideoPlayer: play attempt', { src, currentSrc: videoElement.currentSrc, video });
    setErrorMessage(null);
    if (!src) {
      console.warn('VideoPlayer: no video source available to play.');
      setErrorMessage('No hay fuente de vídeo disponible.');
      return;
    }

    try {
      const ext = src.split('.').pop()?.toLowerCase() || '';
      const extMap: Record<string, string> = {
        mp4: 'video/mp4',
        webm: 'video/webm',
        mov: 'video/quicktime',
        m4v: 'video/mp4',
        ogv: 'video/ogg',
      };
      const mime = extMap[ext];

      if (mime && typeof videoElement.canPlayType === 'function') {
        const can = videoElement.canPlayType(mime);
        if (!can) {
          console.warn(`VideoPlayer: browser cannot play mime ${mime} for source ${src}`);
          setErrorMessage('Formato de vídeo no soportado por el navegador.');
          return;
        }
      }

      if (isPlaying) {
        videoElement.pause();
        setIsPlaying(false);
      } else {
        const playResult = videoElement.play();
        if (playResult instanceof Promise) {
          await playResult;
        }
        setIsPlaying(true);
      }
    } catch (err: any) {
      if (err?.name === 'NotSupportedError') {
        console.error('VideoPlayer: media not supported', err);
        setErrorMessage(err.message || 'Media not supported');
      } else {
        console.error('VideoPlayer: play error', err);
        setErrorMessage(String(err?.message || err));
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const time = parseFloat(e.target.value);
    videoElement.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const vol = parseFloat(e.target.value);
    videoElement.volume = vol;
    setVolume(vol);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-4xl">
      {/* Video Element */}
      <div className="relative bg-black rounded-lg overflow-hidden shadow-2xl">
        <video
          ref={videoRef}
          src={video.storageUrl}
          className="w-full h-auto"
          onClick={togglePlay}
        />

        {/* Controls Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          {/* Progress Bar */}
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 mb-3 appearance-none bg-zinc-600 rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
          />

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                {isPlaying ? (
                  <span className="text-xl">⏸</span>
                ) : (
                  <span className="text-xl">▶️</span>
                )}
              </button>

              {/* Time */}
              <span className="text-sm text-white">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <span className="text-sm">🔊</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 appearance-none bg-zinc-600 rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-4 text-sm text-zinc-400">
        <p className="font-medium text-white">{video.filename}</p>
      </div>
    </div>
  );
}

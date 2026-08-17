import { useState, useEffect, useRef, useCallback } from 'react';

const AUDIO_SRC = '/qiu-feng-ci.mp3';

export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    const audio = new Audio(AUDIO_SRC);
    audio.loop = true;
    audio.volume = 0.7;
    audio.preload = 'auto';
    audioRef.current = audio;

    let interactionStarted = false;

    const startOnInteraction = () => {
      if (interactionStarted) return;
      interactionStarted = true;
      audio.play().then(() => {
        setPlaying(true);
      }).catch(() => {
        setErrored(true);
      });
      document.removeEventListener('click', startOnInteraction);
      document.removeEventListener('keydown', startOnInteraction);
      document.removeEventListener('touchstart', startOnInteraction);
    };

    const onReady = () => {
      setReady(true);
      setErrored(false);
      audio.play().then(() => {
        setPlaying(true);
      }).catch(() => {
        document.addEventListener('click', startOnInteraction);
        document.addEventListener('keydown', startOnInteraction);
        document.addEventListener('touchstart', startOnInteraction);
      });
    };

    const onError = () => {
      setErrored(true);
      setReady(false);
    };

    audio.addEventListener('canplay', onReady);
    audio.addEventListener('canplaythrough', onReady);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('canplay', onReady);
      audio.removeEventListener('canplaythrough', onReady);
      audio.removeEventListener('error', onError);
      document.removeEventListener('click', startOnInteraction);
      document.removeEventListener('keydown', startOnInteraction);
      document.removeEventListener('touchstart', startOnInteraction);
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => setErrored(true));
    }
  }, [playing]);

  return (
    <button
      onClick={toggle}
      className="group relative p-1.5 sm:p-2 rounded-lg text-gray-400 hover:text-amber-100 hover:bg-white/5 transition-colors flex-shrink-0"
      title={errored ? 'Nhạc nền lỗi — nhấn thử lại' : playing ? 'Tắt nhạc nền' : 'Bật nhạc nền'}
      aria-label={playing ? 'Tắt nhạc nền' : 'Bật nhạc nền'}
    >
      {/* Pipa (đàn tỳ bà) icon */}
      <svg
        viewBox="0 0 24 24"
        className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300 ${playing ? 'text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]' : ''} ${errored ? 'text-red-400/60' : ''}`}
        fill="currentColor"
      >
        {/* Neck */}
        <path d="M10.5 1.5 L13.5 1.5 L13.5 8 L10.5 8 Z" />
        {/* Tuning pegs */}
        <circle cx="11.3" cy="2.8" r="0.7" className="opacity-70" fill="none" stroke="currentColor" strokeWidth="0.8" />
        <circle cx="12.7" cy="2.8" r="0.7" className="opacity-70" fill="none" stroke="currentColor" strokeWidth="0.8" />
        <circle cx="11.3" cy="4.8" r="0.7" className="opacity-70" fill="none" stroke="currentColor" strokeWidth="0.8" />
        <circle cx="12.7" cy="4.8" r="0.7" className="opacity-70" fill="none" stroke="currentColor" strokeWidth="0.8" />
        {/* Body — pear-shaped */}
        <path d="M12 8 C 7.5 8.5, 5 11.5, 5 15.5 C 5 19.5, 8 22, 12 22 C 16 22, 19 19.5, 19 15.5 C 19 11.5, 16.5 8.5, 12 8 Z" />
        {/* Sound hole */}
        <circle cx="12" cy="15.5" r="2.2" className="opacity-30" fill="#0a0a0f" />
        {/* Strings */}
        <line x1="11" y1="9" x2="11" y2="20" stroke="#0a0a0f" strokeWidth="0.4" opacity="0.4" />
        <line x1="11.7" y1="9" x2="11.7" y2="20" stroke="#0a0a0f" strokeWidth="0.4" opacity="0.4" />
        <line x1="12.3" y1="9" x2="12.3" y2="20" stroke="#0a0a0f" strokeWidth="0.4" opacity="0.4" />
        <line x1="13" y1="9" x2="13" y2="20" stroke="#0a0a0f" strokeWidth="0.4" opacity="0.4" />
      </svg>

      {/* Sound wave animation when playing */}
      {playing && (
        <span className="absolute inset-0 rounded-lg pointer-events-none">
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-amber-400/30 animate-ping" style={{ animationDuration: '2s' }} />
        </span>
      )}

      {/* Loading indicator */}
      {!ready && !errored && (
        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400/50 animate-pulse" />
      )}

      {/* Error indicator */}
      {errored && (
        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500/70" />
      )}
    </button>
  );
}

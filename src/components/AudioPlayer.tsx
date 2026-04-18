import { useState, useRef, useEffect } from 'react';
import { Play, Pause, X, RotateCcw, Volume2, VolumeX, ListMusic } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface AudioPlayerProps {
  src: string;
  title: string;
}

export default function AudioPlayer({ src, title }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => setDuration(audio.duration);
    const setAudioTime = () => setCurrentTime(audio.currentTime);

    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);

    return () => {
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
    };
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  const onProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        "fixed bottom-8 left-1/2 -translate-x-1/2 z-40 bg-accent border border-border rounded-xl shadow-xl transition-all duration-500 overflow-hidden px-5 py-3 flex items-center gap-4",
        isExpanded ? "w-[90vw] max-w-lg" : "w-14 h-14 rounded-full flex items-center justify-center p-0"
      )}
    >
      <audio ref={audioRef} src={src || undefined} />

      {isExpanded ? (
        <>
          <button
            onClick={togglePlay}
            className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 flex-shrink-0"
          >
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
          </button>

          <div className="flex-grow flex flex-col gap-1.5 min-w-0">
            <span className="text-[11px] font-bold text-text-main uppercase tracking-widest leading-none truncate pr-4">
              LISTEN TO THIS POST
            </span>
            <div className="flex items-center gap-3">
              <div className="flex-grow h-1 bg-slate-200 rounded-full relative group cursor-pointer overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-100" 
                  style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                />
                <input
                  ref={progressBarRef}
                  type="range"
                  value={currentTime}
                  min={0}
                  max={duration || 0}
                  step="0.1"
                  onChange={onProgressChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full"
                />
              </div>
              <span className="text-[11px] font-medium text-text-sub whitespace-nowrap">
                {formatTime(currentTime)}
              </span>
            </div>
          </div>

          <button 
            onClick={() => setIsExpanded(false)}
            className="p-1.5 text-text-sub hover:text-text-main transition-colors flex-shrink-0"
          >
            <X size={16} />
          </button>
        </>
      ) : (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full h-full flex items-center justify-center text-primary"
        >
          <Play size={20} fill="currentColor" />
        </button>
      )}
    </motion.div>
  );
}

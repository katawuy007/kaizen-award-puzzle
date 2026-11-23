import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { sound } from '../utils/sound.js';

export default function ThemeToggle({ theme, onToggle, compact = false }) {
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={() => {
        sound.playButton();
        onToggle();
      }}
      aria-label={isDark ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}
      title={isDark ? 'สลับเป็นธีมสว่าง (Daylight Expo)' : 'สลับเป็นธีมมืด (Neon Arcade)'}
      className={`relative inline-flex items-center rounded-full p-1 transition-all duration-300 border shrink-0 ${
        isDark
          ? 'bg-slate-900/90 border-indigo-400/35 shadow-[0_0_16px_-4px_rgba(99,102,241,0.55)] hover:border-amber-300/60'
          : 'bg-sky-100/95 border-amber-400/50 shadow-[0_4px_14px_-4px_rgba(245,158,11,0.4)] hover:border-sky-400/70'
      } ${compact ? 'w-12 h-7' : 'w-[58px] sm:w-[94px] h-9 sm:h-10'}`}
    >
      {/* Track background accents */}
      {!compact && (
        <span className="hidden sm:flex items-center justify-between w-full px-2 text-[11px] font-bold pointer-events-none select-none">
          <span className={isDark ? 'text-slate-500' : 'text-amber-700'}>สว่าง</span>
          <span className={isDark ? 'text-indigo-200' : 'text-slate-400'}>มืด</span>
        </span>
      )}

      {/* Sliding Glowing Thumb */}
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 460, damping: 30 }}
        className={`absolute top-1 bottom-1 flex items-center justify-center rounded-full shadow-md ${
          compact ? 'w-5' : 'w-7 sm:w-8'
        } ${
          isDark
            ? 'right-1 bg-gradient-to-br from-indigo-500 via-violet-500 to-sky-400 text-white shadow-indigo-500/50'
            : 'left-1 bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 text-slate-950 shadow-amber-400/60'
        }`}
      >
        <motion.span
          key={theme}
          initial={{ rotate: -90, scale: 0.6, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          transition={{ duration: 0.22 }}
          className="flex items-center justify-center"
        >
          {isDark ? (
            <Moon className={compact ? 'w-3 h-3 fill-current' : 'w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current'} />
          ) : (
            <Sun className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          )}
        </motion.span>
      </motion.span>
    </button>
  );
}

import React from 'react';
import { motion } from 'framer-motion';
import { Rocket, Sparkles, Puzzle } from 'lucide-react';
import { sound } from '../utils/sound.js';

export default function MissionModal({
  theme,
  category,
  gridSize = 4,
  onStartPuzzle,
}) {
  if (!category) return null;
  const isDark = theme === 'dark';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md ${
        isDark ? 'bg-slate-950/80' : 'bg-slate-900/45'
      }`}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.84, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 16 }}
        transition={{ type: 'spring', damping: 20, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          borderColor: `${category.accent}BB`,
          boxShadow: isDark
            ? `0 0 70px -10px ${category.accent}90, 0 25px 50px -12px rgba(0,0,0,0.85)`
            : `0 24px 60px -12px ${category.accent}55, 0 12px 30px -8px rgba(15,23,42,0.2)`,
        }}
        className={`relative w-full max-w-lg rounded-3xl border-2 overflow-hidden ${
          isDark
            ? 'bg-gradient-to-b from-[#141F4A] to-[#090E26]'
            : 'bg-gradient-to-b from-white via-[#F9FBFF] to-[#FFF9EE]'
        }`}
      >
        {/* Top Radiant Accent Bar */}
        <div
          className="h-2 w-full"
          style={{
            background: `linear-gradient(90deg, ${category.accent}, #FBBF24, ${category.accent})`,
          }}
        />

        {/* Subtle Ambient Halo Behind Artwork */}
        <div
          className="pointer-events-none absolute top-16 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-[70px] opacity-30"
          style={{ backgroundColor: category.accent }}
        />

        <div className="relative z-10 p-5 sm:p-7 flex flex-col items-center text-center">
          {/* Header Pill */}
          <div
            className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold mb-3 border ${
              isDark
                ? 'bg-amber-400/15 border-amber-300/35 text-amber-300'
                : 'bg-amber-100 border-amber-300 text-amber-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>ภารกิจที่คุณสุ่มได้!</span>
          </div>

          {/* Award Badge & Title */}
          <div className="flex items-center justify-center gap-2.5 mb-2">
            <span
              className="px-3 py-1 rounded-xl text-xs sm:text-sm font-extrabold tracking-wider text-white shadow-md"
              style={{ backgroundColor: category.accent }}
            >
              {category.code}
            </span>
            <span className="text-2xl sm:text-3xl">{category.icon}</span>
          </div>

          <h2
            className={`font-display font-extrabold text-2xl sm:text-3xl leading-tight mb-4 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            {category.title}
          </h2>

          {/* Teaser Artwork Preview with 5x5 Grid Overlay */}
          <div
            className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden border-2 mb-4 shadow-2xl"
            style={{
              borderColor: category.accent,
              boxShadow: `0 16px 36px -10px ${category.accent}88`,
            }}
          >
            <img src={category.image} alt={category.title} className="w-full h-full object-cover" />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage:
                  'linear-gradient(to right, rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.3) 1px, transparent 1px)',
                backgroundSize: `${100 / gridSize}% ${100 / gridSize}%`,
              }}
            />
            <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-sm border border-white/20 text-[11px] font-bold text-white flex items-center gap-1">
              <Puzzle className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {gridSize}×{gridSize} ({gridSize * gridSize} ชิ้น)
              </span>
            </div>
          </div>

          {/* Exact Thai Description */}
          <div
            className={`w-full rounded-2xl p-3.5 sm:p-4 mb-5 border ${
              isDark ? 'bg-white/5 border-white/10 text-slate-200' : 'bg-slate-100/85 border-slate-200 text-slate-700'
            }`}
          >
            <p className="text-xs sm:text-sm leading-relaxed">{category.description}</p>
          </div>

          {/* Single Primary CTA Button (One-Shot Play — No Respin) */}
          <div className="w-full">
            <button
              type="button"
              onClick={() => {
                sound.playStart();
                onStartPuzzle(category);
              }}
              style={{
                background: `linear-gradient(135deg, ${category.accent}, #F59E0B)`,
                boxShadow: `0 10px 28px -6px ${category.accent}99`,
              }}
              className="w-full py-4 px-6 rounded-2xl font-display font-extrabold text-base sm:text-lg text-white flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all"
            >
              <Rocket className="w-5 h-5" />
              <span>เริ่มเล่นต่อจิ๊กซอร์เลย!</span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

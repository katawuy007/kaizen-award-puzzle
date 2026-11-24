import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Dices,
  Volume2,
  VolumeX,
  Sparkles,
  CheckCircle2,
  Cog,
  Medal,
  QrCode,
  Music,
  LogOut,
  User,
  Trophy,
} from 'lucide-react';
import { CATEGORIES, pickSmartCategory } from '../data/categories.js';
import { sound } from '../utils/sound.js';
import ThemeToggle from './ThemeToggle.jsx';

const REEL_CYCLES = 10;
const CARD_WIDTH_DESKTOP = 216;
const CARD_WIDTH_MOBILE = 172;
const CARD_GAP = 16;
const MARQUEE_BULBS = Array.from({ length: 18 }, (_, i) => i);

export default function LobbyScreen({
  theme,
  onToggleTheme,
  gridSize = 4,
  playerProfile,
  onLogout,
  progress,
  leaderboardCount,
  sessionHistory,
  lastDrawnId,
  muted,
  bgmEnabled,
  onToggleMute,
  onToggleBgm,
  onSpinComplete,
  onOpenCollection,
  onOpenLeaderboard,
  onOpenQr,
  autoSpinToken,
}) {
  const isDark = theme === 'dark';
  const [isSpinning, setIsSpinning] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);
  const [highlightedId, setHighlightedId] = useState(null);
  const [cardWidth, setCardWidth] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 640 ? CARD_WIDTH_MOBILE : CARD_WIDTH_DESKTOP
  );

  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const offsetRef = useRef(0);
  const animFrameRef = useRef(null);
  const spinningRef = useRef(false);
  const hasSpunRef = useRef(false);
  const lastAutoTokenRef = useRef(0);

  const reelItems = useMemo(() => {
    const arr = [];
    for (let cycle = 0; cycle < REEL_CYCLES; cycle++) {
      for (let i = 0; i < CATEGORIES.length; i++) {
        arr.push({
          ...CATEGORIES[i],
          key: `${cycle}-${CATEGORIES[i].id}`,
          index: cycle * CATEGORIES.length + i,
        });
      }
    }
    return arr;
  }, []);

  const stepSize = cardWidth + CARD_GAP;

  useEffect(() => {
    const handleResize = () => {
      const next = window.innerWidth < 640 ? CARD_WIDTH_MOBILE : CARD_WIDTH_DESKTOP;
      setCardWidth(next);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const applyTrackTransform = useCallback((offsetPx) => {
    offsetRef.current = offsetPx;
    if (trackRef.current) {
      trackRef.current.style.transform = `translate3d(${-offsetPx}px, 0, 0)`;
    }
  }, []);

  useEffect(() => {
    const viewportW = viewportRef.current?.clientWidth || 800;
    const initialIndex = CATEGORIES.length + 3;
    const centerOffset = initialIndex * stepSize + cardWidth / 2 - viewportW / 2;
    applyTrackTransform(centerOffset);
  }, [cardWidth, stepSize, applyTrackTransform]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const startSpin = useCallback(() => {
    if (spinningRef.current || hasSpunRef.current) return;
    spinningRef.current = true;
    hasSpunRef.current = true;
    setIsSpinning(true);
    setHasSpun(true);
    setHighlightedId(null);

    const viewportW = viewportRef.current?.clientWidth || 800;
    const targetCategory = pickSmartCategory(progress, sessionHistory, lastDrawnId);
    const targetCatIdx = CATEGORIES.findIndex((c) => c.id === targetCategory.id);

    // Preload ONLY the 1 winning category artwork during the 2.85s spin (~450 KB instead of ~3.2 MB for all 7!)
    const preloadImg = new Image();
    preloadImg.src = targetCategory.image;

    const cyclePx = CATEGORIES.length * stepSize;
    let startOffset = offsetRef.current;
    while (startOffset > cyclePx * 2) startOffset -= cyclePx;
    while (startOffset < cyclePx) startOffset += cyclePx;
    applyTrackTransform(startOffset);

    const targetCycle = 6;
    const targetItemIndex = targetCycle * CATEGORIES.length + targetCatIdx;
    const endOffset = targetItemIndex * stepSize + cardWidth / 2 - viewportW / 2;

    const duration = 2850;
    const startTime = performance.now();
    let lastTickIndex = Math.floor((startOffset + viewportW / 2) / stepSize);

    const animate = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 4.15);

      const currentOffset = startOffset + (endOffset - startOffset) * eased;
      applyTrackTransform(currentOffset);

      const currentCardSlot = Math.floor((currentOffset + viewportW / 2) / stepSize);
      if (currentCardSlot !== lastTickIndex) {
        lastTickIndex = currentCardSlot;
        sound.playTick(t);
      }

      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        spinningRef.current = false;
        setIsSpinning(false);
        setHighlightedId(targetCategory.id);
        sound.playReveal();

        const rect = viewportRef.current?.getBoundingClientRect();
        const originY = rect ? (rect.top + rect.height / 2) / window.innerHeight : 0.45;
        confetti({
          particleCount: 65,
          spread: 76,
          origin: { x: 0.5, y: Math.min(0.85, Math.max(0.2, originY)) },
          colors: [targetCategory.accent, '#FACC15', '#38BDF8', '#FFFFFF', '#F472B6'],
          disableForReducedMotion: true,
        });

        setTimeout(() => {
          onSpinComplete(targetCategory);
        }, 480);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  }, [progress, sessionHistory, lastDrawnId, stepSize, cardWidth, applyTrackTransform, onSpinComplete]);

  useEffect(() => {
    if (autoSpinToken && autoSpinToken !== lastAutoTokenRef.current) {
      const timer = setTimeout(() => {
        lastAutoTokenRef.current = autoSpinToken;
        hasSpunRef.current = false;
        setHasSpun(false);
        startSpin();
      }, 260);
      return () => clearTimeout(timer);
    }
  }, [autoSpinToken, startSpin]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden arcade-grid-bg flex flex-col justify-between transition-colors duration-300">
      {/* Ambient Drifting Aurora & Stage Accents */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className={`absolute -top-36 -left-28 w-[460px] h-[460px] rounded-full blur-[120px] animate-aurora-drift ${
            isDark ? 'bg-sky-500/25' : 'bg-sky-400/25'
          }`}
        />
        <div
          className={`absolute top-1/4 -right-32 w-[480px] h-[480px] rounded-full blur-[130px] animate-aurora-drift ${
            isDark ? 'bg-fuchsia-600/22' : 'bg-amber-300/35'
          }`}
          style={{ animationDelay: '-5s' }}
        />
        <div
          className={`absolute -bottom-36 left-1/3 w-[440px] h-[440px] rounded-full blur-[130px] animate-pulse-glow ${
            isDark ? 'bg-amber-500/18' : 'bg-violet-400/20'
          }`}
        />

        {/* Rotating Mechanical Kaizen Gear Accents */}
        <Cog
          className={`absolute top-16 left-6 w-28 h-28 animate-spin-slow hidden md:block ${
            isDark ? 'text-sky-400/12' : 'text-sky-500/15'
          }`}
        />
        <Cog
          className={`absolute bottom-24 right-8 w-36 h-36 animate-spin-slower hidden md:block ${
            isDark ? 'text-amber-400/12' : 'text-amber-500/15'
          }`}
        />

        {/* Floating Luminous Particles */}
        <div className="absolute top-[18%] right-[22%] w-3 h-3 rounded-full bg-cyan-400/60 shadow-[0_0_14px_#22d3ee] animate-float-slow" />
        <div className="absolute bottom-[30%] left-[14%] w-2.5 h-2.5 rounded-sm rotate-45 bg-amber-400/70 shadow-[0_0_12px_#fbbf24] animate-float-reverse" />
        <div className="absolute top-[42%] left-[8%] w-2 h-2 rounded-full bg-pink-400/60 shadow-[0_0_12px_#f472b6] animate-float-slow hidden sm:block" />
        <div className="absolute top-[28%] right-[9%] w-2.5 h-2.5 rounded-full bg-emerald-400/60 shadow-[0_0_12px_#34d399] animate-float-reverse hidden sm:block" />
      </div>

      {/* Top Navigation Bar */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-3 sm:px-6 pt-3 sm:pt-4 flex items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="shrink-0 w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 p-[2px] shadow-lg shadow-amber-500/35">
            <div
              className={`w-full h-full rounded-[10px] sm:rounded-[14px] flex items-center justify-center text-lg sm:text-2xl ${
                isDark ? 'bg-[#0B112B]' : 'bg-white'
              }`}
            >
              🏆
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`font-display font-extrabold tracking-tight sm:tracking-wide text-sm sm:text-xl bg-clip-text text-transparent whitespace-nowrap ${
                  isDark
                    ? 'bg-gradient-to-r from-amber-300 via-yellow-200 to-sky-300'
                    : 'bg-gradient-to-r from-indigo-700 via-blue-600 to-amber-600'
                }`}
              >
                KAIZEN AWARD
              </span>
              <span
                className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 border ${
                  isDark
                    ? 'bg-sky-500/20 text-sky-300 border-sky-400/30'
                    : 'bg-sky-100 text-sky-700 border-sky-300/70'
                }`}
              >
                4×4 JIGSAW
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-semibold truncate max-w-[140px] sm:max-w-[260px] ${
                  isDark ? 'text-sky-200' : 'text-sky-800'
                }`}
              >
                <User className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="truncate">
                  {playerProfile?.name}
                  {playerProfile?.department ? ` (${playerProfile.department})` : ''}
                </span>
              </span>
              <button
                type="button"
                onClick={() => {
                  sound.playButton();
                  onLogout();
                }}
                title="เปลี่ยนผู้เล่น / กลับหน้าล็อกอิน"
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold transition-colors shrink-0 ${
                  isDark
                    ? 'bg-white/10 hover:bg-white/20 text-slate-300'
                    : 'bg-slate-200/80 hover:bg-slate-300 text-slate-700'
                }`}
              >
                <LogOut className="w-2.5 h-2.5" />
                <span className="hidden sm:inline">เปลี่ยนคน</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />

          <button
            type="button"
            onClick={() => {
              sound.playButton();
              onOpenLeaderboard();
            }}
            className={`glass-panel transition-all px-2 sm:px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs sm:text-sm font-bold whitespace-nowrap ${
              isDark
                ? 'hover:bg-white/15 text-sky-200 border-sky-400/35'
                : 'hover:bg-white text-sky-700 border-sky-300/80'
            }`}
            title="กระดานอันดับ Hall of Fame"
          >
            <Medal className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400 shrink-0" />
            <span className="hidden md:inline">อันดับ</span>
            {leaderboardCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-sky-500/25 text-sky-300">
                {leaderboardCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playButton();
              onOpenQr();
            }}
            className={`glass-panel transition-all p-2 sm:p-2.5 rounded-xl shrink-0 hidden sm:flex items-center justify-center ${
              isDark ? 'hover:bg-white/15 text-slate-200' : 'hover:bg-white text-slate-700'
            }`}
            title="แสดง QR Code สำหรับเล่นบนมือถือหน้าบูธ"
            aria-label="QR Code"
          >
            <QrCode className="w-4 h-4 text-violet-400" />
          </button>

          <button
            type="button"
            onClick={onToggleBgm}
            aria-label={bgmEnabled ? 'ปิดเพลงประกอบ' : 'เปิดเพลงประกอบ'}
            className={`glass-panel transition-all p-2 sm:p-2.5 rounded-xl shrink-0 hidden sm:flex items-center justify-center ${
              bgmEnabled
                ? isDark
                  ? 'border-fuchsia-400/60 bg-fuchsia-500/20 text-fuchsia-300'
                  : 'border-fuchsia-400 bg-fuchsia-100 text-fuchsia-700'
                : isDark
                ? 'hover:bg-white/15 text-slate-400'
                : 'hover:bg-white text-slate-400'
            }`}
            title={bgmEnabled ? 'ปิดเพลงประกอบ (BGM)' : 'เปิดเพลงประกอบสนุกๆ (BGM)'}
          >
            <Music className={`w-4 h-4 ${bgmEnabled ? 'animate-pulse' : ''}`} />
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? 'เปิดเสียง' : 'ปิดเสียง'}
            className={`glass-panel transition-all p-2 sm:p-2.5 rounded-xl shrink-0 ${
              isDark ? 'hover:bg-white/15 text-slate-200' : 'hover:bg-white text-slate-700'
            }`}
            title={muted ? 'เปิดเสียงเอฟเฟกต์' : 'ปิดเสียงเอฟเฟกต์'}
          >
            {muted ? (
              <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" />
            ) : (
              <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
            )}
          </button>
        </div>
      </header>

      {/* Main Hero + Game-Show Marquee Slot-Reel Randomizer */}
      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col items-center justify-center">
        {/* Title Banner */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="text-center mb-3.5 sm:mb-4"
        >
          <div
            className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold mb-2 border shadow-sm ${
              isDark
                ? 'bg-indigo-500/20 border-indigo-400/35 text-indigo-200'
                : 'bg-white/85 border-amber-300/80 text-indigo-700 shadow-indigo-500/10'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>สุ่มภารกิจลุ้นรับตรารางวัลไคเซ็นทั้ง 7 หมวด</span>
          </div>
          <h1
            className={`font-display font-extrabold text-2xl sm:text-4xl lg:text-[42px] tracking-tight ${
              isDark
                ? 'text-white drop-shadow-[0_4px_28px_rgba(56,189,248,0.32)]'
                : 'text-slate-900 drop-shadow-[0_2px_16px_rgba(59,130,246,0.12)]'
            }`}
          >
            สุ่มภารกิจ{' '}
            <span
              className={`bg-clip-text text-transparent ${
                isDark
                  ? 'bg-gradient-to-r from-amber-300 via-orange-400 to-pink-400'
                  : 'bg-gradient-to-r from-orange-500 via-rose-500 to-violet-600'
              }`}
            >
              KAIZEN AWARD
            </span>
          </h1>
          <p className={`mt-1 text-xs sm:text-sm max-w-xl mx-auto ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            ระบบกำลังสุ่มภาพภารกิจ Kaizen Award ของคุณ เตรียมต่อจิ๊กซอร์ {gridSize * gridSize} ชิ้นให้สำเร็จ!
          </p>
        </motion.div>

        {/* Game-Show Marquee Slot-Reel Cabinet */}
        <div className="w-full max-w-5xl relative mb-4 sm:mb-5">
          {/* Outer Metallic / Neon Frame */}
          <div
            className={`relative rounded-[28px] p-[3px] transition-all duration-300 ${
              isDark
                ? 'bg-gradient-to-r from-sky-400 via-amber-400 to-fuchsia-500 shadow-[0_0_60px_-10px_rgba(56,189,248,0.5),0_20px_50px_-20px_rgba(0,0,0,0.85)]'
                : 'bg-gradient-to-r from-amber-400 via-orange-400 to-sky-500 shadow-[0_22px_50px_-16px_rgba(37,99,235,0.28),0_0_0_1px_rgba(255,255,255,0.9)]'
            }`}
          >
            <div
              className={`relative rounded-[25px] overflow-hidden transition-colors duration-300 ${
                isDark
                  ? 'bg-gradient-to-b from-[#0C1436] via-[#080E27] to-[#0B1231]'
                  : 'bg-gradient-to-b from-white via-[#F6F9FF] to-[#FFF9EE]'
              }`}
            >
              {/* Top Marquee Chasing LED Bulbs */}
              <div className="flex items-center justify-around px-4 pt-2 pb-1">
                {MARQUEE_BULBS.map((b) => {
                  const palette = ['#FBBF24', '#38BDF8', '#F472B6'];
                  const color = palette[b % palette.length];
                  return (
                    <span
                      key={`t-${b}`}
                      className={`w-2 h-2 rounded-full ${isSpinning ? 'animate-bulb-chase' : 'animate-bulb-blink'}`}
                      style={{
                        backgroundColor: color,
                        boxShadow: `0 0 8px ${color}`,
                        animationDelay: `${(b % 6) * (isSpinning ? 0.05 : 0.22)}s`,
                      }}
                    />
                  );
                })}
              </div>

              {/* Reel Stage Body */}
              <div className="relative py-3 sm:py-4">
                {/* Center Laser Line & Pointer Triangles */}
                <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
                  <div className="w-0 h-0 border-l-[13px] border-l-transparent border-r-[13px] border-r-transparent border-t-[15px] border-t-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.95)]" />
                </div>
                <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
                  <div className="w-0 h-0 border-l-[13px] border-l-transparent border-r-[13px] border-r-transparent border-b-[15px] border-b-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.95)]" />
                </div>

                {/* Center Target Spotlight Box */}
                <div
                  className={`pointer-events-none absolute top-2 bottom-2 left-1/2 -translate-x-1/2 z-20 rounded-2xl border-[2.5px] border-amber-400 transition-all duration-300 ${
                    isDark
                      ? 'shadow-[0_0_32px_rgba(251,191,36,0.45),inset_0_0_24px_rgba(251,191,36,0.18)]'
                      : 'shadow-[0_0_28px_rgba(245,158,11,0.42),inset_0_0_18px_rgba(251,191,36,0.18)]'
                  }`}
                  style={{ width: `${cardWidth + 14}px` }}
                />

                {/* Left & Right Adaptive Gradient Vignettes */}
                <div
                  className={`pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-28 z-20 bg-gradient-to-r to-transparent ${
                    isDark ? 'from-[#090F2A] via-[#090F2A]/85' : 'from-[#F8FAFF] via-[#F8FAFF]/85'
                  }`}
                />
                <div
                  className={`pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-28 z-20 bg-gradient-to-l to-transparent ${
                    isDark ? 'from-[#090F2A] via-[#090F2A]/85' : 'from-[#F8FAFF] via-[#F8FAFF]/85'
                  }`}
                />

                {/* Reel Viewport */}
                <div ref={viewportRef} className="w-full overflow-hidden py-1">
                  <div
                    ref={trackRef}
                    className="flex items-center will-change-transform"
                    style={{ gap: `${CARD_GAP}px` }}
                  >
                    {reelItems.map((cat) => {
                      const isDone = Boolean(progress[cat.id]?.completed);
                      const isWinner = highlightedId === cat.id && !isSpinning;
                      return (
                        <div
                          key={cat.key}
                          style={{
                            width: `${cardWidth}px`,
                            minWidth: `${cardWidth}px`,
                            borderColor: isWinner ? '#FBBF24' : isDark ? `${cat.accent}77` : `${cat.accent}99`,
                            boxShadow: isWinner
                              ? `0 0 34px ${cat.accent}AA`
                              : isDark
                              ? '0 12px 26px -10px rgba(0,0,0,0.75)'
                              : `0 12px 24px -10px ${cat.accent}45`,
                          }}
                          className={`relative h-[196px] sm:h-[210px] rounded-2xl overflow-hidden border-[1.5px] flex flex-col justify-between p-3.5 select-none transition-shadow ${
                            isDark ? 'bg-slate-900/95' : 'bg-white'
                          }`}
                        >
                          {/* Lightweight Neon Gradient Backdrop (Zero Image Download Until Winner Is Drawn) */}
                          <div
                            className="absolute inset-0"
                            style={{
                              background: isDark
                                ? `radial-gradient(circle at 50% 35%, ${cat.accent}42 0%, rgba(10,16,42,0.88) 65%, ${cat.accent}2E 100%)`
                                : `radial-gradient(circle at 50% 35%, ${cat.accent}24 0%, rgba(255,255,255,0.92) 65%, ${cat.accent}22 100%)`,
                            }}
                          />

                          {/* Top Row: CAT Code + Collected Status */}
                          <div className="relative z-10 flex items-center justify-between">
                            <span
                              className="px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold tracking-wider text-white shadow-sm"
                              style={{ backgroundColor: cat.accent }}
                            >
                              {cat.code}
                            </span>
                            {isDone ? (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  isDark
                                    ? 'bg-emerald-500/25 text-emerald-300 border-emerald-400/40'
                                    : 'bg-emerald-100 text-emerald-700 border-emerald-300'
                                }`}
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                ผ่านแล้ว
                              </span>
                            ) : (
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                  isDark
                                    ? 'bg-white/10 text-slate-200 border-white/15'
                                    : 'bg-slate-900/5 text-slate-600 border-slate-300/70'
                                }`}
                              >
                                {gridSize}×{gridSize}
                              </span>
                            )}
                          </div>

                          {/* Center Icon Medallion */}
                          <div className="relative z-10 flex flex-col items-center justify-center my-auto">
                            <div
                              className={`w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl flex items-center justify-center text-4xl sm:text-[44px] border backdrop-blur-md ${
                                isDark ? 'border-white/25' : 'border-white shadow-lg'
                              }`}
                              style={{
                                background: isDark
                                  ? `radial-gradient(circle at 30% 25%, ${cat.accent}66, rgba(15,23,42,0.82))`
                                  : `radial-gradient(circle at 30% 25%, #FFFFFF, ${cat.accent}28)`,
                                boxShadow: `0 10px 24px -6px ${cat.accent}77`,
                              }}
                            >
                              {cat.icon}
                            </div>
                          </div>

                          {/* Bottom Title */}
                          <div className="relative z-10 text-center">
                            <h3
                              className={`font-display font-bold text-sm sm:text-base leading-tight line-clamp-2 ${
                                isDark ? 'text-white drop-shadow' : 'text-slate-900'
                              }`}
                            >
                              {cat.title}
                            </h3>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom Marquee Chasing LED Bulbs */}
              <div className="flex items-center justify-around px-4 pt-1 pb-2">
                {MARQUEE_BULBS.map((b) => {
                  const palette = ['#38BDF8', '#F472B6', '#FBBF24'];
                  const color = palette[b % palette.length];
                  return (
                    <span
                      key={`b-${b}`}
                      className={`w-2 h-2 rounded-full ${isSpinning ? 'animate-bulb-chase' : 'animate-bulb-blink'}`}
                      style={{
                        backgroundColor: color,
                        boxShadow: `0 0 8px ${color}`,
                        animationDelay: `${((18 - b) % 6) * (isSpinning ? 0.05 : 0.22)}s`,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Primary Arcade Random Draw Button (Auto-Spins Once on Enter) */}
        <div className="flex items-center justify-center w-full">
          <button
            type="button"
            disabled={isSpinning || hasSpun}
            onClick={startSpin}
            className="cta-button-glow relative overflow-hidden group w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-4.5 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-slate-950 font-display font-extrabold text-base sm:text-xl tracking-wide flex items-center justify-center gap-2.5 whitespace-nowrap disabled:opacity-80 disabled:cursor-wait"
          >
            <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
              <span className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/55 to-transparent animate-shimmer" />
            </span>
            <Dices
              className={`w-5 h-5 sm:w-6 sm:h-6 shrink-0 ${
                isSpinning ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'
              }`}
            />
            <span>
              {isSpinning
                ? 'กำลังสุ่มภารกิจ Kaizen Award...'
                : hasSpun
                ? 'สุ่มภารกิจสำเร็จ! กำลังเปิดภารกิจ...'
                : 'สุ่มรับภารกิจ Kaizen Award!'}
            </span>
          </button>
        </div>
      </main>

      {/* Clean Footer */}
      <footer className="relative z-10 text-center pb-5 px-4">
        <p className={`text-[11px] sm:text-xs flex items-center justify-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          <span>ภารกิจสุ่ม 1 รอบ 4×4 (16 ชิ้น) • ต่อสำเร็จบันทึกคะแนนขึ้น Hall of Fame อัตโนมัติ</span>
        </p>
      </footer>
    </div>
  );
}

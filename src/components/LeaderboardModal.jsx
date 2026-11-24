import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Trophy,
  Medal,
  Clock,
  Star,
  Sparkles,
  Trash2,
  AlertTriangle,
  Building2,
  Download,
  RefreshCw,
  Wifi,
  HardDrive,
} from 'lucide-react';
import { CATEGORIES, DIFFICULTIES, formatTime } from '../data/categories.js';
import { sound } from '../utils/sound.js';
import { exportLeaderboardCsv } from '../utils/supabase.js';

export default function LeaderboardModal({
  theme,
  entries,
  source = 'local',
  liveRealtime = false,
  loading = false,
  onRefresh,
  onClearLeaderboard,
  onClose,
}) {
  const isDark = theme === 'dark';
  const isOnline = source === 'supabase';
  const [selectedCat, setSelectedCat] = useState('all');
  const [selectedGrid, setSelectedGrid] = useState('all');
  const [confirmClear, setConfirmClear] = useState(false);

  const filtered = useMemo(() => {
    return entries
      .filter((e) => (selectedCat === 'all' ? true : e.categoryId === selectedCat))
      .filter((e) => (selectedGrid === 'all' ? true : e.gridSize === Number(selectedGrid)))
      .sort((a, b) => {
        if (selectedGrid === 'all' && b.gridSize !== a.gridSize) return b.gridSize - a.gridSize;
        if (a.elapsedSeconds !== b.elapsedSeconds) return a.elapsedSeconds - b.elapsedSeconds;
        return a.hintsUsed - b.hintsUsed;
      })
      .slice(0, 20);
  }, [entries, selectedCat, selectedGrid]);

  const catMap = useMemo(() => {
    const m = {};
    CATEGORIES.forEach((c) => {
      m[c.id] = c;
    });
    return m;
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className={`fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 backdrop-blur-md ${
        isDark ? 'bg-slate-950/85' : 'bg-slate-900/45'
      }`}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.24 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden ${
          isDark
            ? 'border-white/15 bg-gradient-to-b from-[#131C42] to-[#080D24]'
            : 'border-white bg-gradient-to-b from-white via-[#F7FAFF] to-[#FFFBF0]'
        }`}
      >
        {/* Header */}
        <div
          className={`px-5 sm:px-6 py-4 border-b flex flex-wrap items-center justify-between gap-3 ${
            isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200/80 bg-white/80'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                isDark ? 'bg-amber-400/20 border-amber-400/40' : 'bg-amber-100 border-amber-300'
              }`}
            >
              <Medal className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className={`font-display font-bold text-lg sm:text-xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Hall of Fame — กระดานอันดับ Kaizen Award
                </h2>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    isOnline
                      ? isDark
                        ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                        : 'bg-emerald-100 border-emerald-300 text-emerald-800'
                      : isDark
                      ? 'bg-slate-800 border-white/15 text-slate-300'
                      : 'bg-slate-100 border-slate-300 text-slate-600'
                  }`}
                >
                  {isOnline ? (
                    <Wifi className={`w-3 h-3 ${liveRealtime ? 'animate-pulse' : ''}`} />
                  ) : (
                    <HardDrive className="w-3 h-3" />
                  )}
                  <span>
                    {isOnline ? (liveRealtime ? 'TV Live' : 'Online') : 'Local Mode'}
                  </span>
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                ทำเนียบผู้พิชิตจิ๊กซอร์ทำเวลาเร็วที่สุดประจำบูธ ({entries.length} สถิติ)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {isOnline && onRefresh && (
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  sound.playButton();
                  onRefresh();
                }}
                className={`p-2 rounded-xl border transition-colors ${
                  isDark
                    ? 'bg-white/5 hover:bg-white/15 border-white/15 text-sky-300'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-sky-700'
                }`}
                title="รีเฟรชอันดับล่าสุด"
                aria-label="รีเฟรชอันดับ"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}

            <button
              type="button"
              disabled={entries.length === 0}
              onClick={() => {
                sound.playButton();
                exportLeaderboardCsv(filtered.length > 0 ? filtered : entries);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all disabled:opacity-35 disabled:cursor-not-allowed ${
                isDark
                  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border-emerald-400/40'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
              }`}
              title="ส่งออกตารางเป็นไฟล์ CSV เปิดใน Excel ได้ทันที"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            {!isOnline && (!confirmClear ? (
              <button
                type="button"
                disabled={entries.length === 0}
                onClick={() => {
                  sound.playButton();
                  setConfirmClear(true);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all disabled:opacity-35 disabled:cursor-not-allowed ${
                  isDark
                    ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border-rose-500/30'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ล้างอันดับ</span>
              </button>
            ) : (
              <div
                className={`flex items-center gap-1.5 border rounded-xl px-2.5 py-1 ${
                  isDark ? 'bg-rose-950/80 border-rose-500/50' : 'bg-rose-50 border-rose-300'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                <span className={`text-xs font-medium ${isDark ? 'text-rose-200' : 'text-rose-800'}`}>
                  ยืนยัน?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    sound.playButton();
                    onClearLeaderboard();
                    setConfirmClear(false);
                  }}
                  className="px-2 py-0.5 rounded-lg bg-rose-500 text-white text-xs font-bold"
                >
                  ล้างเลย
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className={`px-2 py-0.5 rounded-lg text-xs ${
                    isDark ? 'bg-white/10 text-slate-200' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  ยกเลิก
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => {
                sound.playButton();
                onClose();
              }}
              className={`p-2 rounded-xl transition-colors ${
                isDark ? 'bg-white/10 hover:bg-white/20 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              aria-label="ปิดกระดานอันดับ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Filter Bar (4x4 Mode) */}
        <div
          className={`px-4 sm:px-6 py-3 border-b flex flex-wrap items-center justify-between gap-2.5 ${
            isDark ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200/70 bg-slate-50/70'
          }`}
        >
          <span
            className={`px-3 py-1 rounded-xl text-xs font-bold border ${
              isDark
                ? 'bg-amber-400/15 border-amber-400/35 text-amber-300'
                : 'bg-amber-100 border-amber-300 text-amber-800'
            }`}
          >
            🧩 โหมดมาตรฐาน 4×4 (16 ชิ้น)
          </span>

          {/* Category Filter */}
          <select
            value={selectedCat}
            onChange={(e) => {
              sound.playButton();
              setSelectedCat(e.target.value);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border outline-none ${
              isDark
                ? 'bg-slate-900 border-white/15 text-slate-100'
                : 'bg-white border-slate-300 text-slate-800'
            }`}
          >
            <option value="all">ทุกหมวดรางวัล (CAT 01 – CAT 07)</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} {c.icon} {c.title}
              </option>
            ))}
          </select>
        </div>

        {/* Rankings List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center gap-3">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                  isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-400'
                }`}
              >
                <Trophy className="w-8 h-8" />
              </div>
              <p className={`font-display font-bold text-base ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                ยังไม่มีสถิติในหมวดนี้
              </p>
              <p className={`text-xs max-w-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                ต่อจิ๊กซอร์ให้สำเร็จแล้วกรอกชื่อเล่น/แผนกในหน้าฉลองชัยชนะ เพื่อขึ้นทำเนียบอันดับ 1 คนแรก!
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {filtered.map((item, idx) => {
                const cat = catMap[item.categoryId] || CATEGORIES[0];
                const rankBadge = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
                const isTop3 = idx < 3;

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border px-3.5 sm:px-4 py-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 transition-all ${
                      isTop3
                        ? isDark
                          ? 'bg-gradient-to-r from-amber-500/12 via-slate-900/90 to-slate-900/90 border-amber-400/40'
                          : 'bg-gradient-to-r from-amber-50 via-white to-white border-amber-300 shadow-sm'
                        : isDark
                        ? 'bg-slate-900/65 border-white/10'
                        : 'bg-white border-slate-200/90'
                    }`}
                  >
                    {/* Left: Rank + Player Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-display font-extrabold shrink-0 ${
                          isTop3
                            ? 'text-xl bg-amber-400/20'
                            : isDark
                            ? 'text-xs bg-white/5 text-slate-300'
                            : 'text-xs bg-slate-100 text-slate-600'
                        }`}
                      >
                        {rankBadge}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`font-display font-bold text-sm sm:text-base truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {item.name}
                          </span>
                          {item.quizBonus && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-400/35">
                              <Sparkles className="w-2.5 h-2.5" />
                              Quiz
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap mt-0.5 text-[11px]">
                          {item.department && (
                            <span
                              className={`inline-flex items-center gap-1 ${
                                isDark ? 'text-slate-300' : 'text-slate-600'
                              }`}
                            >
                              <Building2 className="w-3 h-3 text-sky-400" />
                              {item.department}
                            </span>
                          )}
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-extrabold text-white"
                            style={{ backgroundColor: cat.accent }}
                          >
                            {cat.code} {cat.icon}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              isDark ? 'bg-white/10 text-slate-200' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {item.gridSize}×{item.gridSize}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Stars + Time */}
                    <div className="flex items-center gap-3 ml-auto shrink-0">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= (item.stars || 1)
                                ? 'fill-amber-400 text-amber-400'
                                : isDark
                                ? 'text-slate-700'
                                : 'text-slate-300'
                            }`}
                          />
                        ))}
                      </div>
                      <div
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-xl font-mono font-extrabold text-xs sm:text-sm ${
                          isDark ? 'bg-sky-500/15 text-sky-300' : 'bg-sky-50 text-sky-700 border border-sky-200'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5 text-sky-500" />
                        <span>{formatTime(item.elapsedSeconds)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

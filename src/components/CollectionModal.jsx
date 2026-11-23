import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Trophy,
  Star,
  Clock,
  Lock,
  Play,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { CATEGORIES, formatTime } from '../data/categories.js';
import { sound } from '../utils/sound.js';
import { downloadMasterCertificate } from '../utils/certificate.js';

export default function CollectionModal({
  theme,
  gridSize,
  progress,
  playerProfile,
  initialFocusId,
  onSelectCategory,
  onResetProgress,
  onClose,
}) {
  const isDark = theme === 'dark';
  const [confirmReset, setConfirmReset] = useState(false);
  const [downloadingCert, setDownloadingCert] = useState(false);

  const completedCount = CATEGORIES.filter((c) => progress[c.id]?.completed).length;

  const handleDownloadMaster = async () => {
    sound.playButton();
    setDownloadingCert(true);
    try {
      await downloadMasterCertificate({
        progress,
        playerName: playerProfile?.name || '',
        department: playerProfile?.department || '',
      });
    } finally {
      setDownloadingCert(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 backdrop-blur-md ${
        isDark ? 'bg-slate-950/85' : 'bg-slate-900/45'
      }`}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.25 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-5xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden ${
          isDark
            ? 'border-white/15 bg-gradient-to-b from-[#11193D] to-[#080D24]'
            : 'border-white bg-gradient-to-b from-white via-[#F7FAFF] to-[#FFFBF2]'
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
              <Trophy className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className={`font-display font-bold text-lg sm:text-xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
                คอลเลกชันรางวัล & เลือกเล่นเอง (7 หมวด)
              </h2>
              <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                ปลดล็อกแล้ว {completedCount} / {CATEGORIES.length} Kaizen Awards — คลิกปุ่มเล่นเพื่อเริ่มหมวดที่ต้องการได้ทันที
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {completedCount > 0 && (
              <button
                type="button"
                disabled={downloadingCert}
                onClick={handleDownloadMaster}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 hover:brightness-110 flex items-center gap-1.5 shadow transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>
                  {completedCount === CATEGORIES.length
                    ? 'เกียรติบัตร Kaizen Master (PNG)'
                    : 'บันทึกคอลเลกชัน (PNG)'}
                </span>
              </button>
            )}

            {!confirmReset ? (
              <button
                type="button"
                onClick={() => {
                  sound.playButton();
                  setConfirmReset(true);
                }}
                disabled={completedCount === 0}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all disabled:opacity-35 disabled:cursor-not-allowed ${
                  isDark
                    ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border-rose-500/30'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>รีเซ็ตสถิติ</span>
              </button>
            ) : (
              <div
                className={`flex items-center gap-1.5 border rounded-xl px-2.5 py-1.5 ${
                  isDark ? 'bg-rose-950/80 border-rose-500/50' : 'bg-rose-50 border-rose-300'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                <span className={`text-xs font-medium ${isDark ? 'text-rose-200' : 'text-rose-800'}`}>
                  ยืนยันลบสถิติ?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    sound.playButton();
                    onResetProgress();
                    setConfirmReset(false);
                  }}
                  className="px-2 py-0.5 rounded-lg bg-rose-500 text-white text-xs font-bold hover:bg-rose-600"
                >
                  ลบเลย
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className={`px-2 py-0.5 rounded-lg text-xs ${
                    isDark ? 'bg-white/10 text-slate-200 hover:bg-white/20' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  ยกเลิก
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                sound.playButton();
                onClose();
              }}
              className={`p-2 rounded-xl transition-colors ${
                isDark ? 'bg-white/10 hover:bg-white/20 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              aria-label="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable 7-Category Gallery Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORIES.map((cat) => {
            const record = progress[cat.id];
            const unlocked = Boolean(record?.completed);
            const isFocused = initialFocusId === cat.id;

            return (
              <div
                key={cat.id}
                style={{
                  borderColor: isFocused
                    ? '#FBBF24'
                    : unlocked
                    ? `${cat.accent}99`
                    : isDark
                    ? 'rgba(255,255,255,0.12)'
                    : 'rgba(203,213,225,0.9)',
                }}
                className={`rounded-2xl border p-3.5 flex flex-col justify-between transition-all ${
                  isDark ? 'bg-slate-900/75' : 'bg-white shadow-sm hover:shadow-md'
                } ${isFocused ? 'ring-2 ring-amber-400/60' : ''}`}
              >
                <div>
                  {/* Artwork Area */}
                  <div
                    className={`relative aspect-square w-full rounded-xl overflow-hidden mb-3 border ${
                      isDark ? 'bg-slate-950 border-white/10' : 'bg-slate-100 border-slate-200'
                    }`}
                  >
                    <img
                      src={cat.image}
                      alt={cat.title}
                      className={`w-full h-full object-cover transition-all ${
                        unlocked ? '' : isDark ? 'grayscale brightness-[0.28] blur-[3px]' : 'grayscale opacity-25 blur-[2px]'
                      }`}
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span
                        className="px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold text-white shadow"
                        style={{ backgroundColor: cat.accent }}
                      >
                        {cat.code}
                      </span>
                    </div>

                    {unlocked ? (
                      <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow">
                        <CheckCircle2 className="w-3 h-3" />
                        ปลดล็อกแล้ว
                      </span>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                        <div
                          className={`w-11 h-11 rounded-full border flex items-center justify-center shadow ${
                            isDark ? 'bg-slate-900/90 border-white/20 text-slate-300' : 'bg-white/95 border-slate-200 text-slate-500'
                          }`}
                        >
                          <Lock className="w-5 h-5" />
                        </div>
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                            isDark ? 'text-slate-200 bg-slate-950/75' : 'text-slate-700 bg-white/90 shadow-sm'
                          }`}
                        >
                          ยังไม่ได้ปลดล็อก
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Category Info */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-lg">{cat.icon}</span>
                    <h3
                      className={`font-display font-bold text-base leading-snug ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {cat.title}
                    </h3>
                  </div>

                  <p className={`text-xs leading-relaxed mb-3 ${isDark ? 'text-slate-300/90' : 'text-slate-600'}`}>
                    {cat.description}
                  </p>
                </div>

                {/* Stats + Direct Play Button */}
                <div
                  className={`pt-2.5 border-t flex items-center justify-between gap-2 ${
                    isDark ? 'border-white/10' : 'border-slate-200/80'
                  }`}
                >
                  {unlocked ? (
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 3 }).map((_, idx) => (
                          <Star
                            key={idx}
                            className={`w-3.5 h-3.5 ${
                              idx < (record.bestStars || 1)
                                ? 'fill-amber-400 text-amber-400'
                                : isDark
                                ? 'text-slate-600'
                                : 'text-slate-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-mono font-semibold ${
                          isDark ? 'text-emerald-300' : 'text-emerald-700'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        {formatTime(record.bestTime)}
                      </span>
                    </div>
                  ) : (
                    <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      พร้อมท้าทาย {gridSize}×{gridSize}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      sound.playStart();
                      onSelectCategory(cat);
                    }}
                    style={{ backgroundColor: cat.accent }}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 hover:brightness-110 active:scale-95 transition-all shadow"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{unlocked ? 'เล่นอีกครั้ง' : 'เล่นหมวดนี้'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

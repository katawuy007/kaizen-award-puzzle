import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Star,
  Clock,
  Lightbulb,
  Flame,
  Dices,
  RotateCcw,
  Award,
  Sparkles,
  Download,
  Medal,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { CATEGORIES, formatTime } from '../data/categories.js';
import { sound } from '../utils/sound.js';
import { downloadCategoryCertificate } from '../utils/certificate.js';

export default function VictoryModal({
  theme,
  category,
  gridSize = 5,
  stats,
  isNewBest,
  completedCount,
  playerProfile,
  onSaveScore,
  onNextRandom,
  onReplay,
  onOpenCollection,
}) {
  const isDark = theme === 'dark';

  const [playerName, setPlayerName] = useState(playerProfile?.name || '');
  const [department, setDepartment] = useState(playerProfile?.department || '');
  const [scoreSaved, setScoreSaved] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Bonus Kaizen Mini-Quiz state
  const [selectedChoice, setSelectedChoice] = useState(null);
  const quiz = category.quiz;
  const quizAnswered = selectedChoice !== null;
  const quizCorrect = quizAnswered && selectedChoice === quiz?.correctIndex;

  useEffect(() => {
    sound.playVictory();

    const colors = [category.accent, '#FACC15', '#38BDF8', '#34D399', '#F472B6', '#FFFFFF'];

    confetti({
      particleCount: 95,
      spread: 85,
      origin: { x: 0.5, y: 0.52 },
      colors,
      disableForReducedMotion: true,
    });

    const t1 = setTimeout(() => {
      confetti({
        particleCount: 55,
        angle: 60,
        spread: 60,
        origin: { x: 0.05, y: 0.65 },
        colors,
        disableForReducedMotion: true,
      });
      confetti({
        particleCount: 55,
        angle: 120,
        spread: 60,
        origin: { x: 0.95, y: 0.65 },
        colors,
        disableForReducedMotion: true,
      });
    }, 260);

    const t2 = setTimeout(() => {
      confetti({
        particleCount: 65,
        spread: 110,
        origin: { x: 0.5, y: 0.25 },
        colors,
        disableForReducedMotion: true,
      });
    }, 620);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [category]);

  const handleAnswerQuiz = (idx) => {
    if (quizAnswered) return;
    setSelectedChoice(idx);
    if (idx === quiz.correctIndex) {
      sound.playQuizCorrect();
      confetti({
        particleCount: 45,
        spread: 65,
        origin: { x: 0.5, y: 0.7 },
        colors: ['#34D399', '#FACC15', '#38BDF8', '#FFFFFF'],
        disableForReducedMotion: true,
      });
    } else {
      sound.playQuizWrong();
    }
  };

  const handleSaveLeaderboard = (e) => {
    e.preventDefault();
    if (scoreSaved) return;
    sound.playReveal();
    onSaveScore({
      name: playerName.trim() || 'ผู้ท้าชิง Kaizen',
      department: department.trim(),
      categoryId: category.id,
      gridSize,
      elapsedSeconds: stats.elapsedSeconds,
      hintsUsed: stats.hintsUsed,
      maxCombo: stats.maxCombo,
      stars: stats.stars,
      quizBonus: quizCorrect,
    });
    setScoreSaved(true);
  };

  const handleDownloadCertificate = async () => {
    sound.playButton();
    setDownloading(true);
    try {
      await downloadCategoryCertificate({
        category,
        stats,
        gridSize,
        playerName,
        department,
        quizBonus: quizCorrect,
      });
    } finally {
      setDownloading(false);
    }
  };

  const stars = stats?.stars || 1;
  const allCollected = completedCount >= CATEGORIES.length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 backdrop-blur-md overflow-y-auto ${
        isDark ? 'bg-slate-950/85' : 'bg-slate-900/45'
      }`}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.84, y: 26 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ type: 'spring', damping: 20, stiffness: 250 }}
        style={{
          borderColor: `${category.accent}CC`,
          boxShadow: isDark
            ? `0 0 80px -10px ${category.accent}99, 0 25px 60px -12px rgba(0,0,0,0.9)`
            : `0 28px 70px -14px ${category.accent}66, 0 14px 36px -10px rgba(15,23,42,0.22)`,
        }}
        className={`relative w-full max-w-3xl max-h-[94vh] flex flex-col rounded-3xl border-2 overflow-hidden my-auto ${
          isDark
            ? 'bg-gradient-to-b from-[#141E48] via-[#0D1433] to-[#080C22]'
            : 'bg-gradient-to-b from-white via-[#F9FBFF] to-[#FFF9ED]'
        }`}
      >
        {/* Top Celebratory Strip */}
        <div
          className="h-2 w-full shrink-0"
          style={{
            background: `linear-gradient(90deg, ${category.accent}, #FACC15, #34D399, ${category.accent})`,
          }}
        />

        {/* Rotating Radiant Sunburst Glow Behind Card */}
        <div
          className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[520px] h-[520px] opacity-15 animate-sunburst"
          style={{
            background: `repeating-conic-gradient(from 0deg, ${category.accent} 0deg 12deg, transparent 12deg 28deg)`,
            maskImage: 'radial-gradient(circle, black 10%, transparent 65%)',
            WebkitMaskImage: 'radial-gradient(circle, black 10%, transparent 65%)',
          }}
        />

        <div className="relative z-10 p-4 sm:p-6 overflow-y-auto">
          {/* Header Celebration */}
          <div className="text-center mb-4">
            <div
              className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold mb-1.5 border ${
                isDark
                  ? 'bg-amber-400/20 border-amber-300/40 text-amber-300'
                  : 'bg-amber-100 border-amber-300 text-amber-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>
                {allCollected
                  ? '🎉 สุดยอด! สะสมครบทั้ง 7 หมวดแล้ว!'
                  : `ภารกิจ ${gridSize}×${gridSize} สำเร็จ! ปลดล็อกรางวัล Kaizen Award`}
              </span>
            </div>

            <h2
              className={`font-display font-extrabold text-xl sm:text-3xl flex items-center justify-center gap-2 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              <span>🏆 ยินดีด้วย! ต่อสำเร็จ 100%</span>
            </h2>

            {/* Animated Stars */}
            <div className="flex items-center justify-center gap-2 mt-2">
              {[1, 2, 3].map((idx) => {
                const earned = idx <= stars;
                return (
                  <motion.div
                    key={idx}
                    initial={{ scale: 0, rotate: -35 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.15 + idx * 0.12, type: 'spring', stiffness: 320 }}
                  >
                    <Star
                      className={`w-7 h-7 sm:w-8 sm:h-8 ${
                        earned
                          ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.75)]'
                          : isDark
                          ? 'text-slate-700'
                          : 'text-slate-300'
                      }`}
                    />
                  </motion.div>
                );
              })}
              {isNewBest && (
                <span className="ml-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500 text-white shadow">
                  NEW BEST!
                </span>
              )}
              {quizCorrect && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-sky-500 text-white shadow">
                  ✨ โบนัส Quiz!
                </span>
              )}
            </div>
          </div>

          {/* Collectible Kaizen Award Card Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center mb-4">
            {/* Completed High-Res Artwork Frame */}
            <div className="sm:col-span-5 flex flex-col items-center gap-2.5">
              <div
                style={{
                  borderColor: category.accent,
                  boxShadow: `0 16px 38px -10px ${category.accent}99`,
                }}
                className="relative w-44 h-44 sm:w-full sm:h-auto sm:aspect-square rounded-2xl overflow-hidden border-2 bg-slate-950"
              >
                <img src={category.image} alt={category.title} className="w-full h-full object-cover" />
                <div
                  className="absolute top-2 left-2 px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold text-white shadow-md"
                  style={{ backgroundColor: category.accent }}
                >
                  {category.code}
                </div>
                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-slate-950/85 border border-amber-400/50 text-[10px] font-bold text-amber-300 flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  <span>UNLOCKED</span>
                </div>
              </div>

              {/* Download Collectible Certificate PNG */}
              <button
                type="button"
                disabled={downloading}
                onClick={handleDownloadCertificate}
                className={`w-full py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                  isDark
                    ? 'bg-sky-500/20 hover:bg-sky-500/30 border-sky-400/45 text-sky-200'
                    : 'bg-sky-50 hover:bg-sky-100 border-sky-300 text-sky-800'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>{downloading ? 'กำลังสร้างการ์ด...' : 'บันทึกการ์ดรางวัล (PNG)'}</span>
              </button>
            </div>

            {/* Category Knowledge Takeaway + Performance Stats */}
            <div className="sm:col-span-7 flex flex-col gap-2.5">
              <div
                className={`rounded-2xl border p-3.5 ${
                  isDark ? 'bg-white/[0.06] border-white/12' : 'bg-slate-100/80 border-slate-200/90'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{category.icon}</span>
                  <h3
                    className={`font-display font-extrabold text-base sm:text-lg leading-tight ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {category.title}
                  </h3>
                </div>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  {category.description}
                </p>
              </div>

              {/* 3 Performance Stat Chips */}
              <div className="grid grid-cols-3 gap-2">
                <div
                  className={`rounded-2xl border p-2 text-center ${
                    isDark ? 'bg-slate-900/80 border-white/10' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div
                    className={`flex items-center justify-center gap-1 text-[10px] mb-0.5 ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    <Clock className="w-3 h-3 text-sky-500" />
                    <span>เวลา ({gridSize}×{gridSize})</span>
                  </div>
                  <div
                    className={`font-mono font-extrabold text-sm sm:text-base ${
                      isDark ? 'text-sky-300' : 'text-sky-700'
                    }`}
                  >
                    {formatTime(stats.elapsedSeconds)}
                  </div>
                </div>

                <div
                  className={`rounded-2xl border p-2 text-center ${
                    isDark ? 'bg-slate-900/80 border-white/10' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div
                    className={`flex items-center justify-center gap-1 text-[10px] mb-0.5 ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    <Lightbulb className="w-3 h-3 text-amber-500" />
                    <span>ตัวช่วย</span>
                  </div>
                  <div
                    className={`font-mono font-extrabold text-sm sm:text-base ${
                      isDark ? 'text-amber-300' : 'text-amber-700'
                    }`}
                  >
                    {stats.hintsUsed} ครั้ง
                  </div>
                </div>

                <div
                  className={`rounded-2xl border p-2 text-center ${
                    isDark ? 'bg-slate-900/80 border-white/10' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div
                    className={`flex items-center justify-center gap-1 text-[10px] mb-0.5 ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    <Flame className="w-3 h-3 text-orange-500" />
                    <span>Max Combo</span>
                  </div>
                  <div
                    className={`font-mono font-extrabold text-sm sm:text-base ${
                      isDark ? 'text-orange-300' : 'text-orange-600'
                    }`}
                  >
                    x{stats.maxCombo}
                  </div>
                </div>
              </div>

              {/* Hall of Fame Score Registration Form */}
              <form
                onSubmit={handleSaveLeaderboard}
                className={`rounded-2xl border p-3 ${
                  isDark ? 'bg-indigo-950/50 border-indigo-400/25' : 'bg-indigo-50/75 border-indigo-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-xs font-bold flex items-center gap-1.5 ${
                      isDark ? 'text-indigo-200' : 'text-indigo-900'
                    }`}
                  >
                    <Medal className="w-3.5 h-3.5 text-amber-400" />
                    บันทึกชื่อขึ้นกระดานอันดับ Hall of Fame
                  </span>
                  {scoreSaved && (
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      บันทึกแล้ว!
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="ชื่อเล่นของคุณ..."
                    value={playerName}
                    disabled={scoreSaved}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={28}
                    className={`flex-1 px-3 py-1.5 rounded-xl text-xs border outline-none ${
                      isDark
                        ? 'bg-slate-900/90 border-white/15 text-white placeholder:text-slate-500 focus:border-amber-400'
                        : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500'
                    }`}
                  />
                  <input
                    type="text"
                    placeholder="แผนก / หน่วยงาน (ถ้ามี)"
                    value={department}
                    disabled={scoreSaved}
                    onChange={(e) => setDepartment(e.target.value)}
                    maxLength={28}
                    className={`flex-1 px-3 py-1.5 rounded-xl text-xs border outline-none ${
                      isDark
                        ? 'bg-slate-900/90 border-white/15 text-white placeholder:text-slate-500 focus:border-amber-400'
                        : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={scoreSaved}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 hover:brightness-110 disabled:opacity-50 text-white text-xs font-bold whitespace-nowrap transition-all"
                  >
                    {scoreSaved ? 'บันทึกสำเร็จ' : 'บันทึกอันดับ'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Bonus Kaizen Mini-Quiz (1 Fun Question) */}
          {quiz && (
            <div
              className={`rounded-2xl border p-3.5 mb-4 ${
                isDark ? 'bg-white/[0.04] border-white/12' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span className={`text-xs font-bold ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                  โบนัสความรู้ Kaizen (ตอบถูกปลดล็อกตรา Quiz Bonus!):
                </span>
              </div>
              <p className={`text-xs sm:text-sm font-semibold mb-2.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {quiz.question}
              </p>
              <div className="grid grid-cols-1 gap-1.5">
                {quiz.options.map((opt, idx) => {
                  const isChosen = selectedChoice === idx;
                  const isCorrectOpt = idx === quiz.correctIndex;
                  let styleClass = isDark
                    ? 'bg-slate-900/75 border-white/10 hover:border-sky-400/60 text-slate-200'
                    : 'bg-slate-50 border-slate-200 hover:border-sky-400 text-slate-800';

                  if (quizAnswered) {
                    if (isCorrectOpt) {
                      styleClass = isDark
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                        : 'bg-emerald-50 border-emerald-500 text-emerald-900';
                    } else if (isChosen) {
                      styleClass = isDark
                        ? 'bg-rose-500/20 border-rose-400 text-rose-200'
                        : 'bg-rose-50 border-rose-400 text-rose-900';
                    } else {
                      styleClass = isDark
                        ? 'bg-slate-900/40 border-white/5 text-slate-500'
                        : 'bg-slate-50/50 border-slate-200/60 text-slate-400';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={quizAnswered}
                      onClick={() => handleAnswerQuiz(idx)}
                      className={`w-full text-left px-3 py-2 rounded-xl border text-xs font-medium flex items-center justify-between gap-2 transition-all ${styleClass}`}
                    >
                      <span>{opt}</span>
                      {quizAnswered && isCorrectOpt && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      )}
                      {quizAnswered && isChosen && !isCorrectOpt && (
                        <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
              {quizAnswered && (
                <p
                  className={`mt-2 text-xs font-medium ${
                    quizCorrect
                      ? isDark
                        ? 'text-emerald-300'
                        : 'text-emerald-700'
                      : isDark
                      ? 'text-amber-300'
                      : 'text-amber-800'
                  }`}
                >
                  {quizCorrect ? '🎉 ถูกต้อง! ' : '💡 เฉลย: '}
                  {quiz.fact}
                </p>
              )}
            </div>
          )}

          {/* Collection Progress Strip */}
          <div
            className={`rounded-xl border px-3.5 py-2 mb-4 flex items-center justify-between gap-3 ${
              isDark
                ? 'bg-amber-400/10 border-amber-400/25 text-amber-200'
                : 'bg-amber-50 border-amber-300/80 text-amber-900'
            }`}
          >
            <span className="text-xs font-semibold flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-500" />
              ปลดล็อกแล้ว {completedCount} / {CATEGORIES.length} Kaizen Awards
            </span>
            <div className={`w-28 h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-900' : 'bg-amber-200'}`}>
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-500"
                style={{ width: `${(completedCount / CATEGORIES.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                sound.playButton();
                onNextRandom();
              }}
              className="cta-button-glow w-full sm:flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-slate-950 font-display font-extrabold text-base flex items-center justify-center gap-2"
            >
              <Dices className="w-5 h-5" />
              <span>สุ่มหมวดถัดไป!</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playStart();
                onReplay();
              }}
              className={`w-full sm:w-auto py-3.5 px-4 rounded-2xl border text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                isDark
                  ? 'bg-white/10 hover:bg-white/15 border-white/15 text-white'
                  : 'bg-slate-100 hover:bg-slate-200/80 border-slate-300 text-slate-800'
              }`}
            >
              <RotateCcw className="w-4 h-4 text-sky-500" />
              <span>เล่นหมวดนี้อีกครั้ง</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playButton();
                onOpenCollection();
              }}
              className={`w-full sm:w-auto py-3.5 px-4 rounded-2xl border text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                isDark
                  ? 'bg-white/10 hover:bg-white/15 border-white/15 text-amber-200'
                  : 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-800'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>ดูคอลเลกชันทั้งหมด</span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

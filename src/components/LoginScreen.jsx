import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Rocket,
  User,
  Building2,
  IdCard,
  Sparkles,
  Volume2,
  VolumeX,
  Cog,
  Trophy,
  Puzzle,
  Medal,
  QrCode,
  Music,
} from 'lucide-react';
import { CATEGORIES } from '../data/categories.js';
import { sound } from '../utils/sound.js';
import ThemeToggle from './ThemeToggle.jsx';

export default function LoginScreen({
  theme,
  onToggleTheme,
  muted,
  bgmEnabled,
  onToggleMute,
  onToggleBgm,
  leaderboardCount = 0,
  onOpenLeaderboard,
  onOpenQr,
  initialProfile,
  onLogin,
}) {
  const isDark = theme === 'dark';
  const [employeeId, setEmployeeId] = useState(initialProfile?.employeeId || '');
  const [department, setDepartment] = useState(initialProfile?.department || '');
  const [name, setName] = useState(initialProfile?.name || '');
  const [errors, setErrors] = useState({ employeeId: '', department: '', name: '' });

  const empIdRef = useRef(null);
  const deptRef = useRef(null);
  const nameRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedEmpId = employeeId.trim();
    const trimmedDept = department.trim();
    const trimmedName = name.trim();

    const nextErrors = {
      employeeId: trimmedEmpId ? '' : 'กรุณากรอกรหัสพนักงาน',
      department: trimmedDept ? '' : 'กรุณากรอกชื่อฝ่าย / หน่วยงาน',
      name: trimmedName ? '' : 'กรุณากรอกชื่อ - นามสกุล',
    };

    if (nextErrors.employeeId || nextErrors.department || nextErrors.name) {
      setErrors(nextErrors);
      sound.playQuizWrong();
      if (nextErrors.employeeId) empIdRef.current?.focus();
      else if (nextErrors.department) deptRef.current?.focus();
      else if (nextErrors.name) nameRef.current?.focus();
      return;
    }

    setErrors({ employeeId: '', department: '', name: '' });
    sound.playStart();
    onLogin({
      employeeId: trimmedEmpId.slice(0, 24),
      department: trimmedDept.slice(0, 32),
      name: trimmedName.slice(0, 32),
    });
  };

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden arcade-grid-bg flex flex-col justify-between transition-colors duration-300">
      {/* Ambient Drifting Aurora & Stage Accents (GPU-friendly for mobile) */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className={`absolute -top-32 -left-24 w-[420px] h-[420px] rounded-full blur-[110px] animate-aurora-drift ${
            isDark ? 'bg-sky-500/25' : 'bg-sky-400/28'
          }`}
        />
        <div
          className={`absolute top-1/4 -right-28 w-[440px] h-[440px] rounded-full blur-[120px] animate-aurora-drift ${
            isDark ? 'bg-fuchsia-600/22' : 'bg-amber-300/35'
          }`}
          style={{ animationDelay: '-5s' }}
        />
        <div
          className={`absolute -bottom-32 left-1/3 w-[380px] h-[380px] rounded-full blur-[110px] animate-pulse-glow ${
            isDark ? 'bg-amber-500/18' : 'bg-violet-400/20'
          }`}
        />
        <Cog
          className={`absolute top-14 left-6 w-28 h-28 animate-spin-slow hidden md:block ${
            isDark ? 'text-sky-400/12' : 'text-sky-500/15'
          }`}
        />
        <Cog
          className={`absolute bottom-14 right-8 w-36 h-36 animate-spin-slower hidden md:block ${
            isDark ? 'text-amber-400/12' : 'text-amber-500/15'
          }`}
        />
      </div>

      {/* Top Mini Controls */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-4 pt-4 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel text-xs font-bold">
          <Puzzle className="w-3.5 h-3.5 text-amber-400" />
          <span className={isDark ? 'text-amber-200' : 'text-amber-700'}>KAIZEN AWARD • 4×4 CHALLENGE</span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          {onOpenLeaderboard && (
            <button
              type="button"
              onClick={() => {
                sound.playButton();
                onOpenLeaderboard();
              }}
              className={`glass-panel transition-all px-2.5 py-2 rounded-xl flex items-center gap-1.5 text-xs font-bold whitespace-nowrap ${
                isDark
                  ? 'hover:bg-white/15 text-sky-200 border-sky-400/35'
                  : 'hover:bg-white text-sky-700 border-sky-300/80'
              }`}
              title="กระดานอันดับ Hall of Fame"
            >
              <Medal className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="hidden sm:inline">อันดับ</span>
              {leaderboardCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-sky-500/25 text-sky-300">
                  {leaderboardCount}
                </span>
              )}
            </button>
          )}
          {onOpenQr && (
            <button
              type="button"
              onClick={() => {
                sound.playButton();
                onOpenQr();
              }}
              className={`glass-panel transition-all p-2.5 rounded-xl hidden sm:flex items-center justify-center ${
                isDark ? 'hover:bg-white/15 text-slate-200' : 'hover:bg-white text-slate-700'
              }`}
              title="แสดง QR Code สำหรับเล่นบนมือถือหน้าบูธ"
              aria-label="QR Code"
            >
              <QrCode className="w-4 h-4 text-violet-400" />
            </button>
          )}
          {onToggleBgm && (
            <button
              type="button"
              onClick={onToggleBgm}
              aria-label={bgmEnabled ? 'ปิดเพลงประกอบ' : 'เปิดเพลงประกอบ'}
              className={`glass-panel transition-all p-2.5 rounded-xl hidden sm:flex items-center justify-center ${
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
          )}
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? 'เปิดเสียง' : 'ปิดเสียง'}
            className={`glass-panel p-2.5 rounded-xl transition-all ${
              isDark ? 'hover:bg-white/15 text-slate-200' : 'hover:bg-white text-slate-700'
            }`}
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-emerald-500" />}
          </button>
        </div>
      </header>

      {/* Main Center Login Showcase Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 240, damping: 22 }}
          className="w-full max-w-md"
        >
          {/* Neon / Metallic Gradient Outer Frame */}
          <div
            className={`rounded-[30px] p-[2.5px] ${
              isDark
                ? 'bg-gradient-to-br from-sky-400 via-amber-400 to-fuchsia-500 shadow-[0_0_65px_-12px_rgba(56,189,248,0.55),0_24px_60px_-20px_rgba(0,0,0,0.9)]'
                : 'bg-gradient-to-br from-amber-400 via-orange-400 to-sky-500 shadow-[0_24px_60px_-16px_rgba(37,99,235,0.28)]'
            }`}
          >
            <div
              className={`rounded-[27.5px] p-6 sm:p-8 transition-colors duration-300 ${
                isDark
                  ? 'bg-gradient-to-b from-[#111A42]/95 via-[#0B112E]/98 to-[#070B1E]/98'
                  : 'bg-gradient-to-b from-white via-[#F9FBFF] to-[#FFF9EE]'
              }`}
            >
              {/* Emblem & Hero Heading */}
              <div className="flex flex-col items-center text-center mb-5">
                <motion.div
                  initial={{ scale: 0.7, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                  className="relative mb-3"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 p-[2.5px] shadow-[0_12px_30px_-6px_rgba(245,158,11,0.65)]">
                    <div
                      className={`w-full h-full rounded-[21px] flex items-center justify-center text-4xl sm:text-5xl ${
                        isDark ? 'bg-[#0B112B]' : 'bg-white'
                      }`}
                    >
                      🏆
                    </div>
                  </div>
                  <span className="absolute -top-1.5 -right-1.5 w-7 h-7 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 text-white flex items-center justify-center shadow-lg border-2 border-white/80">
                    <Sparkles className="w-3.5 h-3.5" />
                  </span>
                </motion.div>

                <h1
                  className={`font-display font-extrabold text-2xl sm:text-3xl tracking-tight leading-tight ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  ภารกิจ{' '}
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
                <p className={`mt-1 text-xs sm:text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  กรอกข้อมูลให้ครบทั้ง 3 ช่อง เพื่อสุ่มภารกิจต่อจิ๊กซอร์ 4×4 แล้วเล่นได้เลย!
                </p>

                {/* 7-Category Mini Icon Strip */}
                <div className="flex items-center justify-center gap-1.5 mt-3.5">
                  {CATEGORIES.map((cat) => (
                    <span
                      key={cat.id}
                      title={cat.title}
                      style={{ borderColor: `${cat.accent}66` }}
                      className={`w-8 h-8 rounded-xl border flex items-center justify-center text-base shadow-sm ${
                        isDark ? 'bg-slate-900/80' : 'bg-white'
                      }`}
                    >
                      {cat.icon}
                    </span>
                  ))}
                </div>
              </div>

              {/* 3-Field Login Form (All Required) */}
              <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
                {/* 1. รหัสพนักงาน (REQUIRED) */}
                <div>
                  <label
                    htmlFor="kaizen-emp-id"
                    className={`flex items-center justify-between text-xs font-semibold mb-1.5 ${
                      isDark ? 'text-slate-200' : 'text-slate-700'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <IdCard className="w-3.5 h-3.5 text-sky-400" />
                      1. รหัสพนักงาน
                      <span className="text-rose-500 font-extrabold">*</span>
                    </span>
                    <span className="text-[10px] font-bold text-amber-400">จำเป็นต้องกรอก</span>
                  </label>
                  <input
                    ref={empIdRef}
                    id="kaizen-emp-id"
                    type="text"
                    required
                    aria-required="true"
                    value={employeeId}
                    onChange={(e) => {
                      setEmployeeId(e.target.value);
                      if (errors.employeeId) setErrors((prev) => ({ ...prev, employeeId: '' }));
                    }}
                    placeholder="เช่น S0001"
                    maxLength={24}
                    autoComplete="off"
                    className={`w-full px-3.5 py-2.5 rounded-2xl text-sm font-medium border outline-none transition-all ${
                      errors.employeeId
                        ? isDark
                          ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-500/10 text-white placeholder:text-rose-300/60'
                          : 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50 text-slate-900 placeholder:text-rose-400'
                        : isDark
                        ? 'bg-slate-900/85 border-sky-400/35 text-white placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/25'
                        : 'bg-slate-50 border-slate-300/90 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                    }`}
                  />
                  {errors.employeeId && <p className="mt-1 text-xs font-semibold text-rose-400">{errors.employeeId}</p>}
                </div>

                {/* 2. ชื่อฝ่าย / หน่วยงาน (REQUIRED) */}
                <div>
                  <label
                    htmlFor="kaizen-dept"
                    className={`flex items-center justify-between text-xs font-semibold mb-1.5 ${
                      isDark ? 'text-slate-200' : 'text-slate-700'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-violet-400" />
                      2. ชื่อฝ่าย / หน่วยงาน
                      <span className="text-rose-500 font-extrabold">*</span>
                    </span>
                    <span className="text-[10px] font-bold text-amber-400">จำเป็นต้องกรอก</span>
                  </label>
                  <input
                    ref={deptRef}
                    id="kaizen-dept"
                    type="text"
                    required
                    aria-required="true"
                    value={department}
                    onChange={(e) => {
                      setDepartment(e.target.value);
                      if (errors.department) setErrors((prev) => ({ ...prev, department: '' }));
                    }}
                    placeholder="เช่น MNF / HSM / GIT / QMS"
                    maxLength={32}
                    autoComplete="organization"
                    className={`w-full px-3.5 py-2.5 rounded-2xl text-sm font-medium border outline-none transition-all ${
                      errors.department
                        ? isDark
                          ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-500/10 text-white placeholder:text-rose-300/60'
                          : 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50 text-slate-900 placeholder:text-rose-400'
                        : isDark
                        ? 'bg-slate-900/85 border-violet-400/35 text-white placeholder:text-slate-500 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/25'
                        : 'bg-slate-50 border-slate-300/90 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20'
                    }`}
                  />
                  {errors.department && <p className="mt-1 text-xs font-semibold text-rose-400">{errors.department}</p>}
                </div>

                {/* 3. ชื่อผู้เล่น / User (REQUIRED) */}
                <div>
                  <label
                    htmlFor="kaizen-username"
                    className={`flex items-center justify-between text-xs font-semibold mb-1.5 ${
                      isDark ? 'text-slate-200' : 'text-slate-700'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-amber-400" />
                      3. ชื่อ - นามสกุล (User)
                      <span className="text-rose-500 font-extrabold">*</span>
                    </span>
                    <span className="text-[10px] font-bold text-amber-400">จำเป็นต้องกรอก</span>
                  </label>
                  <input
                    ref={nameRef}
                    id="kaizen-username"
                    type="text"
                    required
                    aria-required="true"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                    }}
                    placeholder="กรอกชื่อ - นามสกุลของคุณ..."
                    maxLength={32}
                    autoComplete="name"
                    className={`w-full px-3.5 py-2.5 rounded-2xl text-sm font-medium border outline-none transition-all ${
                      errors.name
                        ? isDark
                          ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-500/10 text-white placeholder:text-rose-300/60'
                          : 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50 text-slate-900 placeholder:text-rose-400'
                        : isDark
                        ? 'bg-slate-900/85 border-amber-400/40 text-white placeholder:text-slate-500 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/25'
                        : 'bg-amber-50/40 border-amber-400/70 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25'
                    }`}
                  />
                  {errors.name && <p className="mt-1 text-xs font-semibold text-rose-400">{errors.name}</p>}
                </div>

                {/* Primary Tactile CTA */}
                <button
                  type="submit"
                  className="cta-button-glow relative overflow-hidden group w-full mt-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-slate-950 font-display font-extrabold text-base sm:text-lg tracking-wide flex items-center justify-center gap-2.5"
                >
                  <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
                    <span className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/55 to-transparent animate-shimmer" />
                  </span>
                  <Rocket className="w-5 h-5 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  <span>เข้าสู่เกมและสุ่มภารกิจ!</span>
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Subtle Footer */}
      <footer className="relative z-10 text-center pb-4 px-4">
        <p className={`text-[11px] flex items-center justify-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          <span>สุ่มภารกิจ 4×4 (16 ชิ้น) • เก็บคะแนนขึ้นทำเนียบ Hall of Fame</span>
        </p>
      </footer>
    </div>
  );
}

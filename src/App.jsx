import React, { useState, useCallback, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  loadProgress,
  saveProgress,
  clearProgress,
  loadLeaderboard,
  clearLeaderboard,
  calculateStars,
} from './data/categories.js';
import {
  fetchLeaderboard,
  submitLeaderboardScore,
  logAnonymousPlay,
  subscribeLeaderboard,
  isSupabaseEnabled,
} from './utils/supabase.js';
import { sound } from './utils/sound.js';
import LoginScreen from './components/LoginScreen.jsx';
import LobbyScreen from './components/LobbyScreen.jsx';
import MissionModal from './components/MissionModal.jsx';
import PuzzleArena from './components/PuzzleArena.jsx';
import VictoryModal from './components/VictoryModal.jsx';
import CollectionModal from './components/CollectionModal.jsx';
import LeaderboardModal from './components/LeaderboardModal.jsx';
import QrShareModal from './components/QrShareModal.jsx';

const THEME_STORAGE_KEY = 'kaizen_award_theme_v2';
const PROFILE_STORAGE_KEY = 'kaizen_award_player_profile_v1';
const FIXED_GRID_SIZE = 4; // 4x4 (16 pieces) only

function loadInitialTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // ignore
  }
  return 'light';
}

function loadPlayerProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        employeeId: parsed.employeeId || '',
        department: parsed.department || '',
        name: parsed.name || '',
      };
    }
  } catch {
    // ignore
  }
  return { employeeId: '', department: '', name: '' };
}

function detectTvMode() {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('tv') === '1' || params.get('mode') === 'tv';
}

export default function App() {
  const isTvMode = detectTvMode();
  // Always open on the Login Screen first (Booth TV ?tv=1 auto-opens Live Leaderboard!)
  const [screen, setScreen] = useState('login'); // 'login' | 'lobby' | 'puzzle'
  const [theme, setTheme] = useState(loadInitialTheme);
  const [progress, setProgress] = useState(() => loadProgress());
  const [leaderboard, setLeaderboard] = useState(() => loadLeaderboard());
  const [leaderboardSource, setLeaderboardSource] = useState(isSupabaseEnabled ? 'supabase' : 'local');
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [playerProfile, setPlayerProfile] = useState(loadPlayerProfile);
  const [muted, setMuted] = useState(() => sound.isMuted());
  const [bgmEnabled, setBgmEnabled] = useState(() => sound.isBgmEnabled());

  const [sessionHistory, setSessionHistory] = useState([]);
  const [lastDrawnId, setLastDrawnId] = useState(null);
  const [autoSpinToken, setAutoSpinToken] = useState(0);

  const [drawnCategory, setDrawnCategory] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [gameKey, setGameKey] = useState(1);
  const [victoryData, setVictoryData] = useState(null);
  const [collectionState, setCollectionState] = useState({ open: false, focusId: null });
  const [showLeaderboard, setShowLeaderboard] = useState(isTvMode);
  const [showQr, setShowQr] = useState(false);

  // Sync theme class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', theme === 'dark' ? '#070B1E' : '#F8FBFF');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const refreshLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    try {
      const res = await fetchLeaderboard();
      setLeaderboard(res.entries);
      setLeaderboardSource(res.source);
    } finally {
      setLeaderboardLoading(false);
    }
  }, []);

  // Load initial leaderboard count once on mount
  useEffect(() => {
    refreshLeaderboard();
  }, [refreshLeaderboard]);

  // TV-Only Realtime: WebSocket connects ONLY in Booth TV mode (?tv=1), while mobile players fetch fresh HTTP on open/refresh (0 WebSocket slots used -> handles 1,000+ concurrent players on Supabase Free!)
  useEffect(() => {
    if (!showLeaderboard) return undefined;
    refreshLeaderboard();
    if (!isTvMode) return undefined;

    const unsubscribe = subscribeLeaderboard((newEntry) => {
      setLeaderboard((prev) => {
        if (prev.some((item) => item.id === newEntry.id)) return prev;
        return [...prev, newEntry]
          .sort((a, b) => {
            if (b.gridSize !== a.gridSize) return b.gridSize - a.gridSize;
            if (a.elapsedSeconds !== b.elapsedSeconds) return a.elapsedSeconds - b.elapsedSeconds;
            return a.hintsUsed - b.hintsUsed;
          })
          .slice(0, 100);
      });
    });
    return unsubscribe;
  }, [showLeaderboard, isTvMode, refreshLeaderboard]);

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const handleLogin = useCallback((profile) => {
    setPlayerProfile(profile);
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // ignore
    }
    setDrawnCategory(null);
    setVictoryData(null);
    setScreen('lobby');
    setAutoSpinToken((t) => t + 1);
  }, []);

  const handleLogout = useCallback(() => {
    setDrawnCategory(null);
    setVictoryData(null);
    setActiveCategory(null);
    setScreen('login');
  }, []);

  const handleFinishSession = useCallback(() => {
    setDrawnCategory(null);
    setVictoryData(null);
    setActiveCategory(null);
    setPlayerProfile({ employeeId: '', department: '', name: '' });
    try {
      localStorage.removeItem(PROFILE_STORAGE_KEY);
    } catch {
      // ignore
    }
    setScreen('login');
  }, []);

  const handleToggleMute = useCallback(() => {
    const nextMuted = sound.toggleMute();
    setMuted(nextMuted);
    setBgmEnabled(sound.isBgmEnabled());
  }, []);

  const handleToggleBgm = useCallback(() => {
    const nextBgm = sound.toggleBgm();
    setBgmEnabled(nextBgm);
    setMuted(sound.isMuted());
  }, []);

  const handleSpinComplete = useCallback((category) => {
    setDrawnCategory(category);
    setLastDrawnId(category.id);
    setSessionHistory((prev) => (prev.includes(category.id) ? prev : [...prev, category.id]));
  }, []);

  const handleStartPuzzle = useCallback((category) => {
    setDrawnCategory(null);
    setVictoryData(null);
    setCollectionState({ open: false, focusId: null });
    setActiveCategory(category);
    setGameKey((k) => k + 1);
    setScreen('puzzle');
  }, []);

  const handlePuzzleComplete = useCallback(
    ({ elapsedSeconds, hintsUsed, maxCombo }) => {
      if (!activeCategory) return;
      const stars = calculateStars(elapsedSeconds, hintsUsed, FIXED_GRID_SIZE);
      const prevRecord = progress[activeCategory.id];
      const isNewBest =
        !prevRecord?.completed ||
        elapsedSeconds < (prevRecord.bestTime ?? Infinity) ||
        stars > (prevRecord.bestStars ?? 0);

      const nextProgress = {
        ...progress,
        [activeCategory.id]: {
          completed: true,
          bestTime:
            prevRecord?.bestTime != null
              ? Math.min(prevRecord.bestTime, elapsedSeconds)
              : elapsedSeconds,
          bestStars: Math.max(prevRecord?.bestStars || 0, stars),
          plays: (prevRecord?.plays || 0) + 1,
          lastPlayedAt: Date.now(),
        },
      };

      setProgress(nextProgress);
      saveProgress(nextProgress);

      logAnonymousPlay({
        categoryId: activeCategory.id,
        gridSize: FIXED_GRID_SIZE,
        elapsedSeconds,
        hintsUsed,
        maxCombo,
        stars,
      });

      setVictoryData({
        category: activeCategory,
        gridSize: FIXED_GRID_SIZE,
        stats: { elapsedSeconds, hintsUsed, maxCombo, stars },
        isNewBest,
        saveStatus: 'saving',
      });

      // Auto-save player's score immediately to Hall of Fame using required login profile
      const emp = (playerProfile?.employeeId || '').trim();
      const dept = (playerProfile?.department || '').trim();
      const formattedDept = emp && dept ? `[${emp}] ${dept}` : dept || emp || '';

      submitLeaderboardScore({
        name: (playerProfile?.name || 'ผู้ท้าชิง Kaizen').trim(),
        department: formattedDept,
        categoryId: activeCategory.id,
        gridSize: FIXED_GRID_SIZE,
        elapsedSeconds,
        hintsUsed,
        maxCombo,
        stars,
        quizBonus: false,
      })
        .then((res) => {
          setLeaderboard(res.entries);
          setLeaderboardSource(res.source);
          setVictoryData((prev) => (prev ? { ...prev, saveStatus: 'saved' } : prev));
        })
        .catch(() => {
          setVictoryData((prev) => (prev ? { ...prev, saveStatus: 'saved' } : prev));
        });
    },
    [activeCategory, progress, playerProfile]
  );

  const handleClearLeaderboard = useCallback(() => {
    clearLeaderboard();
    setLeaderboard([]);
  }, []);

  const handleOpenCollection = useCallback((focusId = null) => {
    setVictoryData(null);
    setCollectionState({ open: true, focusId });
  }, []);

  const handleResetProgress = useCallback(() => {
    clearProgress();
    setProgress({});
    setSessionHistory([]);
    setLastDrawnId(null);
  }, []);

  return (
    <>
      {screen === 'login' && (
        <LoginScreen
          theme={theme}
          onToggleTheme={handleToggleTheme}
          muted={muted}
          bgmEnabled={bgmEnabled}
          onToggleMute={handleToggleMute}
          onToggleBgm={handleToggleBgm}
          leaderboardCount={leaderboard.length}
          onOpenLeaderboard={() => setShowLeaderboard(true)}
          onOpenQr={() => setShowQr(true)}
          initialProfile={playerProfile}
          onLogin={handleLogin}
        />
      )}

      {screen === 'lobby' && (
        <LobbyScreen
          theme={theme}
          onToggleTheme={handleToggleTheme}
          gridSize={FIXED_GRID_SIZE}
          playerProfile={playerProfile}
          onLogout={handleLogout}
          progress={progress}
          leaderboardCount={leaderboard.length}
          sessionHistory={sessionHistory}
          lastDrawnId={lastDrawnId}
          muted={muted}
          bgmEnabled={bgmEnabled}
          onToggleMute={handleToggleMute}
          onToggleBgm={handleToggleBgm}
          onSpinComplete={handleSpinComplete}
          onOpenCollection={handleOpenCollection}
          onOpenLeaderboard={() => setShowLeaderboard(true)}
          onOpenQr={() => setShowQr(true)}
          autoSpinToken={autoSpinToken}
        />
      )}

      {screen === 'puzzle' && activeCategory && (
        <PuzzleArena
          theme={theme}
          onToggleTheme={handleToggleTheme}
          category={activeCategory}
          gridSize={FIXED_GRID_SIZE}
          gameKey={gameKey}
          muted={muted}
          bgmEnabled={bgmEnabled}
          onToggleMute={handleToggleMute}
          onToggleBgm={handleToggleBgm}
          onBack={handleFinishSession}
          onComplete={handlePuzzleComplete}
        />
      )}

      {/* Mission Reveal Overlay (Single-Play — Press Play Once) */}
      <AnimatePresence>
        {drawnCategory && (
          <MissionModal
            theme={theme}
            category={drawnCategory}
            gridSize={FIXED_GRID_SIZE}
            onStartPuzzle={handleStartPuzzle}
          />
        )}
      </AnimatePresence>

      {/* Victory & Kaizen Award Celebration Modal (One-Shot Finish) */}
      <AnimatePresence>
        {victoryData && (
          <VictoryModal
            theme={theme}
            category={victoryData.category}
            gridSize={FIXED_GRID_SIZE}
            stats={victoryData.stats}
            isNewBest={victoryData.isNewBest}
            saveStatus={victoryData.saveStatus}
            playerProfile={playerProfile}
            onOpenLeaderboard={() => setShowLeaderboard(true)}
            onFinish={handleFinishSession}
          />
        )}
      </AnimatePresence>

      {/* Collection Gallery Modal (View Only) */}
      <AnimatePresence>
        {collectionState.open && (
          <CollectionModal
            theme={theme}
            gridSize={FIXED_GRID_SIZE}
            progress={progress}
            playerProfile={playerProfile}
            initialFocusId={collectionState.focusId}
            onResetProgress={handleResetProgress}
            onClose={() => setCollectionState({ open: false, focusId: null })}
          />
        )}
      </AnimatePresence>

      {/* Hall of Fame Leaderboard Modal */}
      <AnimatePresence>
        {showLeaderboard && (
          <LeaderboardModal
            theme={theme}
            entries={leaderboard}
            source={leaderboardSource}
            liveRealtime={isTvMode}
            loading={leaderboardLoading}
            onRefresh={refreshLeaderboard}
            onClearLeaderboard={handleClearLeaderboard}
            onClose={() => setShowLeaderboard(false)}
          />
        )}
      </AnimatePresence>

      {/* Event Booth Mobile QR Code Modal */}
      <AnimatePresence>
        {showQr && <QrShareModal theme={theme} onClose={() => setShowQr(false)} />}
      </AnimatePresence>
    </>
  );
}

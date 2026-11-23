import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  CATEGORIES,
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
import LobbyScreen from './components/LobbyScreen.jsx';
import MissionModal from './components/MissionModal.jsx';
import PuzzleArena from './components/PuzzleArena.jsx';
import VictoryModal from './components/VictoryModal.jsx';
import CollectionModal from './components/CollectionModal.jsx';
import LeaderboardModal from './components/LeaderboardModal.jsx';
import QrShareModal from './components/QrShareModal.jsx';

const THEME_STORAGE_KEY = 'kaizen_award_theme_v1';
const PROFILE_STORAGE_KEY = 'kaizen_award_player_profile_v1';

function loadInitialTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // ignore
  }
  return 'dark';
}

function loadPlayerProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return { name: '', department: '' };
}

export default function App() {
  const [screen, setScreen] = useState('lobby'); // 'lobby' | 'puzzle'
  const [theme, setTheme] = useState(loadInitialTheme);
  const [gridSize, setGridSize] = useState(5); // 3 | 4 | 5
  const [progress, setProgress] = useState(() => loadProgress());
  const [leaderboard, setLeaderboard] = useState(() => loadLeaderboard());
  const [leaderboardSource, setLeaderboardSource] = useState(isSupabaseEnabled ? 'supabase' : 'local');
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [playerProfile, setPlayerProfile] = useState(loadPlayerProfile);
  const [muted, setMuted] = useState(() => sound.isMuted());
  const [bgmEnabled, setBgmEnabled] = useState(() => sound.isBgmEnabled());

  // Fetch online Supabase leaderboard & subscribe to live Realtime updates
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

  useEffect(() => {
    refreshLeaderboard();
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
  }, [refreshLeaderboard]);

  // Sync theme class on <html> and browser theme-color
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

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // Session smart-random tracking
  const [sessionHistory, setSessionHistory] = useState([]);
  const [lastDrawnId, setLastDrawnId] = useState(null);
  const [autoSpinToken, setAutoSpinToken] = useState(0);

  // Active modals & gameplay state
  const [drawnCategory, setDrawnCategory] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [gameKey, setGameKey] = useState(1);
  const [victoryData, setVictoryData] = useState(null);
  const [collectionState, setCollectionState] = useState({ open: false, focusId: null });
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const completedCount = useMemo(
    () => CATEGORIES.filter((c) => progress[c.id]?.completed).length,
    [progress]
  );

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

  const handleRespinFromMission = useCallback(() => {
    setDrawnCategory(null);
    setAutoSpinToken((t) => t + 1);
  }, []);

  const handlePuzzleComplete = useCallback(
    ({ elapsedSeconds, hintsUsed, maxCombo }) => {
      if (!activeCategory) return;
      const stars = calculateStars(elapsedSeconds, hintsUsed, gridSize);
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

      // Silently record anonymous booth analytics to Supabase (non-blocking)
      logAnonymousPlay({
        categoryId: activeCategory.id,
        gridSize,
        elapsedSeconds,
        hintsUsed,
        maxCombo,
        stars,
      });

      setVictoryData({
        category: activeCategory,
        gridSize,
        stats: { elapsedSeconds, hintsUsed, maxCombo, stars },
        isNewBest,
      });
    },
    [activeCategory, gridSize, progress]
  );

  const handleSaveScore = useCallback(async (entry) => {
    const nextProfile = { name: entry.name, department: entry.department };
    setPlayerProfile(nextProfile);
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(nextProfile));
    } catch {
      // ignore
    }

    const res = await submitLeaderboardScore(entry);
    setLeaderboard(res.entries);
    setLeaderboardSource(res.source);
  }, []);

  const handleClearLeaderboard = useCallback(() => {
    clearLeaderboard();
    setLeaderboard([]);
  }, []);

  const handleNextRandomFromVictory = useCallback(() => {
    setVictoryData(null);
    setScreen('lobby');
    setAutoSpinToken((t) => t + 1);
  }, []);

  const handleReplayCurrent = useCallback(() => {
    setVictoryData(null);
    setGameKey((k) => k + 1);
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
      {screen === 'lobby' && (
        <LobbyScreen
          theme={theme}
          onToggleTheme={handleToggleTheme}
          gridSize={gridSize}
          onChangeGridSize={setGridSize}
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
          gridSize={gridSize}
          gameKey={gameKey}
          muted={muted}
          bgmEnabled={bgmEnabled}
          onToggleMute={handleToggleMute}
          onToggleBgm={handleToggleBgm}
          onBack={() => {
            setVictoryData(null);
            setScreen('lobby');
          }}
          onComplete={handlePuzzleComplete}
        />
      )}

      {/* Mission Reveal Overlay */}
      <AnimatePresence>
        {drawnCategory && (
          <MissionModal
            theme={theme}
            category={drawnCategory}
            gridSize={gridSize}
            onChangeGridSize={setGridSize}
            onStartPuzzle={handleStartPuzzle}
            onRespin={handleRespinFromMission}
            onClose={() => setDrawnCategory(null)}
          />
        )}
      </AnimatePresence>

      {/* Victory & Kaizen Award Celebration Modal */}
      <AnimatePresence>
        {victoryData && (
          <VictoryModal
            theme={theme}
            category={victoryData.category}
            gridSize={victoryData.gridSize}
            stats={victoryData.stats}
            isNewBest={victoryData.isNewBest}
            completedCount={completedCount}
            playerProfile={playerProfile}
            onSaveScore={handleSaveScore}
            onNextRandom={handleNextRandomFromVictory}
            onReplay={handleReplayCurrent}
            onOpenCollection={() => {
              setVictoryData(null);
              setScreen('lobby');
              setCollectionState({ open: true, focusId: victoryData.category.id });
            }}
          />
        )}
      </AnimatePresence>

      {/* Collection Gallery & Direct-Select Modal */}
      <AnimatePresence>
        {collectionState.open && (
          <CollectionModal
            theme={theme}
            gridSize={gridSize}
            progress={progress}
            playerProfile={playerProfile}
            initialFocusId={collectionState.focusId}
            onSelectCategory={handleStartPuzzle}
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

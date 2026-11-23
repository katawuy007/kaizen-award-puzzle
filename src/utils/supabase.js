import { createClient } from '@supabase/supabase-js';
import {
  CATEGORIES,
  formatTime,
  loadLeaderboard,
  addLeaderboardEntry,
} from '../data/categories.js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.trim() || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || '';

export const isSupabaseEnabled = Boolean(
  SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes('YOUR_PROJECT_ID') &&
    !SUPABASE_ANON_KEY.includes('YOUR_SUPABASE_ANON')
);

export const supabase = isSupabaseEnabled
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    })
  : null;

function mapRowToEntry(row) {
  return {
    id: row.id,
    name: row.player_name,
    department: row.department || '',
    categoryId: row.category_id,
    gridSize: Number(row.grid_size) || 5,
    elapsedSeconds: Number(row.elapsed_seconds) || 0,
    hintsUsed: Number(row.hints_used) || 0,
    maxCombo: Number(row.max_combo) || 1,
    stars: Number(row.stars) || 1,
    quizBonus: Boolean(row.quiz_bonus),
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
  };
}

/**
 * Loads top 100 leaderboard entries from Supabase (falls back gracefully to localStorage).
 */
export async function fetchLeaderboard() {
  if (!supabase) {
    return { entries: loadLeaderboard(), source: 'local' };
  }

  try {
    const { data, error } = await supabase
      .from('kaizen_scores')
      .select('*')
      .order('grid_size', { ascending: false })
      .order('elapsed_seconds', { ascending: true })
      .order('hints_used', { ascending: true })
      .limit(100);

    if (error) throw error;
    return { entries: (data || []).map(mapRowToEntry), source: 'supabase' };
  } catch (err) {
    console.warn('[KaizenAI] Supabase fetch failed, using local fallback:', err?.message || err);
    return { entries: loadLeaderboard(), source: 'local' };
  }
}

/**
 * Submits a player's score to Supabase Hall of Fame (also saves locally as backup).
 */
export async function submitLeaderboardScore(entry) {
  // Always keep a local copy so offline/fallback never loses the player's score
  const localUpdated = addLeaderboardEntry(entry);

  if (!supabase) {
    return { entries: localUpdated, source: 'local', savedOnline: false };
  }

  try {
    const payload = {
      player_name: (entry.name || 'ผู้ท้าชิง Kaizen').trim().slice(0, 40),
      department: (entry.department || '').trim().slice(0, 40),
      category_id: entry.categoryId,
      grid_size: entry.gridSize || 5,
      elapsed_seconds: Math.max(1, Math.round(entry.elapsedSeconds || 1)),
      hints_used: Math.max(0, Math.round(entry.hintsUsed || 0)),
      max_combo: Math.max(1, Math.round(entry.maxCombo || 1)),
      stars: Math.min(3, Math.max(1, Math.round(entry.stars || 1))),
      quiz_bonus: Boolean(entry.quizBonus),
    };

    const { error } = await supabase.from('kaizen_scores').insert(payload);
    if (error) throw error;

    const refreshed = await fetchLeaderboard();
    return { entries: refreshed.entries, source: 'supabase', savedOnline: true };
  } catch (err) {
    console.warn('[KaizenAI] Supabase insert failed, saved locally:', err?.message || err);
    return { entries: localUpdated, source: 'local', savedOnline: false };
  }
}

/**
 * Silently logs an anonymous puzzle completion for event booth analytics (even if player skips entering a name).
 */
export async function logAnonymousPlay({
  categoryId,
  gridSize,
  elapsedSeconds,
  hintsUsed,
  maxCombo,
  stars,
}) {
  if (!supabase) return;
  try {
    await supabase.from('kaizen_play_logs').insert({
      category_id: categoryId,
      grid_size: gridSize || 5,
      elapsed_seconds: Math.max(1, Math.round(elapsedSeconds || 1)),
      hints_used: Math.max(0, Math.round(hintsUsed || 0)),
      max_combo: Math.max(1, Math.round(maxCombo || 1)),
      stars: Math.min(3, Math.max(1, Math.round(stars || 1))),
    });
  } catch {
    // Non-blocking analytics
  }
}

/**
 * Subscribes to live Supabase Realtime INSERTs so booth TVs/phones see new winners immediately!
 */
export function subscribeLeaderboard(onNewEntry) {
  if (!supabase) return () => {};

  const channel = supabase
    .channel('kaizen-scores-live')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'kaizen_scores' },
      (payload) => {
        if (payload?.new) {
          onNewEntry(mapRowToEntry(payload.new));
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Downloads the current leaderboard as a UTF-8 BOM CSV file (opens cleanly with Thai text in Excel).
 */
export function exportLeaderboardCsv(entries) {
  const catMap = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));
  const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;

  const headers = [
    'อันดับ',
    'ชื่อผู้เล่น',
    'แผนก/หน่วยงาน',
    'รหัสหมวด',
    'ชื่อหมวด Kaizen',
    'ขนาดกระดาน',
    'เวลา (นาที:วินาที)',
    'เวลา (วินาที)',
    'จำนวนตัวช่วย',
    'Max Combo',
    'ดาว',
    'โบนัส Quiz',
    'วันเวลาที่บันทึก',
  ];

  const rows = entries.map((item, idx) => {
    const cat = catMap[item.categoryId];
    const dt = item.createdAt ? new Date(item.createdAt).toLocaleString('th-TH') : '';
    return [
      idx + 1,
      item.name,
      item.department || '-',
      cat?.code || item.categoryId,
      cat?.title || '',
      `${item.gridSize}x${item.gridSize}`,
      formatTime(item.elapsedSeconds),
      item.elapsedSeconds,
      item.hintsUsed,
      `x${item.maxCombo}`,
      item.stars,
      item.quizBonus ? 'ใช่' : 'ไม่',
      dt,
    ]
      .map(escapeCsv)
      .join(',');
  });

  // Add UTF-8 BOM (\uFEFF) so Microsoft Excel displays Thai characters cleanly
  const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `kaizen-award-leaderboard-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

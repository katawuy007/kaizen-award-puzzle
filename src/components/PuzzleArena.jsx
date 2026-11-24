import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Image as ImageIcon,
  Puzzle,
  Volume2,
  VolumeX,
  Clock,
  Flame,
  X,
  Music,
} from 'lucide-react';
import { formatTime } from '../data/categories.js';
import { sound } from '../utils/sound.js';
import ThemeToggle from './ThemeToggle.jsx';
import {
  generateTabMap,
  tracePiecePath,
  bakePieceSprites,
  computeArenaLayout,
  computeTraySlots,
  hitTestPiece,
  getBoardTargetCenter,
} from '../utils/jigsaw.js';

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getComboLabel(combo) {
  if (combo === 2) return '🔥 COMBO x2!';
  if (combo === 3) return '⚡ COMBO x3!';
  if (combo === 4) return '💥 COMBO x4!';
  return `🌟 UNSTOPPABLE x${combo}!`;
}

export default function PuzzleArena({
  theme,
  onToggleTheme,
  category,
  gridSize = 5,
  gameKey,
  muted,
  bgmEnabled,
  onToggleMute,
  onToggleBgm,
  onBack,
  onComplete,
}) {
  const isDark = theme === 'dark';
  const totalPieces = gridSize * gridSize;
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [lockedCount, setLockedCount] = useState(0);
  const [activeCombo, setActiveCombo] = useState(0);
  const [showGhost, setShowGhost] = useState(true);
  const [showPeek, setShowPeek] = useState(false);

  const gameRef = useRef({
    theme,
    image: null,
    layout: null,
    dpr: 1,
    pieceDefs: [],
    pieces: [],
    sprites: new Map(),
    dragPieceId: null,
    dragOffsetX: 0,
    dragOffsetY: 0,
    dragIsTouch: false,
    zCounter: 100,
    lastSnapTime: 0,
    combo: 0,
    maxCombo: 0,
    hintsUsed: 0,
    elapsedSeconds: 0,
    completed: false,
    completionFlashStart: null,
    hintPieceId: null,
    hintUntil: 0,
    showGhost: true,
    edgeFilter: false,
    ripples: [],
    particles: [],
    popups: [],
  });

  useEffect(() => {
    gameRef.current.theme = theme;
  }, [theme]);

  useEffect(() => {
    gameRef.current.showGhost = showGhost;
  }, [showGhost]);

  const arrangeTray = useCallback((useEdgeOnly, instant = false) => {
    const g = gameRef.current;
    if (!g.layout || !g.pieces.length) return;
    const allLoose = g.pieces.filter((p) => !p.locked && p.id !== g.dragPieceId);
    const visibleLoose = useEdgeOnly ? allLoose.filter((p) => p.isEdge) : allLoose;
    const slots = computeTraySlots(visibleLoose, g.layout, useEdgeOnly);

    allLoose.forEach((p) => {
      p.inTray = true;
      const slot = slots.get(p.id);
      if (!slot) return;
      if (instant) {
        p.x = slot.x;
        p.y = slot.y;
        p.scale = slot.scale;
        p.targetX = null;
        p.targetY = null;
        p.targetScale = null;
      } else {
        p.targetX = slot.x;
        p.targetY = slot.y;
        p.targetScale = slot.scale;
      }
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsLoaded(false);
    setLoadError(false);
    setElapsedSeconds(0);
    setLockedCount(0);
    setActiveCombo(0);
    setShowGhost(true);
    setShowPeek(false);

    const g = gameRef.current;
    g.image = null;
    g.pieces = [];
    g.sprites = new Map();
    g.dragPieceId = null;
    g.zCounter = 100;
    g.lastSnapTime = 0;
    g.combo = 0;
    g.maxCombo = 0;
    g.hintsUsed = 0;
    g.elapsedSeconds = 0;
    g.completed = false;
    g.completionFlashStart = null;
    g.hintPieceId = null;
    g.hintUntil = 0;
    g.showGhost = true;
    g.edgeFilter = false;
    g.ripples = [];
    g.particles = [];
    g.popups = [];

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) return;
      g.image = img;
      g.gridSize = gridSize;
      g.pieceDefs = generateTabMap(gridSize);
      const shuffledOrders = shuffleArray(Array.from({ length: totalPieces }, (_, i) => i));

      g.pieces = g.pieceDefs.map((def, idx) => ({
        ...def,
        trayOrder: shuffledOrders[idx],
        x: 0,
        y: 0,
        scale: 0.72,
        targetX: null,
        targetY: null,
        targetScale: null,
        locked: false,
        inTray: true,
        z: idx + 1,
      }));

      const el = containerRef.current;
      const canvas = canvasRef.current;
      if (el && canvas) {
        const rect = el.getBoundingClientRect();
        const w = Math.max(300, Math.floor(rect.width));
        const h = Math.max(360, Math.floor(rect.height));
        const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
        g.dpr = dpr;
        g.layout = computeArenaLayout(w, h, gridSize);
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        g.sprites = bakePieceSprites(img, g.pieceDefs, g.layout.cellSize, dpr, gridSize);
        arrangeTray(false, true);
      }

      setIsLoaded(true);
    };
    img.onerror = () => {
      if (!cancelled) setLoadError(true);
    };
    img.src = category.image;

    return () => {
      cancelled = true;
    };
  }, [category, gridSize, totalPieces, gameKey, arrangeTray]);

  useEffect(() => {
    if (!isLoaded) return;
    const interval = setInterval(() => {
      const g = gameRef.current;
      if (g.completed) return;
      g.elapsedSeconds += 1;
      setElapsedSeconds(g.elapsedSeconds);
    }, 1000);
    return () => clearInterval(interval);
  }, [isLoaded]);

  useEffect(() => {
    const el = containerRef.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return;

    const handleResize = () => {
      const g = gameRef.current;
      if (!g.image || !g.pieces.length) return;
      const rect = el.getBoundingClientRect();
      const w = Math.max(300, Math.floor(rect.width));
      const h = Math.max(360, Math.floor(rect.height));
      if (g.layout && g.layout.width === w && g.layout.height === h) return;

      const prevLayout = g.layout;
      const currentGrid = g.gridSize || gridSize;
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const nextLayout = computeArenaLayout(w, h, currentGrid);

      g.dpr = dpr;
      g.layout = nextLayout;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      g.sprites = bakePieceSprites(g.image, g.pieceDefs, nextLayout.cellSize, dpr, currentGrid);

      g.pieces.forEach((p) => {
        if (p.locked) {
          const target = getBoardTargetCenter(p, nextLayout);
          p.x = target.x;
          p.y = target.y;
          p.scale = 1;
          p.targetX = null;
          p.targetY = null;
          p.targetScale = null;
        } else if (!p.inTray && prevLayout) {
          const normX = (p.x - prevLayout.boardX) / prevLayout.boardSize;
          const normY = (p.y - prevLayout.boardY) / prevLayout.boardSize;
          p.x = Math.max(
            nextLayout.cellSize * 0.5,
            Math.min(w - nextLayout.cellSize * 0.5, nextLayout.boardX + normX * nextLayout.boardSize)
          );
          p.y = Math.max(
            nextLayout.cellSize * 0.5,
            Math.min(h - nextLayout.cellSize * 0.5, nextLayout.boardY + normY * nextLayout.boardSize)
          );
          p.scale = 1;
          p.targetX = null;
          p.targetY = null;
          p.targetScale = null;
        }
      });

      const trayPieces = g.pieces.filter(
        (p) => !p.locked && p.inTray && p.id !== g.dragPieceId && (!g.edgeFilter || p.isEdge)
      );
      const slots = computeTraySlots(trayPieces, nextLayout, g.edgeFilter);
      trayPieces.forEach((p) => {
        const slot = slots.get(p.id);
        if (slot) {
          p.x = slot.x;
          p.y = slot.y;
          p.scale = slot.scale;
          p.targetX = null;
          p.targetY = null;
          p.targetScale = null;
        }
      });
    };

    const observer = new ResizeObserver(handleResize);
    observer.observe(el);
    window.addEventListener('resize', handleResize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Main 60FPS Adaptive Dual-Theme Canvas Render Loop
  useEffect(() => {
    let rafId = null;

    const render = (now) => {
      const canvas = canvasRef.current;
      const g = gameRef.current;
      if (canvas && g.layout && g.image) {
        const ctx = canvas.getContext('2d');
        const { layout, dpr } = g;
        const darkMode = g.theme === 'dark';

        ctx.save();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, layout.width, layout.height);

        // 1. Update smooth lerp animations
        for (const p of g.pieces) {
          if (p.targetX !== null) {
            p.x += (p.targetX - p.x) * 0.24;
            if (Math.abs(p.targetX - p.x) < 0.4) {
              p.x = p.targetX;
              p.targetX = null;
            }
          }
          if (p.targetY !== null) {
            p.y += (p.targetY - p.y) * 0.24;
            if (Math.abs(p.targetY - p.y) < 0.4) {
              p.y = p.targetY;
              p.targetY = null;
            }
          }
          if (p.targetScale !== null) {
            p.scale += (p.targetScale - p.scale) * 0.24;
            if (Math.abs(p.targetScale - p.scale) < 0.005) {
              p.scale = p.targetScale;
              p.targetScale = null;
            }
          }
        }

        // 2. Draw Piece Tray Panel (Dual-Theme Studio / Neon)
        ctx.save();
        const rTray = 20;
        ctx.beginPath();
        ctx.roundRect(layout.trayX, layout.trayY, layout.trayW, layout.trayH, rTray);
        if (darkMode) {
          ctx.fillStyle = 'rgba(13, 21, 52, 0.78)';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
          ctx.shadowBlur = 18;
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.84)';
          ctx.shadowColor = 'rgba(30, 58, 138, 0.14)';
          ctx.shadowBlur = 22;
          ctx.shadowOffsetY = 6;
        }
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        ctx.strokeStyle = darkMode ? 'rgba(255, 255, 255, 0.14)' : 'rgba(203, 213, 225, 0.9)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Tray Header Bar
        const remainingCount = g.pieces.filter((p) => !p.locked).length;
        const remainingEdges = g.pieces.filter((p) => !p.locked && p.isEdge).length;
        ctx.fillStyle = darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(241, 245, 249, 0.9)';
        ctx.beginPath();
        ctx.roundRect(layout.trayX, layout.trayY, layout.trayW, layout.trayHeaderH, [rTray, rTray, 0, 0]);
        ctx.fill();

        ctx.font = `600 ${layout.isDesktop ? 13 : 11}px Prompt, sans-serif`;
        ctx.fillStyle = darkMode ? 'rgba(226, 232, 240, 0.92)' : 'rgba(30, 41, 59, 0.9)';
        ctx.textBaseline = 'middle';
        const trayLabel = g.edgeFilter
          ? `🧩 เฉพาะชิ้นขอบ (เหลือ ${remainingEdges} ชิ้น • ทั้งหมด ${remainingCount})`
          : `ถาดชิ้นส่วน (เหลือ ${remainingCount} ชิ้น)`;
        ctx.fillText(trayLabel, layout.trayX + 14, layout.trayY + layout.trayHeaderH / 2);
        ctx.restore();

        // 3. Draw Square Puzzle Board Container + Accent Glow Frame
        ctx.save();
        const framePad = 7;
        ctx.shadowColor = darkMode ? `${category.accent}66` : `${category.accent}44`;
        ctx.shadowBlur = darkMode ? 28 : 26;
        ctx.shadowOffsetY = darkMode ? 0 : 8;
        ctx.beginPath();
        ctx.roundRect(
          layout.boardX - framePad,
          layout.boardY - framePad,
          layout.boardSize + framePad * 2,
          layout.boardSize + framePad * 2,
          18
        );
        ctx.fillStyle = darkMode ? 'rgba(8, 13, 36, 0.94)' : 'rgba(255, 255, 255, 0.96)';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = category.accent;
        ctx.stroke();
        ctx.restore();

        // Board interior background
        ctx.save();
        ctx.beginPath();
        ctx.rect(layout.boardX, layout.boardY, layout.boardSize, layout.boardSize);
        ctx.clip();
        ctx.fillStyle = darkMode ? '#0A1128' : '#F8FAFC';
        ctx.fillRect(layout.boardX, layout.boardY, layout.boardSize, layout.boardSize);

        // Ghost Guide Image (20% opacity dark / 22% light)
        if (g.showGhost) {
          const srcMin = Math.min(g.image.naturalWidth, g.image.naturalHeight);
          const sx = (g.image.naturalWidth - srcMin) / 2;
          const sy = (g.image.naturalHeight - srcMin) / 2;
          ctx.globalAlpha = darkMode ? 0.2 : 0.24;
          ctx.drawImage(
            g.image,
            sx,
            sy,
            srcMin,
            srcMin,
            layout.boardX,
            layout.boardY,
            layout.boardSize,
            layout.boardSize
          );
          ctx.globalAlpha = 1;
        }

        // Subtle NxN grid guide lines on board
        ctx.strokeStyle = darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.14)';
        ctx.lineWidth = 1;
        for (let i = 1; i < layout.gridSize; i++) {
          const gx = layout.boardX + i * layout.cellSize;
          const gy = layout.boardY + i * layout.cellSize;
          ctx.beginPath();
          ctx.moveTo(gx, layout.boardY);
          ctx.lineTo(gx, layout.boardY + layout.boardSize);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(layout.boardX, gy);
          ctx.lineTo(layout.boardX + layout.boardSize, gy);
          ctx.stroke();
        }
        ctx.restore();

        // 4. Draw Locked Pieces on Board
        for (const p of g.pieces) {
          if (!p.locked) continue;
          const sprite = g.sprites.get(p.id);
          if (!sprite) continue;
          const drawSize = sprite.spriteLogical * p.scale;
          ctx.drawImage(sprite.canvas, p.x - drawSize / 2, p.y - drawSize / 2, drawSize, drawSize);
        }

        // 5. Completion Flash (0.65s seamless artwork reveal + gleaming diagonal sheen)
        if (g.completionFlashStart !== null) {
          const elapsed = now - g.completionFlashStart;
          const prog = Math.min(1, elapsed / 650);
          ctx.save();
          ctx.beginPath();
          ctx.rect(layout.boardX, layout.boardY, layout.boardSize, layout.boardSize);
          ctx.clip();

          const srcMin = Math.min(g.image.naturalWidth, g.image.naturalHeight);
          const sx = (g.image.naturalWidth - srcMin) / 2;
          const sy = (g.image.naturalHeight - srcMin) / 2;
          ctx.globalAlpha = Math.min(1, prog * 1.4);
          ctx.drawImage(
            g.image,
            sx,
            sy,
            srcMin,
            srcMin,
            layout.boardX,
            layout.boardY,
            layout.boardSize,
            layout.boardSize
          );

          ctx.globalAlpha = Math.sin(prog * Math.PI) * 0.7;
          const sweepX = layout.boardX - layout.boardSize + prog * layout.boardSize * 2.4;
          const grad = ctx.createLinearGradient(
            sweepX,
            layout.boardY,
            sweepX + layout.boardSize * 0.45,
            layout.boardY + layout.boardSize * 0.45
          );
          grad.addColorStop(0, 'rgba(255,255,255,0)');
          grad.addColorStop(0.5, 'rgba(254,240,138,0.95)');
          grad.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = grad;
          ctx.fillRect(layout.boardX, layout.boardY, layout.boardSize, layout.boardSize);
          ctx.restore();
        }

        // 6. Active Hint Target Cell Pulse on Board
        if (g.hintPieceId !== null && now < g.hintUntil) {
          const hp = g.pieces.find((p) => p.id === g.hintPieceId && !p.locked);
          if (hp) {
            const pulse = 0.5 + 0.5 * Math.sin(now * 0.011);
            const ox = layout.boardX + hp.col * layout.cellSize;
            const oy = layout.boardY + hp.row * layout.cellSize;
            ctx.save();
            tracePiecePath(ctx, ox, oy, layout.cellSize, hp.tabs);
            ctx.fillStyle = `rgba(250, 204, 21, ${0.22 + pulse * 0.24})`;
            ctx.fill();
            ctx.lineWidth = 3 + pulse * 1.8;
            ctx.strokeStyle = darkMode
              ? `rgba(250, 204, 21, ${0.75 + pulse * 0.25})`
              : `rgba(217, 119, 6, ${0.85 + pulse * 0.15})`;
            ctx.shadowColor = '#F59E0B';
            ctx.shadowBlur = 16;
            ctx.stroke();
            ctx.restore();
          } else {
            g.hintPieceId = null;
          }
        }

        // 7. Draw Loose Pieces
        const loosePieces = g.pieces.filter((p) => {
          if (p.locked || p.id === g.dragPieceId) return false;
          if (g.edgeFilter && p.inTray && !p.isEdge) return false;
          return true;
        });
        loosePieces.sort((a, b) => a.z - b.z);

        for (const p of loosePieces) {
          const sprite = g.sprites.get(p.id);
          if (!sprite) continue;
          const drawSize = sprite.spriteLogical * p.scale;

          ctx.save();
          ctx.shadowColor = darkMode ? 'rgba(0, 0, 0, 0.58)' : 'rgba(15, 23, 42, 0.26)';
          ctx.shadowBlur = darkMode ? 9 : 10;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 4;

          ctx.drawImage(sprite.canvas, p.x - drawSize / 2, p.y - drawSize / 2, drawSize, drawSize);

          if (g.edgeFilter && p.isEdge) {
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            const scaledCell = layout.cellSize * p.scale;
            tracePiecePath(ctx, p.x - scaledCell / 2, p.y - scaledCell / 2, scaledCell, p.tabs);
            ctx.strokeStyle = darkMode ? 'rgba(251, 191, 36, 0.7)' : 'rgba(217, 119, 6, 0.8)';
            ctx.lineWidth = 1.8;
            ctx.stroke();
          }

          if (g.hintPieceId === p.id && now < g.hintUntil) {
            const pulse = 0.5 + 0.5 * Math.sin(now * 0.011);
            const scaledCell = layout.cellSize * p.scale;
            tracePiecePath(ctx, p.x - scaledCell / 2, p.y - scaledCell / 2, scaledCell, p.tabs);
            ctx.strokeStyle = `rgba(14, 165, 233, ${0.8 + pulse * 0.2})`;
            ctx.lineWidth = 3.2 + pulse * 2;
            ctx.shadowColor = '#0EA5E9';
            ctx.shadowBlur = 18;
            ctx.stroke();
          }
          ctx.restore();
        }

        // 8. Draw Currently Dragged Piece on Top (1.06x enlarged + deep shadow)
        if (g.dragPieceId !== null) {
          const dp = g.pieces.find((p) => p.id === g.dragPieceId);
          if (dp) {
            const sprite = g.sprites.get(dp.id);
            if (sprite) {
              const drawSize = sprite.spriteLogical * dp.scale;
              ctx.save();
              ctx.shadowColor = darkMode ? 'rgba(0, 0, 0, 0.72)' : 'rgba(15, 23, 42, 0.36)';
              ctx.shadowBlur = 26;
              ctx.shadowOffsetX = 0;
              ctx.shadowOffsetY = 14;
              ctx.drawImage(sprite.canvas, dp.x - drawSize / 2, dp.y - drawSize / 2, drawSize, drawSize);
              ctx.restore();
            }
          }
        }

        // 9. Draw Double-Ring Golden Snap Ripples
        g.ripples = g.ripples.filter((r) => now - r.start < 560);
        for (const r of g.ripples) {
          const t = (now - r.start) / 560;
          const radius = layout.cellSize * (0.28 + t * 0.96);
          ctx.save();
          ctx.beginPath();
          ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(250, 204, 21, ${(1 - t) * 0.95})`;
          ctx.lineWidth = 4.2 * (1 - t);
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(r.x, r.y, radius * 0.65, 0, Math.PI * 2);
          ctx.strokeStyle = `${category.accent}${Math.floor((1 - t) * 200)
            .toString(16)
            .padStart(2, '0')}`;
          ctx.lineWidth = 2.5 * (1 - t);
          ctx.stroke();
          ctx.restore();
        }

        // 10. Draw Sparkle Particles
        g.particles = g.particles.filter((pt) => now - pt.start < pt.life);
        for (const pt of g.particles) {
          const t = (now - pt.start) / pt.life;
          const px = pt.x + pt.vx * t * 52;
          const py = pt.y + pt.vy * t * 52 + t * t * 24;
          const size = pt.size * (1 - t * 0.7);
          ctx.save();
          ctx.globalAlpha = 1 - t;
          ctx.fillStyle = pt.color;
          ctx.translate(px, py);
          ctx.rotate(t * 5.5);
          ctx.fillRect(-size / 2, -size / 2, size, size);
          ctx.restore();
        }

        // 11. Draw Floating Arcade Combo Popups
        g.popups = g.popups.filter((pop) => now - pop.start < 1250);
        for (const pop of g.popups) {
          const t = (now - pop.start) / 1250;
          const easePop = Math.min(1, t * 5);
          const scale = 0.7 + easePop * 0.35;
          const alpha = t < 0.72 ? 1 : 1 - (t - 0.72) / 0.28;
          const py = pop.y - t * 48;

          ctx.save();
          ctx.globalAlpha = Math.max(0, alpha);
          ctx.translate(pop.x, py);
          ctx.scale(scale, scale);
          ctx.font = '800 18px Kanit, Prompt, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.lineWidth = 5;
          ctx.strokeStyle = 'rgba(15, 23, 42, 0.92)';
          ctx.strokeText(pop.text, 0, 0);
          ctx.fillStyle = pop.color;
          ctx.fillText(pop.text, 0, 0);
          ctx.restore();
        }

        ctx.restore();
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [category.accent]);

  const getCanvasPoint = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e) => {
    const g = gameRef.current;
    if (!g.layout || g.completed || g.dragPieceId !== null) return;

    const pt = getCanvasPoint(e);
    const isTouch = e.pointerType === 'touch';

    const candidates = g.pieces
      .filter((p) => {
        if (p.locked) return false;
        if (g.edgeFilter && p.inTray && !p.isEdge) return false;
        return true;
      })
      .sort((a, b) => b.z - a.z);

    for (const p of candidates) {
      if (hitTestPiece(pt.x, pt.y, p, g.layout.cellSize, isTouch)) {
        g.dragPieceId = p.id;
        g.dragIsTouch = isTouch;
        g.zCounter += 1;
        p.z = g.zCounter;
        p.inTray = false;
        p.targetX = null;
        p.targetY = null;
        p.targetScale = 1.06;

        const liftY = isTouch ? 18 : 0;
        g.dragOffsetX = p.x - pt.x;
        g.dragOffsetY = p.y - pt.y - liftY;
        p.y = pt.y + g.dragOffsetY;

        try {
          canvasRef.current.setPointerCapture(e.pointerId);
        } catch {
          // ignore
        }
        sound.playPickup();
        break;
      }
    }
  };

  const handlePointerMove = (e) => {
    const g = gameRef.current;
    if (g.dragPieceId === null || !g.layout) return;
    const p = g.pieces.find((item) => item.id === g.dragPieceId);
    if (!p) return;

    const pt = getCanvasPoint(e);
    const pad = g.layout.cellSize * 0.42;
    p.x = Math.max(pad, Math.min(g.layout.width - pad, pt.x + g.dragOffsetX));
    p.y = Math.max(pad, Math.min(g.layout.height - pad, pt.y + g.dragOffsetY));
  };

  const handlePointerUp = (e) => {
    const g = gameRef.current;
    if (g.dragPieceId === null || !g.layout) return;

    const p = g.pieces.find((item) => item.id === g.dragPieceId);
    g.dragPieceId = null;

    try {
      canvasRef.current.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (!p) return;

    const target = getBoardTargetCenter(p, g.layout);
    const dist = Math.hypot(p.x - target.x, p.y - target.y);
    const snapThreshold = g.layout.cellSize * 0.34;

    if (dist <= snapThreshold) {
      p.locked = true;
      p.inTray = false;
      p.targetX = target.x;
      p.targetY = target.y;
      p.targetScale = 1;

      if (g.hintPieceId === p.id) {
        g.hintPieceId = null;
      }

      const now = performance.now();
      if (g.lastSnapTime && now - g.lastSnapTime <= 5000) {
        g.combo += 1;
      } else {
        g.combo = 1;
      }
      g.lastSnapTime = now;
      if (g.combo > g.maxCombo) g.maxCombo = g.combo;
      setActiveCombo(g.combo);

      sound.playSnap(g.combo);

      g.ripples.push({ x: target.x, y: target.y, start: now });
      const sparkColors = ['#FACC15', '#38BDF8', '#FFFFFF', category.accent, '#F472B6'];
      for (let i = 0; i < 18; i++) {
        const angle = (Math.PI * 2 * i) / 18 + (Math.random() - 0.5) * 0.3;
        const speed = 0.7 + Math.random() * 0.95;
        g.particles.push({
          x: target.x,
          y: target.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.25,
          size: 4 + Math.random() * 4.5,
          color: sparkColors[i % sparkColors.length],
          start: now,
          life: 480 + Math.random() * 240,
        });
      }

      if (g.combo >= 2) {
        g.popups.push({
          x: Math.max(95, Math.min(g.layout.width - 95, target.x)),
          y: Math.max(40, target.y - g.layout.cellSize * 0.35),
          text: getComboLabel(g.combo),
          color: g.combo >= 4 ? '#F472B6' : '#FACC15',
          start: now,
        });
      }

      const newLockedCount = g.pieces.filter((item) => item.locked).length;
      setLockedCount(newLockedCount);

      if (newLockedCount === totalPieces) {
        g.completed = true;
        g.completionFlashStart = now;
        const finalStats = {
          elapsedSeconds: g.elapsedSeconds,
          hintsUsed: 0,
          maxCombo: Math.max(1, g.maxCombo),
        };
        setTimeout(() => {
          onComplete(finalStats);
        }, 680);
      }
    } else {
      sound.playDrop();
      const insideTray =
        p.x >= g.layout.trayX &&
        p.x <= g.layout.trayX + g.layout.trayW &&
        p.y >= g.layout.trayY &&
        p.y <= g.layout.trayY + g.layout.trayH;

      p.inTray = insideTray;
      p.targetScale = insideTray ? g.layout.trayScale : 1.0;
    }
  };

  const progressPct = Math.round((lockedCount / totalPieces) * 100);

  return (
    <div className="h-[100dvh] w-full flex flex-col overflow-hidden arcade-grid-bg select-none transition-colors duration-300">
      {/* Top Adaptive HUD Bar */}
      <header
        className={`relative z-20 shrink-0 px-2.5 sm:px-5 pt-2 sm:pt-3 pb-2 border-b backdrop-blur-xl transition-colors duration-300 ${
          isDark
            ? 'border-white/10 bg-[#080E27]/88'
            : 'border-slate-200/90 bg-white/88 shadow-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-col gap-2">
          {/* Row 1: Navigation, Category Info, Live Stats + Theme Switch */}
          <div className="flex items-center justify-between gap-2">
            {/* Left: Category Badge (Single-Play — No Back to Respin) */}
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span
                className="shrink-0 px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-extrabold text-white shadow"
                style={{ backgroundColor: category.accent }}
              >
                {category.code}
              </span>
              <span className="text-base sm:text-lg shrink-0">{category.icon}</span>
              <h1
                className={`font-display font-bold text-xs sm:text-base truncate ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                {category.title}
              </h1>
            </div>

            {/* Right: Combo + Timer + Progress + Compact ThemeToggle */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              {activeCombo >= 2 && (
                <motion.div
                  key={activeCombo}
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`hidden md:flex items-center gap-1 px-2.5 py-1 rounded-xl border text-xs font-extrabold ${
                    isDark
                      ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                      : 'bg-amber-100 border-amber-400 text-amber-800'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  <span>x{activeCombo}</span>
                </motion.div>
              )}

              <div
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-xl border text-xs sm:text-sm font-mono font-bold ${
                  isDark
                    ? 'bg-slate-900/90 border-white/15 text-sky-300'
                    : 'bg-sky-50 border-sky-200 text-sky-700'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-sky-500" />
                <span>{formatTime(elapsedSeconds)}</span>
              </div>

              <div
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-xl border text-xs sm:text-sm font-bold ${
                  isDark
                    ? 'bg-slate-900/90 border-white/15 text-emerald-300'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                }`}
              >
                <Puzzle className="w-3.5 h-3.5 text-emerald-500" />
                <span>
                  {lockedCount}/{totalPieces}
                </span>
              </div>

              <button
                type="button"
                onClick={onToggleBgm}
                aria-label={bgmEnabled ? 'ปิดเพลงประกอบ' : 'เปิดเพลงประกอบ'}
                title={bgmEnabled ? 'ปิดเพลงประกอบ (BGM)' : 'เปิดเพลงประกอบสนุกๆ (BGM)'}
                className={`hidden sm:flex p-1.5 rounded-xl border transition-colors ${
                  bgmEnabled
                    ? isDark
                      ? 'bg-fuchsia-500/20 border-fuchsia-400/60 text-fuchsia-300'
                      : 'bg-fuchsia-100 border-fuchsia-400 text-fuchsia-700'
                    : isDark
                    ? 'bg-white/5 border-white/15 text-slate-400 hover:bg-white/10'
                    : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
                }`}
              >
                <Music className={`w-3.5 h-3.5 ${bgmEnabled ? 'animate-pulse' : ''}`} />
              </button>

              <ThemeToggle theme={theme} onToggle={onToggleTheme} compact />
            </div>
          </div>

          {/* Row 2: Progress Bar + Action Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Desktop Animated Progress Bar */}
            <div className="hidden lg:flex items-center gap-2 w-48">
              <div
                className={`flex-1 h-2 rounded-full overflow-hidden border ${
                  isDark ? 'bg-slate-800 border-white/10' : 'bg-slate-200 border-slate-300/70'
                }`}
              >
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${progressPct}%`,
                    background: `linear-gradient(90deg, ${category.accent}, #FACC15)`,
                  }}
                />
              </div>
              <span className={`text-[11px] font-bold w-8 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {progressPct}%
              </span>
            </div>

            {/* Player-Friendly Control Strip (Ghost, Peek, Sound) */}
            <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-2 w-full lg:w-auto">
              {/* Ghost Guide */}
              <button
                type="button"
                onClick={() => {
                  sound.playButton();
                  setShowGhost((v) => !v);
                }}
                className={`px-2 sm:px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all whitespace-nowrap ${
                  showGhost
                    ? isDark
                      ? 'bg-sky-500/25 border-sky-400/60 text-sky-200'
                      : 'bg-sky-100 border-sky-400 text-sky-800'
                    : isDark
                    ? 'bg-white/5 border-white/15 text-slate-300 hover:bg-white/10'
                    : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200/80'
                }`}
                title="เปิด/ปิดภาพเงาช่วยต่อบนกระดาน"
              >
                {showGhost ? <Eye className="w-3.5 h-3.5 shrink-0" /> : <EyeOff className="w-3.5 h-3.5 shrink-0" />}
                <span>ภาพเงา</span>
              </button>

              {/* Peek Reference Image */}
              <button
                type="button"
                onClick={() => {
                  sound.playButton();
                  setShowPeek(true);
                }}
                className={`px-2 sm:px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all whitespace-nowrap ${
                  isDark
                    ? 'bg-white/5 hover:bg-white/15 border-white/15 text-slate-200'
                    : 'bg-slate-100 hover:bg-slate-200/80 border-slate-200 text-slate-700'
                }`}
                title="ดูภาพต้นฉบับเต็มหน้าจอ"
              >
                <ImageIcon className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                <span className="sm:hidden">ต้นฉบับ</span>
                <span className="hidden sm:inline">ดูภาพต้นฉบับ</span>
              </button>

              {/* Sound Toggle */}
              <button
                type="button"
                onClick={onToggleMute}
                aria-label={muted ? 'เปิดเสียง' : 'ปิดเสียง'}
                className={`px-2 sm:px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all whitespace-nowrap ${
                  isDark
                    ? 'bg-white/5 hover:bg-white/15 border-white/15 text-slate-200'
                    : 'bg-slate-100 hover:bg-slate-200/80 border-slate-200 text-slate-700'
                }`}
                title={muted ? 'เปิดเสียง' : 'ปิดเสียง'}
              >
                {muted ? (
                  <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500 shrink-0" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
                )}
                <span className="sm:hidden">{muted ? 'ปิดเสียง' : 'เสียง'}</span>
              </button>
            </div>
          </div>

          {/* Mobile slim progress bar */}
          <div
            className={`lg:hidden w-full h-1.5 rounded-full overflow-hidden ${
              isDark ? 'bg-slate-800/90' : 'bg-slate-200'
            }`}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progressPct}%`,
                background: `linear-gradient(90deg, ${category.accent}, #FACC15)`,
              }}
            />
          </div>
        </div>
      </header>

      {/* Unified Interactive Canvas Playfield */}
      <div ref={containerRef} className="relative flex-1 min-h-0 w-full overflow-hidden">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="puzzle-surface block w-full h-full cursor-grab active:cursor-grabbing"
        />

        {/* Loading Overlay */}
        {!isLoaded && !loadError && (
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center backdrop-blur-sm z-30 ${
              isDark ? 'bg-[#070B1E]/85' : 'bg-white/85'
            }`}
          >
            <div className="w-12 h-12 rounded-full border-4 border-sky-400/30 border-t-amber-400 animate-spin mb-3" />
            <p className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              กำลังตัดชิ้นส่วนจิ๊กซอร์ {gridSize}×{gridSize} ({category.code})...
            </p>
          </div>
        )}

        {/* Load Error Fallback */}
        {loadError && (
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-30 ${
              isDark ? 'bg-[#070B1E]/95' : 'bg-white/95'
            }`}
          >
            <p className="text-rose-500 font-bold mb-2">ไม่สามารถโหลดภาพภารกิจได้</p>
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 rounded-xl bg-sky-500 text-white text-sm font-bold"
            >
              กลับหน้าหลัก
            </button>
          </div>
        )}
      </div>

      {/* Peek Full Reference Image Popup */}
      <AnimatePresence>
        {showPeek && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPeek(false)}
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md ${
              isDark ? 'bg-slate-950/85' : 'bg-slate-900/45'
            }`}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{ borderColor: `${category.accent}BB` }}
              className={`w-full max-w-lg rounded-3xl border-2 p-4 sm:p-5 shadow-2xl ${
                isDark ? 'bg-[#0D1536]' : 'bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className="px-2.5 py-0.5 rounded-lg text-xs font-extrabold text-white"
                    style={{ backgroundColor: category.accent }}
                  >
                    {category.code}
                  </span>
                  <span className="text-lg">{category.icon}</span>
                  <h3 className={`font-display font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {category.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPeek(false)}
                  className={`p-1.5 rounded-xl ${
                    isDark ? 'bg-white/10 hover:bg-white/20 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                  aria-label="ปิดภาพตัวอย่าง"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div
                className={`w-full aspect-square rounded-2xl overflow-hidden border mb-3 ${
                  isDark ? 'border-white/15' : 'border-slate-200'
                }`}
              >
                <img src={category.image} alt={category.title} className="w-full h-full object-cover" />
              </div>

              <p className={`text-xs leading-relaxed mb-3 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {category.description}
              </p>

              <button
                type="button"
                onClick={() => setShowPeek(false)}
                className={`w-full py-2.5 rounded-xl text-sm font-bold transition-colors ${
                  isDark
                    ? 'bg-white/10 hover:bg-white/15 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                กลับไปต่อจิ๊กซอร์ต่อ
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

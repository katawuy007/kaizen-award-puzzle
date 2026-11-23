export const TAB_MARGIN_RATIO = 0.32;

/**
 * Generates randomized, mathematically matching tab/blank edge definitions for an N x N jigsaw grid (3x3, 4x4, 5x5).
 */
export function generateTabMap(gridSize = 5) {
  const hTabs = Array.from({ length: gridSize + 1 }, () => Array(gridSize).fill(0));
  for (let r = 1; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      hTabs[r][c] = Math.random() < 0.5 ? 1 : -1;
    }
  }

  const vTabs = Array.from({ length: gridSize }, () => Array(gridSize + 1).fill(0));
  for (let r = 0; r < gridSize; r++) {
    for (let c = 1; c < gridSize; c++) {
      vTabs[r][c] = Math.random() < 0.5 ? 1 : -1;
    }
  }

  const pieces = [];
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const top = r === 0 ? 0 : -hTabs[r][c];
      const right = c === gridSize - 1 ? 0 : vTabs[r][c + 1];
      const bottom = r === gridSize - 1 ? 0 : hTabs[r + 1][c];
      const left = c === 0 ? 0 : -vTabs[r][c];
      const isEdge = r === 0 || r === gridSize - 1 || c === 0 || c === gridSize - 1;
      pieces.push({
        id: r * gridSize + c,
        row: r,
        col: c,
        tabs: { top, right, bottom, left },
        isEdge,
      });
    }
  }
  return pieces;
}

/**
 * Symmetric cubic-Bezier jigsaw edge curve (zero gap / zero overlap across adjacent pieces).
 */
export function traceJigsawEdge(ctx, x1, y1, x2, y2, tabSign) {
  if (tabSign === 0) {
    ctx.lineTo(x2, y2);
    return;
  }

  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const nx = uy * tabSign;
  const ny = -ux * tabSign;

  const pt = (s, n) => [
    x1 + ux * (s * len) + nx * (n * len),
    y1 + uy * (s * len) + ny * (n * len),
  ];

  const [c1x, c1y] = pt(0.22, 0.0);
  const [c2x, c2y] = pt(0.38, -0.055);
  const [p1x, p1y] = pt(0.355, 0.085);
  ctx.bezierCurveTo(c1x, c1y, c2x, c2y, p1x, p1y);

  const [c3x, c3y] = pt(0.32, 0.245);
  const [c4x, c4y] = pt(0.68, 0.245);
  const [p2x, p2y] = pt(0.645, 0.085);
  ctx.bezierCurveTo(c3x, c3y, c4x, c4y, p2x, p2y);

  const [c5x, c5y] = pt(0.62, -0.055);
  const [c6x, c6y] = pt(0.78, 0.0);
  ctx.bezierCurveTo(c5x, c5y, c6x, c6y, x2, y2);
}

export function tracePiecePath(ctx, ox, oy, cellSize, tabs) {
  const x0 = ox;
  const y0 = oy;
  const x1 = ox + cellSize;
  const y1 = oy + cellSize;

  ctx.beginPath();
  ctx.moveTo(x0, y0);
  traceJigsawEdge(ctx, x0, y0, x1, y0, tabs.top);
  traceJigsawEdge(ctx, x1, y0, x1, y1, tabs.right);
  traceJigsawEdge(ctx, x1, y1, x0, y1, tabs.bottom);
  traceJigsawEdge(ctx, x0, y1, x0, y0, tabs.left);
  ctx.closePath();
}

export function bakePieceSprites(image, pieceDefs, cellSize, dpr, gridSize = 5) {
  const margin = Math.ceil(cellSize * TAB_MARGIN_RATIO);
  const spriteLogical = cellSize + margin * 2;
  const spritePx = Math.ceil(spriteLogical * dpr);

  const srcMin = Math.min(image.naturalWidth, image.naturalHeight);
  const srcOffsetX = (image.naturalWidth - srcMin) / 2;
  const srcOffsetY = (image.naturalHeight - srcMin) / 2;
  const srcCell = srcMin / gridSize;
  const srcMargin = srcCell * (margin / cellSize);

  const sprites = new Map();

  for (const def of pieceDefs) {
    const canvas = document.createElement('canvas');
    canvas.width = spritePx;
    canvas.height = spritePx;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    ctx.save();
    tracePiecePath(ctx, margin, margin, cellSize, def.tabs);
    ctx.clip();

    const sx = srcOffsetX + def.col * srcCell - srcMargin;
    const sy = srcOffsetY + def.row * srcCell - srcMargin;
    const sw = srcCell + srcMargin * 2;
    const sh = srcCell + srcMargin * 2;

    const clampedSx = Math.max(0, sx);
    const clampedSy = Math.max(0, sy);
    const clampedRight = Math.min(image.naturalWidth, sx + sw);
    const clampedBottom = Math.min(image.naturalHeight, sy + sh);
    const clampedSw = clampedRight - clampedSx;
    const clampedSh = clampedBottom - clampedSy;

    const scaleRatio = spriteLogical / sw;
    const dx = (clampedSx - sx) * scaleRatio;
    const dy = (clampedSy - sy) * scaleRatio;
    const dw = clampedSw * scaleRatio;
    const dh = clampedSh * scaleRatio;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image, clampedSx, clampedSy, clampedSw, clampedSh, dx, dy, dw, dh);

    // Subtle 3D cardboard bevel highlight
    ctx.save();
    ctx.translate(1.2, 1.2);
    tracePiecePath(ctx, margin, margin, cellSize, def.tabs);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.34)';
    ctx.lineWidth = 2.0;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(-1.2, -1.2);
    tracePiecePath(ctx, margin, margin, cellSize, def.tabs);
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.36)';
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.restore();

    ctx.restore();

    tracePiecePath(ctx, margin, margin, cellSize, def.tabs);
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.58)';
    ctx.lineWidth = 1.15;
    ctx.lineJoin = 'round';
    ctx.stroke();

    sprites.set(def.id, {
      canvas,
      margin,
      spriteLogical,
    });
  }

  return sprites;
}

export function computeArenaLayout(width, height, gridSize = 5) {
  const totalPieces = gridSize * gridSize;
  const isDesktop = width >= 840 && width > height * 1.05;
  const pad = isDesktop ? 18 : 10;

  let boardSize;
  let boardX;
  let boardY;
  let trayX;
  let trayY;
  let trayW;
  let trayH;

  if (isDesktop) {
    const maxBoardH = height - pad * 2;
    const maxBoardW = Math.floor(width * 0.54);
    boardSize = Math.max(240, Math.floor(Math.min(maxBoardH, maxBoardW) / gridSize) * gridSize);

    const gap = 20;
    const minTrayW = Math.min(480, Math.max(280, width - boardSize - pad * 2 - gap));
    const totalGroupW = boardSize + gap + minTrayW;
    const startX = Math.max(pad, Math.floor((width - totalGroupW) / 2));

    boardX = startX;
    boardY = Math.floor((height - boardSize) / 2);

    trayX = boardX + boardSize + gap;
    trayY = pad;
    trayW = Math.max(240, width - trayX - pad);
    trayH = height - pad * 2;
  } else {
    const maxBoardW = width - pad * 2;
    const maxBoardH = Math.floor(height * 0.54);
    boardSize = Math.max(200, Math.floor(Math.min(maxBoardW, maxBoardH) / gridSize) * gridSize);

    boardX = Math.floor((width - boardSize) / 2);
    boardY = pad;

    const gap = 12;
    trayX = pad;
    trayY = boardY + boardSize + gap;
    trayW = width - pad * 2;
    trayH = Math.max(135, height - trayY - pad);
  }

  const cellSize = boardSize / gridSize;
  const trayHeaderH = isDesktop ? 34 : 26;

  const innerTrayW = Math.max(120, trayW - 20);
  const innerTrayH = Math.max(90, trayH - trayHeaderH - 16);

  let bestCols = gridSize;
  let bestRows = gridSize;
  let bestSlotSize = 0;
  const minCols = Math.min(3, gridSize);
  const maxCols = Math.max(gridSize + 2, 6);
  for (let cols = minCols; cols <= maxCols; cols++) {
    const rows = Math.ceil(totalPieces / cols);
    const slotW = innerTrayW / cols;
    const slotH = innerTrayH / rows;
    const slotSize = Math.min(slotW, slotH);
    if (slotSize > bestSlotSize) {
      bestSlotSize = slotSize;
      bestCols = cols;
      bestRows = rows;
    }
  }

  const rawTrayScale = (bestSlotSize * 0.86) / (cellSize * 1.46);
  const trayScale = Math.max(0.42, Math.min(0.84, rawTrayScale));

  return {
    gridSize,
    totalPieces,
    width,
    height,
    isDesktop,
    boardX,
    boardY,
    boardSize,
    cellSize,
    trayX,
    trayY,
    trayW,
    trayH,
    trayHeaderH,
    trayCols: bestCols,
    trayRows: bestRows,
    trayScale,
  };
}

export function computeTraySlots(loosePieces, layout, edgeFirst = false) {
  const ordered = [...loosePieces];
  if (edgeFirst) {
    ordered.sort((a, b) => {
      if (a.isEdge !== b.isEdge) return a.isEdge ? -1 : 1;
      return a.trayOrder - b.trayOrder;
    });
  } else {
    ordered.sort((a, b) => a.trayOrder - b.trayOrder);
  }

  const count = ordered.length;
  if (count === 0) return new Map();

  const innerX = layout.trayX + 12;
  const innerY = layout.trayY + layout.trayHeaderH + 8;
  const innerW = Math.max(100, layout.trayW - 24);
  const innerH = Math.max(80, layout.trayH - layout.trayHeaderH - 16);

  let bestCols = layout.trayCols;
  let bestRows = layout.trayRows;
  let bestScore = 0;
  const minCols = layout.isDesktop ? 2 : 3;
  const maxCols = layout.isDesktop ? 6 : 8;

  for (let cols = minCols; cols <= maxCols; cols++) {
    const rows = Math.max(1, Math.ceil(count / cols));
    const slotSize = Math.min(innerW / cols, innerH / rows);
    if (slotSize > bestScore) {
      bestScore = slotSize;
      bestCols = cols;
      bestRows = rows;
    }
  }

  const slotW = innerW / bestCols;
  const slotH = innerH / bestRows;

  const dynamicScale = Math.max(
    layout.trayScale,
    Math.min(0.86, (Math.min(slotW, slotH) * 0.86) / (layout.cellSize * 1.46))
  );

  const map = new Map();
  ordered.forEach((piece, idx) => {
    const col = idx % bestCols;
    const row = Math.floor(idx / bestCols);
    const jitterX = ((piece.id * 17) % 5) - 2;
    const jitterY = ((piece.id * 31) % 5) - 2;
    map.set(piece.id, {
      x: innerX + slotW * (col + 0.5) + jitterX,
      y: innerY + slotH * (row + 0.5) + jitterY,
      scale: dynamicScale,
    });
  });

  return map;
}

export function hitTestPiece(px, py, piece, cellSize, isTouch = false) {
  const s = piece.scale || 1;
  const half = cellSize * s * (isTouch ? 0.68 : 0.62);
  return Math.abs(px - piece.x) <= half && Math.abs(py - piece.y) <= half;
}

export function getBoardTargetCenter(piece, layout) {
  return {
    x: layout.boardX + (piece.col + 0.5) * layout.cellSize,
    y: layout.boardY + (piece.row + 0.5) * layout.cellSize,
  };
}

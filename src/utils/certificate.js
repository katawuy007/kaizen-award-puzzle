import { CATEGORIES, formatTime } from '../data/categories.js';

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
  const words = text.split('');
  let line = '';
  let lineCount = 0;
  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i];
    if (ctx.measureText(testLine).width > maxWidth && line.length > 0) {
      ctx.fillText(line, x, y + lineCount * lineHeight);
      line = words[i];
      lineCount++;
      if (lineCount >= maxLines - 1) {
        const remaining = text.slice(i);
        let clipped = remaining;
        while (ctx.measureText(clipped + '…').width > maxWidth && clipped.length > 1) {
          clipped = clipped.slice(0, -1);
        }
        ctx.fillText(clipped === remaining ? clipped : clipped + '…', x, y + lineCount * lineHeight);
        return;
      }
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, x, y + lineCount * lineHeight);
  }
}

/**
 * Generates and downloads a crisp 1200x800 PNG Collectible Award Card for a completed category.
 */
export async function downloadCategoryCertificate({
  category,
  stats,
  gridSize = 5,
  playerName = '',
  department = '',
  quizBonus = false,
}) {
  const W = 1200;
  const H = 800;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Rich gala gradient backdrop
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#070D24');
  bg.addColorStop(0.55, '#111A44');
  bg.addColorStop(1, '#090E26');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Ambient accent glow
  const glow = ctx.createRadialGradient(310, 400, 40, 310, 400, 420);
  glow.addColorStop(0, `${category.accent}55`);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Outer gold-accent certificate frame
  drawRoundedRect(ctx, 28, 28, W - 56, H - 56, 34);
  ctx.lineWidth = 4;
  const borderGrad = ctx.createLinearGradient(0, 0, W, H);
  borderGrad.addColorStop(0, category.accent);
  borderGrad.addColorStop(0.5, '#FACC15');
  borderGrad.addColorStop(1, category.accent);
  ctx.strokeStyle = borderGrad;
  ctx.stroke();

  // Inner thin frame
  drawRoundedRect(ctx, 42, 42, W - 84, H - 84, 26);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.stroke();

  // Left: High-res completed artwork card
  const artX = 82;
  const artY = 148;
  const artSize = 480;
  try {
    const img = await loadImage(category.image);
    ctx.save();
    ctx.shadowColor = `${category.accent}88`;
    ctx.shadowBlur = 32;
    drawRoundedRect(ctx, artX, artY, artSize, artSize, 26);
    ctx.fillStyle = '#0F172A';
    ctx.fill();
    ctx.restore();

    ctx.save();
    drawRoundedRect(ctx, artX, artY, artSize, artSize, 26);
    ctx.clip();
    ctx.drawImage(img, artX, artY, artSize, artSize);
    ctx.restore();

    drawRoundedRect(ctx, artX, artY, artSize, artSize, 26);
    ctx.lineWidth = 4;
    ctx.strokeStyle = category.accent;
    ctx.stroke();
  } catch {
    // fallback rectangle
  }

  // CAT badge on artwork
  drawRoundedRect(ctx, artX + 18, artY + 18, 120, 40, 12);
  ctx.fillStyle = category.accent;
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 20px Kanit, Prompt, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(category.code, artX + 38, artY + 38);

  // Header Crest
  ctx.fillStyle = '#FACC15';
  ctx.font = '700 22px Prompt, sans-serif';
  ctx.fillText('🏆 KAIZEN AWARD • OFFICIAL PUZZLE ACHIEVEMENT', 82, 98);

  // Right column info
  const rx = 608;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 44px Kanit, Prompt, sans-serif';
  ctx.fillText(`${category.icon} ${category.title}`, rx, 190);

  // Player Name / Department Banner
  const displayName = playerName.trim() || 'Kaizen Challenger';
  const displayDept = department.trim();
  drawRoundedRect(ctx, rx, 228, 510, displayDept ? 84 : 62, 18);
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(250,204,21,0.35)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#FDE047';
  ctx.font = '700 26px Prompt, sans-serif';
  ctx.fillText(`ผู้พิชิตภารกิจ: ${displayName}`, rx + 22, 260);
  if (displayDept) {
    ctx.fillStyle = '#CBD5E1';
    ctx.font = '500 18px Prompt, sans-serif';
    ctx.fillText(`หน่วยงาน / แผนก: ${displayDept}`, rx + 22, 292);
  }

  // Stars & Quiz bonus
  const starY = displayDept ? 350 : 330;
  const stars = stats?.stars || 1;
  ctx.font = '40px sans-serif';
  ctx.fillStyle = '#FACC15';
  ctx.fillText('★'.repeat(stars) + '☆'.repeat(3 - stars), rx, starY);

  if (quizBonus) {
    drawRoundedRect(ctx, rx + 165, starY - 22, 240, 38, 19);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.22)';
    ctx.fill();
    ctx.strokeStyle = '#34D399';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#6EE7B7';
    ctx.font = '700 17px Prompt, sans-serif';
    ctx.fillText('✨ โบนัสตอบคำถามถูกต้อง!', rx + 184, starY - 2);
  }

  // Stats Row
  const statY = starY + 42;
  const statBoxes = [
    { label: 'ระดับกระดาน', value: `${gridSize}×${gridSize} (${gridSize * gridSize} ชิ้น)`, color: '#A78BFA' },
    { label: 'เวลาที่ใช้', value: formatTime(stats.elapsedSeconds), color: '#38BDF8' },
    { label: 'Max Combo', value: `x${stats.maxCombo || 1}`, color: '#FB923C' },
  ];
  statBoxes.forEach((box, idx) => {
    const bx = rx + idx * 174;
    drawRoundedRect(ctx, bx, statY, 160, 86, 16);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#94A3B8';
    ctx.font = '500 15px Prompt, sans-serif';
    ctx.fillText(box.label, bx + 16, statY + 28);

    ctx.fillStyle = box.color;
    ctx.font = '800 22px Kanit, Prompt, sans-serif';
    ctx.fillText(box.value, bx + 16, statY + 60);
  });

  // Thai Kaizen takeaway description
  const descY = statY + 114;
  drawRoundedRect(ctx, rx, descY, 510, 128, 18);
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.fill();
  ctx.fillStyle = '#E2E8F0';
  ctx.font = '500 18px Prompt, sans-serif';
  wrapText(ctx, category.description, rx + 20, descY + 34, 470, 30, 3);

  // Footer Timestamp
  const dateStr = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  ctx.fillStyle = '#94A3B8';
  ctx.font = '500 16px Prompt, sans-serif';
  ctx.fillText(`KAIZEN AWARD JIGSAW CHALLENGE • ${dateStr}`, 82, H - 72);

  // Trigger download
  const link = document.createElement('a');
  link.download = `kaizen-award-${category.id}-${gridSize}x${gridSize}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

/**
 * Generates and downloads a 1200x800 Grand Kaizen Collection / Master Certificate PNG showing all 7 categories!
 */
export async function downloadMasterCertificate({ progress, playerName = '', department = '' }) {
  const W = 1200;
  const H = 800;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const completedCats = CATEGORIES.filter((c) => progress[c.id]?.completed);
  const isGrandMaster = completedCats.length === CATEGORIES.length;

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#070B1E');
  bg.addColorStop(0.5, '#161B47');
  bg.addColorStop(1, '#0B102C');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  drawRoundedRect(ctx, 26, 26, W - 52, H - 52, 34);
  ctx.lineWidth = 5;
  const frameGrad = ctx.createLinearGradient(0, 0, W, H);
  frameGrad.addColorStop(0, '#38BDF8');
  frameGrad.addColorStop(0.5, '#FACC15');
  frameGrad.addColorStop(1, '#EC4899');
  ctx.strokeStyle = frameGrad;
  ctx.stroke();

  // Top Title
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FACC15';
  ctx.font = '800 22px Prompt, sans-serif';
  ctx.fillText(
    isGrandMaster
      ? '👑 GRAND KAIZEN MASTER CERTIFICATE • ครบทั้ง 7 หมวดรางวัล 👑'
      : `🏆 KAIZEN AWARD COLLECTION • สะสมแล้ว ${completedCats.length} / 7 หมวด`,
    W / 2,
    88
  );

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 44px Kanit, Prompt, sans-serif';
  ctx.fillText(playerName.trim() || 'KAIZEN AWARD CHALLENGER', W / 2, 145);

  if (department.trim()) {
    ctx.fillStyle = '#93C5FD';
    ctx.font = '600 22px Prompt, sans-serif';
    ctx.fillText(department.trim(), W / 2, 184);
  }

  // Draw all 7 category thumbnails in a clean 4 + 3 centered gallery
  const thumbSize = 165;
  const gapX = 36;
  const rows = [CATEGORIES.slice(0, 4), CATEGORIES.slice(4, 7)];

  for (let r = 0; r < rows.length; r++) {
    const rowCats = rows[r];
    const totalRowW = rowCats.length * thumbSize + (rowCats.length - 1) * gapX;
    const startX = (W - totalRowW) / 2;
    const y = r === 0 ? 226 : 458;

    for (let i = 0; i < rowCats.length; i++) {
      const cat = rowCats[i];
      const x = startX + i * (thumbSize + gapX);
      const rec = progress[cat.id];
      const unlocked = Boolean(rec?.completed);

      ctx.save();
      drawRoundedRect(ctx, x, y, thumbSize, thumbSize, 20);
      ctx.clip();
      try {
        const img = await loadImage(cat.image);
        if (!unlocked) ctx.filter = 'grayscale(100%) brightness(28%)';
        ctx.drawImage(img, x, y, thumbSize, thumbSize);
        ctx.filter = 'none';
      } catch {
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(x, y, thumbSize, thumbSize);
      }
      ctx.restore();

      drawRoundedRect(ctx, x, y, thumbSize, thumbSize, 20);
      ctx.lineWidth = unlocked ? 3.5 : 1.5;
      ctx.strokeStyle = unlocked ? cat.accent : 'rgba(255,255,255,0.2)';
      ctx.stroke();

      // Label under thumbnail
      ctx.textAlign = 'center';
      ctx.fillStyle = unlocked ? '#FFFFFF' : '#64748B';
      ctx.font = '700 15px Prompt, sans-serif';
      ctx.fillText(`${cat.code} ${cat.icon}`, x + thumbSize / 2, y + thumbSize + 24);

      if (unlocked) {
        ctx.fillStyle = '#FACC15';
        ctx.font = '14px sans-serif';
        ctx.fillText(
          `${'★'.repeat(rec.bestStars || 1)}  ${formatTime(rec.bestTime)}`,
          x + thumbSize / 2,
          y + thumbSize + 44
        );
      } else {
        ctx.fillStyle = '#475569';
        ctx.font = '500 13px Prompt, sans-serif';
        ctx.fillText('LOCKED', x + thumbSize / 2, y + thumbSize + 44);
      }
    }
  }

  const dateStr = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  ctx.textAlign = 'center';
  ctx.fillStyle = '#94A3B8';
  ctx.font = '500 16px Prompt, sans-serif';
  ctx.fillText(`KAIZEN AWARD JIGSAW PUZZLE GAME • ${dateStr}`, W / 2, H - 56);

  const link = document.createElement('a');
  link.download = isGrandMaster ? 'kaizen-award-grand-master.png' : 'kaizen-award-collection.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

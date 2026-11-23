export const DIFFICULTIES = [
  {
    gridSize: 3,
    label: '3×3',
    pieces: 9,
    tag: 'ไวทันใจ',
    desc: '9 ชิ้น (~30 วิ)',
    star3Time: 45,
    star2Time: 90,
  },
  {
    gridSize: 4,
    label: '4×4',
    pieces: 16,
    tag: 'กำลังสนุก',
    desc: '16 ชิ้น (~1 นาที)',
    star3Time: 85,
    star2Time: 150,
  },
  {
    gridSize: 5,
    label: '5×5',
    pieces: 25,
    tag: 'มาตรฐาน',
    desc: '25 ชิ้น (ท้าทาย)',
    star3Time: 120,
    star2Time: 210,
  },
];

export const CATEGORIES = [
  {
    id: 'cat01',
    code: 'CAT 01',
    icon: '🤖',
    title: 'Automation Kaizen',
    accent: '#0EA5E9',
    accentSoft: 'rgba(14, 165, 233, 0.22)',
    gradient: 'from-sky-500 via-cyan-400 to-blue-600',
    image: '/assets/puzzles/cat01.webp',
    description:
      'ประดิษฐ์และปรับปรุงกระบวนการทำงานให้เป็นระบบอัตโนมัติ ด้วยการผสาน Software, Electronics และ Mechanics ภายในองค์กร',
    quiz: {
      question: 'Automation Kaizen เป็นการผสาน 3 ศาสตร์หลักใดเข้าด้วยกัน?',
      options: [
        'Software, Electronics และ Mechanics',
        'การตลาด, บัญชี และฝ่ายบุคคล',
        'พลังงานลม, รอก และแรงโน้มถ่วงโดยไม่ใช้ไฟฟ้า',
      ],
      correctIndex: 0,
      fact: 'Automation Kaizen ผสาน Software + Electronics + Mechanics เพื่อสร้างระบบอัตโนมัติภายในองค์กร',
    },
  },
  {
    id: 'cat02',
    code: 'CAT 02',
    icon: '⚙️',
    title: 'Karakuri Kaizen',
    accent: '#D97706',
    accentSoft: 'rgba(217, 119, 6, 0.24)',
    gradient: 'from-amber-500 via-orange-400 to-yellow-600',
    image: '/assets/puzzles/cat02.webp',
    description:
      'ปรับปรุงการทำงานโดยไม่ใช้ไฟฟ้า ใช้หลักกลศาสตร์ พลังงานธรรมชาติ และพลังงานสูญเปล่า ประดิษฐ์กลไกอัตโนมัติด้วยตนเอง',
    quiz: {
      question: 'จุดเด่นสำคัญที่สุดของกลไก Karakuri Kaizen คือข้อใด?',
      options: [
        'ต้องใช้หุ่นยนต์และระบบ AI ควบคุมตลอดเวลา',
        'ไม่ใช้ไฟฟ้า อาศัยหลักกลศาสตร์และแรงธรรมชาติ เช่น แรงโน้มถ่วง รอก คาน',
        'ใช้เฉพาะในงานเอกสารสำนักงานเท่านั้น',
      ],
      correctIndex: 1,
      fact: 'Karakuri Kaizen โดดเด่นเรื่องความประหยัดพลังงาน ไม่ใช้ไฟฟ้า แต่ใช้กลศาสตร์อย่างชาญฉลาด!',
    },
  },
  {
    id: 'cat03',
    code: 'CAT 03',
    icon: '💼',
    title: 'Service Kaizen',
    accent: '#10B981',
    accentSoft: 'rgba(16, 185, 129, 0.22)',
    gradient: 'from-emerald-400 via-teal-400 to-green-600',
    image: '/assets/puzzles/cat03.webp',
    description:
      'การปรับปรุงระบบและวิธีการทำงานในสำนักงานและหน่วยงานบริการ เพื่อบริการที่สะดวก รวดเร็ว แม่นยำ และคุ้มค่าสูงสุด',
    quiz: {
      question: 'เป้าหมายหลักของ Service Kaizen คือการยกระดับงานในส่วนใด?',
      options: [
        'การเชื่อมประกอบโครงสร้างเหล็กในโรงงาน',
        'ระบบและวิธีการทำงานในสำนักงานและงานบริการให้สะดวก รวดเร็ว แม่นยำ',
        'การออกแบบยานอวกาศและดาวเทียม',
      ],
      correctIndex: 1,
      fact: 'Service Kaizen มุ่งเน้นให้ทั้งลูกค้าและทีมสำนักงานได้รับบริการที่รวดเร็ว แม่นยำ และคุ้มค่าสูงสุด',
    },
  },
  {
    id: 'cat04',
    code: 'CAT 04',
    icon: '🏭',
    title: 'Genba Kaizen',
    accent: '#F59E0B',
    accentSoft: 'rgba(245, 158, 11, 0.24)',
    gradient: 'from-yellow-400 via-amber-500 to-orange-500',
    image: '/assets/puzzles/cat04.webp',
    description:
      'ไคเซ็นหน้างานโดยกลุ่มพนักงานผู้ปฏิบัติการ แก้ไขรวดเร็ว ไม่ซับซ้อน ใช้งบประมาณประหยัด และทำได้เองภายในองค์กร',
    quiz: {
      question: 'คำว่า "Genba" ใน Genba Kaizen หมายถึงอะไร?',
      options: [
        'ห้องประชุมผู้บริหารระดับสูงเท่านั้น',
        'พื้นที่ปฏิบัติงานจริงหน้างานที่เกิดปัญหาและแก้ไขได้ทันที',
        'ซอฟต์แวร์วิเคราะห์ข้อมูลบนคลาวด์',
      ],
      correctIndex: 1,
      fact: 'Genba (เก็มบะ) คือ "สถานที่จริง/หน้างานจริง" ที่ทีมปฏิบัติการลงมือแก้ปัญหาได้อย่างรวดเร็วและประหยัดงบ!',
    },
  },
  {
    id: 'cat05',
    code: 'CAT 05',
    icon: '💡',
    title: 'Kaizen Suggestion System (KSS)',
    accent: '#EC4899',
    accentSoft: 'rgba(236, 72, 153, 0.22)',
    gradient: 'from-pink-500 via-rose-400 to-fuchsia-600',
    image: '/assets/puzzles/cat05.webp',
    description:
      'ระบบข้อเสนอแนะ ไคเซ็นประเภทบุคคล คิดเอง-ทำเอง รวดเร็ว เรียบง่าย และเห็นผลจริงในการทำงานประจำวัน',
    quiz: {
      question: 'ลักษณะเด่นของ Kaizen Suggestion System (KSS) คือข้อใด?',
      options: [
        'ไคเซ็นประเภทบุคคล คิดเอง-ทำเอง รวดเร็ว เรียบง่าย เห็นผลในงานประจำวัน',
        'ต้องรอตั้งคณะกรรมการข้ามสายงานขนาดใหญ่ก่อนเริ่มทำ',
        'ใช้เวลาพัฒนาอย่างน้อย 3 ปีจึงจะเสนอได้',
      ],
      correctIndex: 0,
      fact: 'KSS เปิดโอกาสให้พนักงานทุกคนเริ่มปรับปรุงงานเล็กๆ รอบตัวแบบ "คิดเอง-ทำเอง" ได้ทันที!',
    },
  },
  {
    id: 'cat06',
    code: 'CAT 06',
    icon: '🚀',
    title: 'Kaizen for Innovation',
    accent: '#8B5CF6',
    accentSoft: 'rgba(139, 92, 246, 0.24)',
    gradient: 'from-violet-500 via-purple-500 to-indigo-600',
    image: '/assets/puzzles/cat06.webp',
    description:
      'การพัฒนาต่อยอดสู่นวัตกรรมที่มีความก้าวหน้า แปลกใหม่ สร้างผลกระทบเชิงบวกต่อธุรกิจ อุตสาหกรรม หรือสังคม (Show & Share)',
    quiz: {
      question: 'Kaizen for Innovation มุ่งสร้างคุณค่าในระดับใด?',
      options: [
        'จัดระเบียบโต๊ะทำงานเฉพาะบุคคลเท่านั้น',
        'ต่อยอดสู่นวัตกรรมที่ก้าวหน้า แปลกใหม่ สร้างผลกระทบเชิงบวกต่อธุรกิจ อุตสาหกรรม หรือสังคม',
        'ซ่อมบำรุงอุปกรณ์เดิมโดยไม่เปลี่ยนแปลงรูปแบบ',
      ],
      correctIndex: 1,
      fact: 'Kaizen for Innovation คือการยกระดับไคเซ็นสู่การสร้างนวัตกรรมที่สร้างผลกระทบเชิงบวกในวงกว้าง!',
    },
  },
  {
    id: 'cat07',
    code: 'CAT 07',
    icon: '📊',
    title: 'Project Kaizen',
    accent: '#EF4444',
    accentSoft: 'rgba(239, 68, 68, 0.24)',
    gradient: 'from-red-500 via-rose-500 to-blue-900',
    image: '/assets/puzzles/cat07.webp',
    description:
      'โครงการปรับปรุงระบบเชิงบูรณาการ บริหารงานข้ามสายงาน (Cross-functional) โดยทีมวิศวกรและผู้บริหารโครงการ',
    quiz: {
      question: 'จุดเด่นของการบริหารงานใน Project Kaizen คือข้อใด?',
      options: [
        'ทำคนเดียวโดยไม่สื่อสารกับแผนกอื่น',
        'บูรณาการและบริหารงานข้ามสายงาน (Cross-functional) อย่างเป็นระบบ',
        'ไม่จำเป็นต้องวัดผล KPI หรือวางแผนโครงการ',
      ],
      correctIndex: 1,
      fact: 'Project Kaizen เชื่อมโยงหลายฝ่ายแบบ Cross-functional พร้อมติดตาม KPI และแผนงานอย่างเป็นระบบ!',
    },
  },
];

const STORAGE_KEY = 'kaizen_award_puzzle_progress_v1';
const LEADERBOARD_KEY = 'kaizen_award_leaderboard_v1';

export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage quota errors
  }
}

export function clearProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}

export function loadLeaderboard() {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addLeaderboardEntry(entry) {
  const list = loadLeaderboard();
  const next = [
    ...list,
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: (entry.name || 'ผู้ท้าชิงนิรนาม').trim().slice(0, 32),
      department: (entry.department || '').trim().slice(0, 32),
      categoryId: entry.categoryId,
      gridSize: entry.gridSize || 5,
      elapsedSeconds: entry.elapsedSeconds,
      hintsUsed: entry.hintsUsed || 0,
      maxCombo: entry.maxCombo || 1,
      stars: entry.stars || 1,
      quizBonus: Boolean(entry.quizBonus),
      createdAt: Date.now(),
    },
  ]
    .sort((a, b) => {
      // Higher gridSize first if comparing overall, then faster time, then fewer hints
      if (b.gridSize !== a.gridSize) return b.gridSize - a.gridSize;
      if (a.elapsedSeconds !== b.elapsedSeconds) return a.elapsedSeconds - b.elapsedSeconds;
      return a.hintsUsed - b.hintsUsed;
    })
    .slice(0, 100);

  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

export function clearLeaderboard() {
  try {
    localStorage.removeItem(LEADERBOARD_KEY);
  } catch {
    // ignore
  }
}

export function calculateStars(elapsedSeconds, hintsUsed, gridSize = 5) {
  const cfg = DIFFICULTIES.find((d) => d.gridSize === gridSize) || DIFFICULTIES[2];
  if (elapsedSeconds <= cfg.star3Time && hintsUsed <= 1) return 3;
  if (elapsedSeconds <= cfg.star2Time) return 2;
  return 1;
}

export function formatTime(totalSeconds) {
  const safe = Math.max(0, Math.floor(totalSeconds || 0));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function pickSmartCategory(progress, sessionHistory = [], lastDrawnId = null) {
  const uncompletedAndFresh = CATEGORIES.filter(
    (c) => !progress[c.id]?.completed && !sessionHistory.includes(c.id)
  );
  if (uncompletedAndFresh.length > 0) {
    return uncompletedAndFresh[Math.floor(Math.random() * uncompletedAndFresh.length)];
  }

  const uncompleted = CATEGORIES.filter(
    (c) => !progress[c.id]?.completed && c.id !== lastDrawnId
  );
  if (uncompleted.length > 0) {
    return uncompleted[Math.floor(Math.random() * uncompleted.length)];
  }

  const anyUncompleted = CATEGORIES.filter((c) => !progress[c.id]?.completed);
  if (anyUncompleted.length > 0) {
    return anyUncompleted[Math.floor(Math.random() * anyUncompleted.length)];
  }

  const freshThisSession = CATEGORIES.filter(
    (c) => !sessionHistory.includes(c.id) && c.id !== lastDrawnId
  );
  if (freshThisSession.length > 0) {
    return freshThisSession[Math.floor(Math.random() * freshThisSession.length)];
  }

  const nonRepeating = CATEGORIES.filter((c) => c.id !== lastDrawnId);
  return nonRepeating[Math.floor(Math.random() * nonRepeating.length)] || CATEGORIES[0];
}

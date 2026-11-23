import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import QRCode from 'qrcode';
import { X, QrCode, Smartphone, Copy, Check } from 'lucide-react';
import { sound } from '../utils/sound.js';

export default function QrShareModal({ theme, onClose }) {
  const isDark = theme === 'dark';
  const [url, setUrl] = useState(() =>
    typeof window !== 'undefined' ? window.location.href : 'http://localhost:5173/'
  );
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    const target = url.trim() || 'http://localhost:5173/';
    QRCode.toDataURL(target, {
      width: 280,
      margin: 2,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF',
      },
    })
      .then((data) => {
        if (active) setQrDataUrl(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [url]);

  const handleCopy = async () => {
    sound.playButton();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  const isLocalhost = url.includes('localhost') || url.includes('127.0.0.1');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md ${
        isDark ? 'bg-slate-950/80' : 'bg-slate-900/45'
      }`}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md rounded-3xl border-2 p-5 sm:p-6 shadow-2xl ${
          isDark
            ? 'border-sky-400/50 bg-gradient-to-b from-[#131C42] to-[#080D24]'
            : 'border-sky-300 bg-gradient-to-b from-white to-[#F4F9FF]'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h2 className={`font-display font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
                สแกนเล่นบนมือถือหน้าบูธ
              </h2>
              <p className={`text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                สแกน QR Code เพื่อเปิดเกม KAIZEN AWARD ได้ทันที
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              sound.playButton();
              onClose();
            }}
            className={`p-2 rounded-xl ${
              isDark ? 'bg-white/10 hover:bg-white/20 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            aria-label="ปิด QR Code"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Code Card */}
        <div className="flex flex-col items-center">
          <div className="p-4 rounded-3xl bg-white shadow-xl border-4 border-amber-400/80 mb-4">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code สำหรับเปิดเกม" className="w-56 h-56 block" />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-xs">
                กำลังสร้าง QR Code...
              </div>
            )}
          </div>

          {/* Editable URL field (great for pasting LAN IP or deployed link!) */}
          <div className="w-full mb-3">
            <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              ลิงก์ของเกม (แก้ไขเป็น IP Wi-Fi หรือลิงก์เว็บจริงได้):
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className={`flex-1 px-3 py-2 rounded-xl text-xs font-mono border outline-none ${
                  isDark
                    ? 'bg-slate-900/90 border-white/15 text-sky-200 focus:border-sky-400'
                    : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-sky-500'
                }`}
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold flex items-center gap-1 transition-colors shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
              </button>
            </div>
          </div>

          {isLocalhost && (
            <div
              className={`w-full rounded-xl p-3 text-[11px] leading-relaxed flex items-start gap-2 border ${
                isDark
                  ? 'bg-amber-500/10 border-amber-400/30 text-amber-200'
                  : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}
            >
              <Smartphone className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>
                <strong>ทิปสำหรับมือถือ:</strong> เปลี่ยนคำว่า <code>localhost</code> เป็น IP Wi-Fi ของเครื่องนี้ (เช่น <code>http://192.168.x.x:5173</code> จากหน้าต่าง Terminal) เพื่อให้มือถือใน Wi-Fi เดียวกันสแกนเข้าเล่นได้ทันที!
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

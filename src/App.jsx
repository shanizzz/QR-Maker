import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Moon, Sun, Waves, Sunrise, Download, QrCode, Copy, FileImage } from 'lucide-react';

const THEMES = [
  { id: 'midnight', name: 'Midnight', icon: Moon },
  { id: 'light', name: 'Light', icon: Sun },
  { id: 'ocean', name: 'Ocean', icon: Waves },
  { id: 'sunset', name: 'Sunset', icon: Sunrise },
];

const QR_COLORS = {
  midnight: { fg: '#818cf8', bg: '#ffffff' },
  light: { fg: '#4f46e5', bg: '#ffffff' },
  ocean: { fg: '#22d3ee', bg: '#ffffff' },
  sunset: { fg: '#f97316', bg: '#ffffff' },
};

const ERROR_LEVELS = [
  { value: 'L', label: 'Low (7%)' },
  { value: 'M', label: 'Medium (15%)' },
  { value: 'Q', label: 'Quartile (25%)' },
  { value: 'H', label: 'High (30%)' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: (i = 0) => ({
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: i * 0.1 },
  }),
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export default function App() {
  const [value, setValue] = useState('https://github.com/shanizzz');
  const [theme, setTheme] = useState('midnight');
  const [size, setSize] = useState(256);
  const [level, setLevel] = useState('H');
  const [customFg, setCustomFg] = useState('');
  const [customBg, setCustomBg] = useState('');
  const [logoUrl, setLogoUrl] = useState(null);
  const [toast, setToast] = useState(null);
  const qrRef = useRef(null);
  const logoInputRef = useRef(null);

  const themeColors = QR_COLORS[theme] || QR_COLORS.midnight;
  const fgColor = customFg || themeColors.fg;
  const bgColor = customBg || themeColors.bg;

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  const getSvgBlob = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg || !value.trim()) return null;
    const svgData = new XMLSerializer().serializeToString(svg);
    return new Blob([svgData], { type: 'image/svg+xml' });
  };

  const getPngDataUrl = (callback) => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg || !value.trim()) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      callback(canvas.toDataURL('image/png'));
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);
  };

  const handleDownloadPng = () => {
    getPngDataUrl((dataUrl) => {
      const link = document.createElement('a');
      link.download = 'qr-code.png';
      link.href = dataUrl;
      link.click();
      showToast('PNG downloaded!');
    });
  };

  const handleDownloadSvg = () => {
    const blob = getSvgBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'qr-code.svg';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    showToast('SVG downloaded!');
  };

  const handleCopy = async () => {
    getPngDataUrl(async (dataUrl) => {
      try {
        const blob = await (await fetch(dataUrl)).blob();
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        showToast('Copied to clipboard!');
      } catch {
        showToast('Copy failed');
      }
    });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (logoUrl) URL.revokeObjectURL(logoUrl);
    setLogoUrl(URL.createObjectURL(file));
    if (level !== 'H') setLevel('H');
  };

  const removeLogo = () => {
    if (logoUrl) URL.revokeObjectURL(logoUrl);
    setLogoUrl(null);
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const logoSize = Math.round(size * 0.2);
  const imageSettings = logoUrl
    ? {
        src: logoUrl,
        height: logoSize,
        width: logoSize,
        excavate: true,
      }
    : undefined;

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-8" data-theme={theme}>
      <div className="app-bg" />

      <AnimatePresence>
        {toast && (
          <motion.div
            className="fixed top-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl font-medium z-50 shadow-lg"
            style={{ background: 'var(--accent)', color: 'white' }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.header
        className="text-center mb-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h1
          className="font-heading text-4xl md:text-5xl font-extrabold tracking-tight mb-2 bg-gradient-to-br from-[var(--text-primary)] to-[var(--accent)] bg-clip-text text-transparent"
          variants={itemVariants}
        >
          QR Generator
        </motion.h1>
        <motion.p
          className="text-lg font-medium mb-8"
          style={{ color: 'var(--text-secondary)' }}
          variants={itemVariants}
        >
          Create beautiful QR codes in seconds
        </motion.p>

        <motion.div
          className="flex gap-2 justify-center flex-wrap"
          variants={itemVariants}
        >
          {THEMES.map((t) => {
            const Icon = t.icon;
            return (
              <motion.button
                key={t.id}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border font-medium text-sm cursor-pointer backdrop-blur-md transition-colors ${
                  theme === t.id
                    ? 'border-[var(--accent)] shadow-[0_0_24px_var(--accent-glow)]'
                    : 'border-[var(--card-border)]'
                }`}
                style={{
                  background: theme === t.id ? 'var(--accent)' : 'var(--btn-outline-bg)',
                  color: theme === t.id ? 'white' : 'var(--text-primary)',
                }}
                onClick={() => setTheme(t.id)}
                title={t.name}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <Icon size={18} strokeWidth={2} />
                <span>{t.name}</span>
              </motion.button>
            );
          })}
        </motion.div>
      </motion.header>

      <motion.main
        className="w-full max-w-md flex flex-col gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        custom={0.2}
      >
        <motion.section
          className="rounded-2xl p-7 border backdrop-blur-xl shadow-[var(--card-shadow)] hover:shadow-xl transition-shadow duration-300"
          style={{
            background: 'var(--card-bg)',
            borderColor: 'var(--card-border)',
          }}
          variants={itemVariants}
        >
          <label
            htmlFor="qr-input"
            className="block text-sm font-semibold mb-2.5 tracking-wide"
            style={{ color: 'var(--text-secondary)' }}
          >
            URL or text
          </label>
          <input
            id="qr-input"
            type="text"
            className="w-full px-5 py-4 rounded-xl border text-base font-medium transition-all duration-300 focus:outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-glow)]"
            style={{
              background: 'var(--input-bg)',
              borderColor: 'var(--input-border)',
              color: 'var(--text-primary)',
            }}
            placeholder="https://example.com or any text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </motion.section>

        <motion.section
          className="rounded-2xl p-7 border backdrop-blur-xl flex flex-col items-center gap-6 shadow-[var(--card-shadow)] hover:shadow-xl transition-shadow duration-300"
          style={{
            background: 'var(--card-bg)',
            borderColor: 'var(--card-border)',
          }}
          variants={itemVariants}
        >
          <motion.div
            ref={qrRef}
            className="flex items-center justify-center p-6 bg-white rounded-2xl h-[256px] w-[256px] shrink-0 overflow-hidden shadow-lg hover:shadow-[0_8px_32px_var(--accent-glow)] transition-shadow duration-300"
            layout
          >
            <AnimatePresence mode="wait">
              {value.trim() ? (
                <motion.div
                  key="qr"
                  className="flex items-center justify-center"
                  style={{
                    transform: `scale(${256 / size})`,
                    transformOrigin: 'center',
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <QRCodeSVG
                    value={value.trim()}
                    size={size}
                    level={level}
                    fgColor={fgColor}
                    bgColor={bgColor}
                    imageSettings={imageSettings}
                    includeMargin
                    className="rounded-lg block"
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  className="flex flex-col items-center justify-center gap-4 min-h-[200px]"
                  style={{ color: 'var(--text-secondary)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <QrCode size={48} strokeWidth={1.5} className="opacity-50" />
                  <p className="text-base">Enter URL or text above</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <div className="w-full flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <label
                htmlFor="size-slider"
                className="block text-sm font-semibold tracking-wide shrink-0"
                style={{ color: 'var(--text-secondary)' }}
              >
                Size
              </label>
              <input
                id="size-slider"
                type="range"
                min="128"
                max="512"
                step="32"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
              />
              <span
                className="text-sm font-semibold min-w-[48px]"
                style={{ color: 'var(--accent)' }}
              >
                {size}px
              </span>
            </div>

            <div>
              <label
                className="block text-sm font-semibold mb-2 tracking-wide"
                style={{ color: 'var(--text-secondary)' }}
              >
                Error correction
              </label>
              <div className="flex gap-2 flex-wrap">
                {ERROR_LEVELS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setLevel(opt.value)}
                    className={`px-4 py-2.5 rounded-xl border font-medium text-sm transition-colors ${
                      level === opt.value
                        ? 'border-[var(--accent)] shadow-[0_0_12px_var(--accent-glow)]'
                        : ''
                    }`}
                style={{
                  background: level === opt.value ? 'var(--accent)' : 'var(--btn-outline-bg)',
                  color: level === opt.value ? 'white' : 'var(--text-primary)',
                  borderColor: level === opt.value ? 'var(--accent)' : 'var(--input-border)',
                }}
                  >
                    {opt.value}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                className="block text-sm font-semibold mb-2 tracking-wide"
                style={{ color: 'var(--text-secondary)' }}
              >
                Custom colors
              </label>
              <div className="flex gap-3">
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={customFg || themeColors.fg}
                    onChange={(e) => setCustomFg(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
                    title="Foreground color"
                  />
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Foreground
                  </span>
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={customBg || themeColors.bg}
                    onChange={(e) => setCustomBg(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
                    title="Background color"
                  />
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Background
                  </span>
                </div>
                {(customFg || customBg) && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomFg('');
                      setCustomBg('');
                    }}
                    className="text-sm font-medium underline"
                    style={{ color: 'var(--accent)' }}
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            <div>
              <label
                className="block text-sm font-semibold mb-2 tracking-wide"
                style={{ color: 'var(--text-secondary)' }}
              >
                Logo (optional)
              </label>
              <div className="flex gap-2">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border font-medium text-sm"
                  style={{
                    background: 'var(--btn-outline-bg)',
                    borderColor: 'var(--input-border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <FileImage size={18} />
                  {logoUrl ? 'Change logo' : 'Add logo'}
                </button>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="px-4 py-2.5 rounded-xl font-medium text-sm underline"
                    style={{ color: 'var(--accent)' }}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <motion.button
                className="flex-1 flex items-center justify-center gap-2 py-4 px-4 rounded-xl font-semibold text-base cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border"
                style={{
                  background: 'var(--btn-outline-bg)',
                  borderColor: 'var(--input-border)',
                  color: 'var(--text-primary)',
                }}
                onClick={handleDownloadPng}
                disabled={!value.trim()}
                whileHover={value.trim() ? { y: -2, scale: 1.01 } : {}}
                whileTap={value.trim() ? { scale: 0.99 } : {}}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <Download size={18} strokeWidth={2.5} />
                PNG
              </motion.button>
              <motion.button
                className="flex-1 flex items-center justify-center gap-2 py-4 px-4 rounded-xl font-semibold text-base cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border"
                style={{
                  background: 'var(--btn-outline-bg)',
                  borderColor: 'var(--input-border)',
                  color: 'var(--text-primary)',
                }}
                onClick={handleDownloadSvg}
                disabled={!value.trim()}
                whileHover={value.trim() ? { y: -2, scale: 1.01 } : {}}
                whileTap={value.trim() ? { scale: 0.99 } : {}}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <Download size={18} strokeWidth={2.5} />
                SVG
              </motion.button>
              <motion.button
                className="flex items-center justify-center gap-2 py-4 px-5 rounded-xl border font-semibold text-base cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'var(--btn-outline-bg)',
                  borderColor: 'var(--input-border)',
                  color: 'var(--text-primary)',
                }}
                onClick={handleCopy}
                disabled={!value.trim()}
                whileHover={value.trim() ? { y: -2, scale: 1.01 } : {}}
                whileTap={value.trim() ? { scale: 0.99 } : {}}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <Copy size={18} strokeWidth={2.5} />
              </motion.button>
            </div>
          </div>
        </motion.section>
      </motion.main>
    </div>
  );
}

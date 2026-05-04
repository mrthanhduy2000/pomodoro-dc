/**
 * Settings.jsx — Cài Đặt
 */

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import useSettingsStore from '../store/settingsStore';
import useGameStore from '../store/gameStore';
import ExportImport from './ExportImport';
import { PRESTIGE_EP_REQUIREMENT } from '../engine/constants';

function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(() => window.matchMedia('(display-mode: standalone)').matches);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setDeferredPrompt(null);
  };

  return { canInstall: !!deferredPrompt, isInstalled, install };
}

const AMBIENT_OPTIONS = [
  { value: 'none', label: 'Tắt', short: 'OFF', icon: '🔇' },
  { value: 'rain', label: 'Mưa', short: 'RAIN', icon: '🌧️' },
  { value: 'wind', label: 'Gió', short: 'WIND', icon: '🌬️' },
  { value: 'forest', label: 'Rừng', short: 'FOREST', icon: '🌿' },
  { value: 'coffee', label: 'Cà phê', short: 'CAFE', icon: '☕' },
  { value: 'waves', label: 'Sóng biển', short: 'WAVES', icon: '🌊' },
  { value: 'fireplace', label: 'Lò sưởi', short: 'FIRE', icon: '🔥' },
];

const SOUND_PACK_OPTIONS = [
  { value: 'classic', label: 'Cổ điển', short: 'CL', icon: '🎺' },
  { value: 'nature', label: 'Tự nhiên', short: 'NT', icon: '🌿' },
  { value: 'synthwave', label: 'Tổng hợp', short: 'SW', icon: '🎛️' },
  { value: 'minimal', label: 'Tối giản', short: 'MN', icon: '🔕' },
];

const THEME_MODE_OPTIONS = [
  { value: 'auto', label: 'Theo kỷ nguyên', note: 'Đi theo bối cảnh hiện tại' },
  { value: 'dark', label: 'Tối hoàn toàn', note: 'Giữ nền tối ở mọi nơi' },
];

const UI_THEME_OPTIONS = [
  { value: 'light', label: 'Biên tập', note: 'Giấy ngà, nhiều khoảng thở' },
  { value: 'dark', label: 'Mực', note: 'Nền tối trung tính, vẫn giữ nhịp tối giản' },
];

const DAILY_GOAL_TYPE_OPTIONS = [
  {
    value: 'sessions',
    label: 'Phiên',
    note: 'Tính mục tiêu ngày bằng số phiên hoàn tất.',
  },
  {
    value: 'minutes',
    label: 'Phút',
    note: 'Tính mục tiêu ngày bằng tổng phút tập trung.',
  },
];

function paperCardStyle(lightTheme) {
  if (!lightTheme) {
    return {
      background: 'var(--card-bg, rgba(24,21,17,0.92))',
      border: '1px solid rgba(255,255,255,0.06)',
      boxShadow: '0 14px 34px rgba(0, 0, 0, 0.18)',
    };
  }

  return {
    background: 'rgba(255, 255, 255, 0.84)',
    border: '1px solid rgba(31, 30, 29, 0.08)',
    boxShadow: '0 14px 32px rgba(31, 30, 29, 0.05)',
  };
}

function choiceStyle(active, lightTheme) {
  if (!lightTheme) {
    return active
      ? {
          background: 'rgba(var(--accent-rgb), 0.16)',
          border: '1px solid rgba(var(--accent-rgb), 0.38)',
          color: 'var(--accent-light)',
        }
      : {
          background: 'var(--item-bg, rgba(31, 27, 22, 0.82))',
          border: '1px solid rgba(255,255,255,0.05)',
          color: 'var(--muted)',
        };
  }

  return active
    ? {
        background: 'rgba(201, 100, 66, 0.10)',
        border: '1px solid rgba(201, 100, 66, 0.22)',
        color: '#1f1e1d',
        boxShadow: '0 8px 18px rgba(31, 30, 29, 0.04)',
      }
    : {
        background: 'rgba(255, 255, 255, 0.74)',
        border: '1px solid rgba(31, 30, 29, 0.08)',
        color: '#6a6862',
      };
}

export default function Settings() {
  const {
    soundEnabled,
    setSoundEnabled,
    masterVolume,
    setMasterVolume,
    ambientSound,
    setAmbientSound,
    ambientVolume,
    setAmbientVolume,
    notificationsEnabled,
    setNotificationsEnabled,
    notificationPermission,
    requestNotificationPermission,
    themeMode,
    setThemeMode,
    uiTheme,
    setUiTheme,
    soundPack,
    setSoundPack,
    shortBreakDuration,
    setShortBreakDuration,
    longBreakDuration,
    setLongBreakDuration,
    longBreakAfterN,
    setLongBreakAfterN,
    dailyGoalType,
    setDailyGoalType,
    dailyGoalSessions,
    setDailyGoalSessions,
    dailyGoalMinutes,
    setDailyGoalMinutes,
    autoStartNext,
    setAutoStartNext,
    autoStartBreak,
    setAutoStartBreak,
    disableBreak,
    setDisableBreak,
  } = useSettingsStore();

  const _devResetGame = useGameStore((s) => s._devResetGame);
  const openPrestigeModal = useGameStore((s) => s.openPrestigeModal);
  const totalEP = useGameStore((s) => s.progress.totalEP);
  const prestigeCount = useGameStore((s) => s.prestige.count);

  const [resetConfirm, setResetConfirm] = useState(false);
  const { canInstall, isInstalled, install } = usePWAInstall();
  const lightTheme = uiTheme === 'light';
  const activeAmbient = AMBIENT_OPTIONS.find((opt) => opt.value === ambientSound) ?? AMBIENT_OPTIONS[0];
  const activeSoundPack = SOUND_PACK_OPTIONS.find((opt) => opt.value === soundPack) ?? SOUND_PACK_OPTIONS[0];
  const activeThemeLabel = UI_THEME_OPTIONS.find((opt) => opt.value === uiTheme)?.label ?? uiTheme;

  const handleReset = () => {
    if (resetConfirm) {
      _devResetGame();
      setResetConfirm(false);
      return;
    }
    setResetConfirm(true);
    setTimeout(() => setResetConfirm(false), 4000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5 pb-6">
      <div className="rounded-[30px] px-5 py-5" style={paperCardStyle(lightTheme)}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p
              className="mono text-[11px] font-semibold uppercase tracking-[0.3em]"
              style={lightTheme ? { color: '#9a5a48' } : { color: 'rgba(var(--accent-rgb), 0.8)' }}
            >
              Tùy chỉnh
            </p>
            <h2
              className="serif mt-2 text-3xl leading-tight md:text-[2.5rem]"
              style={lightTheme ? { color: '#1f1e1d' } : { color: 'var(--ink)' }}
            >
              Cài đặt trải nghiệm tập trung
            </h2>
            <p
              className="mt-2 max-w-xl text-sm leading-relaxed"
              style={lightTheme ? { color: '#6a6862' } : { color: 'var(--muted)' }}
            >
              Điều chỉnh nhịp nghỉ, âm thanh và cách hiển thị để khu vực làm việc giữ được cảm giác yên, rõ và dùng lâu không mệt.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {[`Giao diện ${activeThemeLabel}`, `Nền ${activeAmbient.label}`, `Gói âm ${activeSoundPack.label}`].map((item) => (
              <span
                key={item}
                className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em]"
                style={lightTheme ? {
                  background: 'rgba(201, 100, 66, 0.08)',
                  border: '1px solid rgba(201, 100, 66, 0.18)',
                  color: '#9a5a48',
                } : {
                  background: 'rgba(var(--accent-rgb), 0.14)',
                  border: '1px solid rgba(var(--accent-rgb), 0.24)',
                  color: 'var(--accent-light)',
                }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card lightTheme={lightTheme} className="md:col-span-2">
          <SectionHeader
            lightTheme={lightTheme}
            eyebrow="Rhythm"
            icon="⏱️"
            title="Bộ hẹn giờ"
            description="Nhịp làm việc, khoảng nghỉ và cách app tự chuyển trạng thái."
          />

          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <NumberStepper
                lightTheme={lightTheme}
                label="Giải lao ngắn"
                sub="phút"
                value={shortBreakDuration}
                min={1}
                max={60}
                onChange={setShortBreakDuration}
                disabled={disableBreak}
              />
              <NumberStepper
                lightTheme={lightTheme}
                label="Giải lao dài"
                sub="phút"
                value={longBreakDuration}
                min={1}
                max={90}
                onChange={setLongBreakDuration}
                disabled={disableBreak}
              />
            </div>

            <NumberStepper
              lightTheme={lightTheme}
              label="Giải lao dài sau"
              sub={`mỗi ${longBreakAfterN} phiên`}
              value={longBreakAfterN}
              min={1}
              max={10}
              onChange={setLongBreakAfterN}
              disabled={disableBreak}
              wide
            />

            <Divider lightTheme={lightTheme} />

            <div>
              <p className="mono mb-2 text-[11px] font-semibold uppercase tracking-[0.22em]" style={lightTheme ? { color: '#9a5a48' } : { color: 'rgba(var(--accent-rgb), 0.8)' }}>
                Mục tiêu ngày
              </p>

              <div className="grid gap-2 sm:grid-cols-2">
                {DAILY_GOAL_TYPE_OPTIONS.map((opt) => {
                  const active = dailyGoalType === opt.value;
                  return (
                    <motion.button
                      key={opt.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setDailyGoalType(opt.value)}
                      className="rounded-2xl px-3 py-3 text-left transition-all"
                      style={choiceStyle(active, lightTheme)}
                    >
                      <p className="text-sm font-semibold">{opt.label}</p>
                      <p className="mt-1 text-[11px]" style={lightTheme ? { color: '#6a6862' } : { color: 'var(--muted-2)' }}>
                        {opt.note}
                      </p>
                    </motion.button>
                  );
                })}
              </div>

              <div className="mt-3">
                <NumberStepper
                  lightTheme={lightTheme}
                  label={dailyGoalType === 'sessions' ? 'Mục tiêu theo phiên' : 'Mục tiêu theo phút'}
                  sub={dailyGoalType === 'sessions' ? 'phiên' : 'phút'}
                  value={dailyGoalType === 'sessions' ? dailyGoalSessions : dailyGoalMinutes}
                  min={dailyGoalType === 'sessions' ? 1 : 15}
                  max={dailyGoalType === 'sessions' ? 20 : 600}
                  step={dailyGoalType === 'sessions' ? 1 : 5}
                  onChange={dailyGoalType === 'sessions' ? setDailyGoalSessions : setDailyGoalMinutes}
                />
              </div>

              <p className="mt-2 text-[11px] leading-relaxed" style={lightTheme ? { color: '#6a6862' } : { color: 'var(--muted-2)' }}>
                Phần mở đầu ở tab tập trung sẽ tính số còn lại theo lựa chọn này.
              </p>
            </div>

            <Divider lightTheme={lightTheme} />

            <ToggleRow
              lightTheme={lightTheme}
              label="Tự động bắt đầu giải lao"
              description="Vào nghỉ ngay khi một phiên tập trung kết thúc."
              value={autoStartBreak}
              onChange={setAutoStartBreak}
              disabled={disableBreak}
            />
            <ToggleRow
              lightTheme={lightTheme}
              label="Tự động bắt đầu Pomodoro kế"
              description="Khởi động phiên mới sau khi nghỉ xong."
              value={autoStartNext}
              onChange={setAutoStartNext}
              disabled={disableBreak}
            />

            <Divider lightTheme={lightTheme} />

            <ToggleRow
              lightTheme={lightTheme}
              label="Vô hiệu hóa giải lao"
              description="Bỏ qua toàn bộ thời gian nghỉ để chạy mạch tập trung liên tục."
              value={disableBreak}
              onChange={setDisableBreak}
            />
          </div>
        </Card>

        <Card lightTheme={lightTheme}>
          <SectionHeader
            lightTheme={lightTheme}
            eyebrow="Atmosphere"
            icon="🌿"
            title="Âm nền tập trung"
            description="Chọn một không khí nền vừa đủ hiện diện, không lấn vào phần chữ và nhịp đếm."
          />

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {AMBIENT_OPTIONS.map((opt) => {
              const active = ambientSound === opt.value;
              return (
                <motion.button
                  key={opt.value}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setAmbientSound(opt.value)}
                  className="rounded-2xl px-3 py-3 text-left transition-all"
                  style={choiceStyle(active, lightTheme)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="mono text-[11px] font-semibold uppercase tracking-[0.16em]" style={lightTheme ? { color: active ? '#9a5a48' : '#6a6862' } : { color: active ? 'var(--accent-light)' : 'var(--muted)' }}>
                      {opt.short}
                    </span>
                    {active && (
                      <span className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={lightTheme ? { color: '#9a5a48' } : { color: 'var(--accent-light)' }}>
                        bật
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs font-semibold">{opt.label}</p>
                </motion.button>
              );
            })}
          </div>

          {ambientSound !== 'none' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs" style={lightTheme ? { color: '#6a6862' } : { color: 'var(--muted)' }}>Âm lượng nền</span>
                <span className="mono text-xs" style={lightTheme ? { color: '#1f1e1d' } : { color: 'var(--ink)' }}>{Math.round(ambientVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={ambientVolume}
                onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                className="mt-2 w-full"
                style={{ accentColor: lightTheme ? '#c96442' : 'var(--accent)' }}
              />
              <p className="mt-2 text-[11px] leading-relaxed" style={lightTheme ? { color: '#6a6862' } : { color: 'var(--muted-2)' }}>
                Âm nền chạy suốt phiên, nên tôi giữ điều khiển ngắn và tránh mọi lớp hiệu ứng gây xao lãng.
              </p>
            </motion.div>
          )}
        </Card>

        <Card lightTheme={lightTheme}>
          <SectionHeader
            lightTheme={lightTheme}
            eyebrow="Signals"
            icon="🔊"
            title="Âm thanh hệ thống"
            description="Tiếng báo bắt đầu, đếm ngược cuối phiên và tín hiệu hoàn tất."
          />

          <div className="mt-4 space-y-3">
            <ToggleRow
              lightTheme={lightTheme}
              label="Hiệu ứng âm thanh"
              description="Hoàn thành bộ đếm, mở rương, lên cấp."
              value={soundEnabled}
              onChange={setSoundEnabled}
            />

            <AnimatePresence>
              {soundEnabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={lightTheme ? { color: '#6a6862' } : { color: 'var(--muted)' }}>Âm lượng chính</span>
                      <span className="mono text-xs" style={lightTheme ? { color: '#1f1e1d' } : { color: 'var(--ink)' }}>{Math.round(masterVolume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={masterVolume}
                      onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                      className="mt-2 w-full"
                      style={{ accentColor: lightTheme ? '#c96442' : 'var(--accent)' }}
                    />
                  </div>
                  <div
                    className="rounded-2xl px-3 py-3"
                    style={lightTheme ? {
                      background: 'rgba(250, 249, 246, 0.94)',
                      border: '1px solid rgba(31, 30, 29, 0.08)',
                    } : {
                      background: 'var(--item-bg, rgba(31, 27, 22, 0.82))',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <p className="text-xs font-semibold" style={lightTheme ? { color: '#1f1e1d' } : { color: 'var(--ink-2)' }}>Âm thanh Pomodoro</p>
                    <p className="mt-1 text-[11px] leading-relaxed" style={lightTheme ? { color: '#6a6862' } : { color: 'var(--muted-2)' }}>
                      Trong lúc tập trung, trò chơi chỉ phát tiếng khi bắt đầu phiên, trong 10 giây cuối và khi phiên kết thúc.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>

        <Card lightTheme={lightTheme}>
          <SectionHeader
            lightTheme={lightTheme}
            eyebrow="Pack"
            icon="🎵"
            title="Gói âm thanh"
            description="Mỗi pack đổi chất liệu tiếng báo, không đổi bố cục hay nhịp vận hành."
          />

          <div className="mt-4 grid grid-cols-2 gap-2">
            {SOUND_PACK_OPTIONS.map((opt) => {
              const active = soundPack === opt.value;
              return (
                <motion.button
                  key={opt.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSoundPack(opt.value)}
                  className="flex items-center gap-2.5 rounded-2xl px-3 py-3 text-sm font-medium transition-all"
                  style={choiceStyle(active, lightTheme)}
                >
                  <span className="mono text-[11px] font-semibold uppercase tracking-[0.18em]" style={lightTheme ? { color: active ? '#9a5a48' : '#6a6862' } : { color: active ? 'var(--accent-light)' : 'var(--muted)' }}>
                    {opt.short}
                  </span>
                  <span>{opt.label}</span>
                </motion.button>
              );
            })}
          </div>
        </Card>

        <Card lightTheme={lightTheme}>
          <SectionHeader
            lightTheme={lightTheme}
            eyebrow="Alerts"
            icon="🔔"
            title="Thông báo"
            description="Tín hiệu ngoài tab khi một phiên vừa kết thúc hoặc đã tới lúc quay lại."
          />

          <div className="mt-4">
            {notificationPermission === 'unsupported' ? (
              <p className="text-sm" style={lightTheme ? { color: '#6a6862' } : { color: 'var(--muted-2)' }}>
                Trình duyệt hiện tại không hỗ trợ thông báo.
              </p>
            ) : notificationPermission === 'denied' ? (
              <p className="text-sm" style={lightTheme ? { color: '#9f4a3e' } : { color: '#f87171' }}>
                Thông báo đang bị chặn trong cài đặt trình duyệt.
              </p>
            ) : (
              <>
                {notificationPermission === 'default' && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={requestNotificationPermission}
                    className="w-full rounded-2xl py-3 text-sm font-semibold"
                    style={lightTheme ? {
                      background: '#c96442',
                      color: '#fffdf9',
                      boxShadow: '0 12px 28px rgba(201, 100, 66, 0.18)',
                    } : {
                      background: 'rgba(var(--accent-rgb), 0.88)',
                      color: 'var(--ink)',
                      boxShadow: '0 10px 22px rgba(var(--accent-rgb), 0.18)',
                    }}
                  >
                    Bật thông báo trình duyệt
                  </motion.button>
                )}
                {notificationPermission === 'granted' && (
                  <ToggleRow
                    lightTheme={lightTheme}
                    label="Thông báo khi hết giờ"
                    description="Kể cả khi tab đang ở nền."
                    value={notificationsEnabled}
                    onChange={setNotificationsEnabled}
                  />
                )}
              </>
            )}
          </div>
        </Card>

        <Card lightTheme={lightTheme}>
          <SectionHeader
            lightTheme={lightTheme}
            eyebrow="Surface"
            icon="🎨"
            title="Giao diện"
            description="Chọn bề mặt nền và chủ đề UI. Bản sáng editorial vẫn là cấu hình hợp nhất với shell hiện tại."
          />

          <div className="mt-4 space-y-4">
            <div>
              <p className="mono mb-2 text-[11px] font-semibold uppercase tracking-[0.22em]" style={lightTheme ? { color: '#9a5a48' } : { color: 'rgba(var(--accent-rgb), 0.8)' }}>
                Không khí nền
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {THEME_MODE_OPTIONS.map((opt) => {
                  const active = themeMode === opt.value;
                  return (
                    <motion.button
                      key={opt.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setThemeMode(opt.value)}
                      className="rounded-2xl px-3 py-3 text-left transition-all"
                      style={choiceStyle(active, lightTheme)}
                    >
                      <p className="text-sm font-semibold">{opt.label}</p>
                      <p className="mt-1 text-[11px]" style={lightTheme ? { color: '#6a6862' } : { color: 'var(--muted-2)' }}>{opt.note}</p>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mono mb-2 text-[11px] font-semibold uppercase tracking-[0.22em]" style={lightTheme ? { color: '#9a5a48' } : { color: 'rgba(var(--accent-rgb), 0.8)' }}>
                Chủ đề UI
              </p>
              <div className="grid gap-2">
                {UI_THEME_OPTIONS.map((opt) => {
                  const active = uiTheme === opt.value;
                  return (
                    <motion.button
                      key={opt.value}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setUiTheme(opt.value)}
                      className="flex items-start justify-between gap-3 rounded-2xl px-3 py-3 text-left transition-all"
                      style={choiceStyle(active, lightTheme)}
                    >
                      <div>
                        <p className="text-sm font-semibold">{opt.label}</p>
                        <p className="mt-1 text-[11px]" style={lightTheme ? { color: '#6a6862' } : { color: 'var(--muted-2)' }}>{opt.note}</p>
                      </div>
                      {active && (
                        <span
                          className="mono rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]"
                          style={lightTheme ? {
                            background: 'rgba(255, 255, 255, 0.72)',
                            color: '#9a5a48',
                            border: '1px solid rgba(201, 100, 66, 0.18)',
                          } : {
                            background: 'rgba(255,255,255,0.08)',
                            color: 'var(--ink)',
                            border: '1px solid rgba(255,255,255,0.12)',
                          }}
                        >
                          đang dùng
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        <Card lightTheme={lightTheme}>
          <SectionHeader
            lightTheme={lightTheme}
            eyebrow="Archive"
            icon="💾"
            title="Dữ liệu"
            description="Xuất, nhập và sao lưu toàn bộ hành trình ngay trong trình duyệt."
          />
          <div className="mt-4">
            <ExportImport />
          </div>
        </Card>

        {totalEP >= PRESTIGE_EP_REQUIREMENT && (
          <Card lightTheme={lightTheme} className="md:col-span-2">
            <SectionHeader
              lightTheme={lightTheme}
              eyebrow="Cycle"
              icon="⭐"
              title="New Game+"
              description="Bắt đầu một vòng mới với chỉ số nền tốt hơn sau khi chạm ngưỡng EP yêu cầu."
            />
            <p className="my-3 text-sm leading-relaxed" style={lightTheme ? { color: '#6a6862' } : { color: 'var(--muted)' }}>
              Đạt {PRESTIGE_EP_REQUIREMENT.toLocaleString()} EP. Bắt đầu lại với +5% chỉ số vĩnh viễn.
              {prestigeCount > 0 && ` (Lần ${prestigeCount + 1})`}
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={openPrestigeModal}
              className="w-full rounded-2xl py-3 text-sm font-semibold"
              style={lightTheme ? {
                background: '#c96442',
                color: '#fffdf9',
                boxShadow: '0 10px 22px rgba(201, 100, 66, 0.16)',
              } : {
                background: 'rgba(var(--accent-rgb), 0.88)',
                color: 'var(--ink)',
                boxShadow: '0 10px 22px rgba(var(--accent-rgb), 0.18)',
              }}
            >
              Mở phiên Prestige
            </motion.button>
          </Card>
        )}

        {(canInstall || isInstalled) && (
          <Card lightTheme={lightTheme}>
            <SectionHeader
              lightTheme={lightTheme}
              eyebrow="Install"
              icon="📱"
              title="Cài đặt app"
              description="Đưa DC Pomodoro lên thiết bị để mở nhanh và chạy như một ứng dụng riêng."
            />
            <div className="mt-4">
              {isInstalled ? (
                <p className="text-sm" style={lightTheme ? { color: '#6f7b62' } : { color: 'var(--good)' }}>
                  DC Pomodoro đã được cài đặt trên thiết bị này.
                </p>
              ) : (
                <>
                  <p className="mb-3 text-sm leading-relaxed" style={lightTheme ? { color: '#6a6862' } : { color: 'var(--muted)' }}>
                    Cài lên màn hình chính để mở nhanh và dùng như một cửa sổ app riêng.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={install}
                    className="w-full rounded-2xl py-3 text-sm font-semibold"
                    style={lightTheme ? {
                      background: '#1f1e1d',
                      color: '#faf9f6',
                    } : {
                      background: 'rgba(var(--accent-rgb), 0.88)',
                      color: 'var(--ink)',
                      boxShadow: '0 10px 22px rgba(var(--accent-rgb), 0.18)',
                    }}
                  >
                    Cài đặt lên thiết bị
                  </motion.button>
                </>
              )}
            </div>
          </Card>
        )}

        <Card lightTheme={lightTheme}>
          <SectionHeader
            lightTheme={lightTheme}
            eyebrow="About"
            icon="ℹ️"
            title="Giới thiệu"
            description="Tóm tắt sản phẩm và phạm vi lưu trữ hiện tại."
          />
          <div className="mt-4 space-y-1 text-sm">
            <p style={lightTheme ? { color: '#1f1e1d' } : { color: 'var(--ink)' }}>
              <span className="font-semibold">DC Pomodoro</span> — Pomodoro nhập vai
            </p>
            <p style={lightTheme ? { color: '#6a6862' } : { color: 'var(--muted-2)' }}>
              Hành trình qua 15 kỷ nguyên. Dữ liệu đang được lưu cục bộ trong trình duyệt.
            </p>
          </div>
        </Card>

        <Card lightTheme={lightTheme} className="md:col-span-2">
          <SectionHeader
            lightTheme={lightTheme}
            eyebrow="Reset"
            icon="⚠️"
            title="Vùng nguy hiểm"
            description="Xóa vĩnh viễn toàn bộ tiến trình. Không có thao tác hoàn tác."
          />
          <p className="my-3 text-sm" style={lightTheme ? { color: '#6a6862' } : { color: 'var(--muted)' }}>
            Chỉ dùng khi bạn thực sự muốn bắt đầu lại từ đầu.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleReset}
            className={`w-full rounded-2xl py-3 text-sm font-semibold transition-all ${resetConfirm ? 'animate-pulse' : ''}`}
            style={resetConfirm ? (
              lightTheme ? {
                background: '#9f4a3e',
                color: '#fffdf9',
                boxShadow: '0 14px 30px rgba(159, 74, 62, 0.22)',
              } : {
                background: 'rgba(159, 74, 62, 0.92)',
                color: '#fff8f4',
                boxShadow: '0 10px 22px rgba(159, 74, 62, 0.18)',
              }
            ) : (
              lightTheme ? {
                background: 'rgba(159, 74, 62, 0.08)',
                color: '#9f4a3e',
                border: '1px solid rgba(159, 74, 62, 0.18)',
              } : {
                background: 'rgba(127,29,29,0.2)',
                color: '#f87171',
                border: '1px solid rgba(239,68,68,0.2)',
              }
            )}
          >
            {resetConfirm ? 'Nhấn lần nữa để xác nhận' : 'Đặt lại toàn bộ dữ liệu'}
          </motion.button>
        </Card>
      </div>
    </div>
  );
}

function Card({ children, lightTheme = false, className = '' }) {
  return (
    <div className={`rounded-[28px] p-5 ${className}`} style={paperCardStyle(lightTheme)}>
      {children}
    </div>
  );
}

function SectionHeader({ icon, title, description, eyebrow, lightTheme = false }) {
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className="mono text-[11px] font-semibold uppercase tracking-[0.28em]"
            style={lightTheme ? { color: '#9a5a48' } : { color: 'rgba(var(--accent-rgb), 0.8)' }}
          >
            {eyebrow}
          </p>
          <h3 className="mt-2 text-[18px] font-semibold leading-tight" style={lightTheme ? { color: '#1f1e1d' } : { color: 'var(--ink)' }}>
            {title}
          </h3>
        </div>
        <span
          className="flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-[10px] font-semibold uppercase tracking-[0.18em]"
          style={lightTheme ? {
            background: 'rgba(201, 100, 66, 0.08)',
            border: '1px solid rgba(201, 100, 66, 0.18)',
            color: '#9a5a48',
          } : {
            background: 'rgba(var(--accent-rgb), 0.12)',
            border: '1px solid rgba(var(--accent-rgb), 0.18)',
            color: 'var(--accent-light)',
          }}
        >
          {eyebrow.slice(0, 2)}
        </span>
      </div>
      {description && (
        <p className="mt-2 max-w-xl text-xs leading-relaxed" style={lightTheme ? { color: '#6a6862' } : { color: 'var(--muted-2)' }}>
          {description}
        </p>
      )}
    </div>
  );
}

function Divider({ lightTheme = false }) {
  return (
    <div
      className="h-px"
      style={lightTheme
        ? { background: 'rgba(31, 30, 29, 0.08)' }
        : { background: 'rgba(255,255,255,0.06)' }}
    />
  );
}

function ToggleRow({ label, description, value, onChange, compact = false, disabled = false, lightTheme = false }) {
  return (
    <div className={`flex items-center justify-between gap-3 ${compact ? '' : ''} ${disabled ? 'pointer-events-none opacity-40' : ''}`}>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-tight" style={lightTheme ? { color: '#1f1e1d' } : { color: 'var(--ink-2)' }}>
          {label}
        </p>
        {description && (
          <p className="mt-0.5 text-[11px]" style={lightTheme ? { color: '#6a6862' } : { color: 'var(--muted-2)' }}>
            {description}
          </p>
        )}
      </div>
      <button
        role="switch"
        aria-checked={value}
        onClick={() => !disabled && onChange(!value)}
        className="relative h-6 w-11 flex-shrink-0 rounded-full transition-colors"
        style={lightTheme ? {
          background: value ? '#c96442' : 'rgba(31, 30, 29, 0.12)',
          border: value ? '1px solid rgba(201, 100, 66, 0.5)' : '1px solid rgba(31, 30, 29, 0.08)',
        } : {
          background: value ? 'var(--accent)' : 'var(--toggle-off-bg, rgba(58, 52, 46, 0.96))',
          border: value ? '1px solid rgba(var(--accent-rgb), 0.5)' : '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <motion.span
          animate={{ x: value ? 26 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute left-0 top-1 h-4 w-4 rounded-full shadow"
          style={{ background: value ? '#fffdf9' : (lightTheme ? '#faf9f6' : 'var(--muted)') }}
        />
      </button>
    </div>
  );
}

function NumberStepper({ label, sub, value, min, max, onChange, step = 1, disabled = false, wide = false, lightTheme = false }) {
  const [draftValue, setDraftValue] = useState(() => String(value));

  useEffect(() => {
    setDraftValue(String(value));
  }, [value]);

  const commitDraftValue = (rawValue) => {
    const normalized = String(rawValue ?? '').replace(/[^\d]/g, '');
    if (!normalized) {
      setDraftValue(String(value));
      return;
    }

    const nextValue = Math.min(max, Math.max(min, Number.parseInt(normalized, 10)));
    onChange(nextValue);
    setDraftValue(String(nextValue));
  };

  const adjustValue = (delta) => {
    const baseValue = draftValue ? Number.parseInt(draftValue, 10) : value;
    const safeBaseValue = Number.isFinite(baseValue) ? baseValue : value;
    const nextValue = Math.min(max, Math.max(min, safeBaseValue + delta));
    onChange(nextValue);
    setDraftValue(String(nextValue));
  };

  return (
    <div
      className={`rounded-2xl px-3 py-3 ${disabled ? 'opacity-40' : ''} ${wide ? 'col-span-2' : ''}`}
      style={lightTheme ? {
        background: 'rgba(250, 249, 246, 0.92)',
        border: '1px solid rgba(31, 30, 29, 0.08)',
      } : {
        background: 'var(--item-bg-solid, rgba(24, 21, 17, 0.96))',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <p className="mb-1.5 text-[11px]" style={lightTheme ? { color: '#6a6862' } : { color: 'var(--muted-2)' }}>
        {label}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => !disabled && adjustValue(-step)}
          disabled={disabled || value <= min}
          className="flex h-8 w-8 items-center justify-center rounded-xl text-base font-bold transition-colors disabled:opacity-30"
          style={lightTheme ? {
            background: 'rgba(255, 255, 255, 0.86)',
            border: '1px solid rgba(31, 30, 29, 0.08)',
            color: '#6a6862',
          } : {
            background: 'var(--item-btn-bg, rgba(31, 27, 22, 0.96))',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'var(--muted)',
          }}
        >
          −
        </button>
        <div className="flex flex-1 items-end justify-center gap-1 text-center">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={draftValue}
            disabled={disabled}
            aria-label={sub ? `${label} (${sub})` : label}
            onChange={(e) => setDraftValue(e.target.value.replace(/[^\d]/g, ''))}
            onFocus={(e) => e.currentTarget.select()}
            onBlur={(e) => commitDraftValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
                return;
              }

              if (e.key === 'Escape') {
                setDraftValue(String(value));
                e.currentTarget.blur();
                return;
              }

              if (e.key === 'ArrowUp') {
                e.preventDefault();
                adjustValue(step);
                return;
              }

              if (e.key === 'ArrowDown') {
                e.preventDefault();
                adjustValue(-step);
              }
            }}
            className="mono min-w-0 bg-transparent text-center text-lg font-bold leading-none outline-none"
            style={{
              width: `${Math.max(3, draftValue.length || String(value).length)}ch`,
              color: lightTheme ? '#1f1e1d' : 'var(--ink)',
            }}
          />
          {sub && (
            <span className="ml-1 text-[10px]" style={lightTheme ? { color: '#6a6862' } : { color: 'var(--muted-2)' }}>
              {sub}
            </span>
          )}
        </div>
        <button
          onClick={() => !disabled && adjustValue(step)}
          disabled={disabled || value >= max}
          className="flex h-8 w-8 items-center justify-center rounded-xl text-base font-bold transition-colors disabled:opacity-30"
          style={lightTheme ? {
            background: 'rgba(255, 255, 255, 0.86)',
            border: '1px solid rgba(31, 30, 29, 0.08)',
            color: '#6a6862',
          } : {
            background: 'var(--item-btn-bg, rgba(31, 27, 22, 0.96))',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'var(--muted)',
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}

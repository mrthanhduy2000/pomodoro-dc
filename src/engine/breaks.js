/**
 * break helpers
 * Pure helpers to keep break duration logic consistent across the UI and timer.
 */

export const QUICK_FOCUS_PRESETS = [
  {
    id: 'starter-15',
    label: 'Khởi động',
    description: 'Vào việc nhanh',
    focusMinutes: 15,
    shortBreakDuration: 3,
    longBreakDuration: 12,
    longBreakAfterN: 4,
  },
  {
    id: 'classic-25',
    label: 'Chuẩn',
    description: 'Nhịp hằng ngày',
    focusMinutes: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakAfterN: 4,
  },
  {
    id: 'balanced-52',
    label: 'Sâu',
    description: 'Một khối dài',
    focusMinutes: 52,
    shortBreakDuration: 17,
    longBreakDuration: 30,
    longBreakAfterN: 4,
  },
  {
    id: 'deep-90',
    label: 'Rất sâu',
    description: 'Dự án nặng',
    focusMinutes: 90,
    shortBreakDuration: 20,
    longBreakDuration: 45,
    longBreakAfterN: 4,
  },
];

export const DEFAULT_QUICK_FOCUS_PRESET = QUICK_FOCUS_PRESETS.find(
  (preset) => preset.id === 'classic-25',
);

export const FLOWTIME_BREAK_RULES = [
  { id: 'under-25', label: '< 25 phút', maxWorkMinutes: 25, breakMinutes: 5 },
  { id: '25-50', label: '25 - 50 phút', maxWorkMinutes: 50, breakMinutes: 8 },
  { id: '50-90', label: '50 - 90 phút', maxWorkMinutes: 90, breakMinutes: 17 },
  { id: 'over-90', label: '> 90 phút', maxWorkMinutes: Number.POSITIVE_INFINITY, breakMinutes: 20 },
];

export function getFlowtimeBreakMinutes(workedMinutes = 0) {
  const safeWorkedMinutes = Math.max(0, Number.isFinite(workedMinutes) ? workedMinutes : 0);
  if (safeWorkedMinutes < 25) return 5;
  if (safeWorkedMinutes <= 50) return 8;
  if (safeWorkedMinutes <= 90) return 17;
  return 20;
}

export function getBreakPlan({
  mode = 'pomodoro',
  workedMinutes = 0,
  sessionsCompleted = 0,
  longBreakCycleStart = 0,
  shortBreakDuration = 5,
  longBreakDuration = 15,
  longBreakAfterN = 4,
  extraBreakMinutes = 0,
  justCompletedSession = false,
}) {
  const extraMinutes = Math.max(0, extraBreakMinutes);

  if (mode === 'stopwatch') {
    return {
      durationMinutes: getFlowtimeBreakMinutes(workedMinutes) + extraMinutes,
      isLong: false,
    };
  }

  const cycleSessions = sessionsCompleted - longBreakCycleStart;
  const completedSessions = justCompletedSession ? cycleSessions + 1 : cycleSessions;
  const isLong = longBreakAfterN > 0
    && completedSessions > 0
    && completedSessions % longBreakAfterN === 0;

  return {
    durationMinutes: (isLong ? longBreakDuration : shortBreakDuration) + extraMinutes,
    isLong,
  };
}

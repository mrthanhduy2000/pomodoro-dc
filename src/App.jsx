import React, { useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { AnimatePresence, motion as Motion, useReducedMotion } from 'framer-motion';
import { useEnterMotion, useSnapMotion } from './lib/motionPresets';
import { initSync } from './lib/syncService';
import { clearTimerLive, updateTimerLive } from './lib/timerLiveService';

import AppErrorBoundary from './components/AppErrorBoundary';
import PomodoroEngine from './components/PomodoroEngine';
import ResourceDisplay from './components/ResourceDisplay';
import RankDisplay from './components/RankDisplay';
import DailyMissions from './components/DailyMissions';
import FocusRail from './components/FocusRail';
import FocusNextAction from './components/FocusNextAction';
import FocusStageCountdown from './components/FocusStageCountdown';
import { getEraStage } from './engine/eraStage';
import { evaluateStreakAtRisk } from './engine/gameMath';
import FocusCoachMobile from './components/FocusCoachMobile';
import NotificationCenter from './components/NotificationCenter';
import { RichTextView } from './components/RichText';
import { useGameLoop } from './hooks/useGameLoop';
import { useCityGrowthMoment } from './hooks/useCityMoment';
import useGameStore from './store/gameStore';
import useInventoryAttention from './hooks/useInventoryAttention';
import useSettingsStore from './store/settingsStore';
import { ERA_METADATA, ERA_THRESHOLDS } from './engine/constants';
import { countSessionsOnDay, getLevelProgress, sumFocusMinutesOnDay } from './engine/gameMath';
import {
  formatVietnamDate,
  formatVietnamTime,
  getVietnamDayOfWeek,
  getVietnamHour,
  localDateStr,
  localWeekMondayStr,
} from './engine/time';
import { createRecoverableLazy } from './utils/runtimeRecovery';

const SkillTree = createRecoverableLazy(() => import('./components/SkillTree.jsx'), 'skill-tree');
const RelicInventory = createRecoverableLazy(() => import('./components/RelicInventory.jsx'), 'relic-inventory');
const BlueprintInventory = createRecoverableLazy(() => import('./components/BlueprintInventory.jsx'), 'blueprint-inventory');
const Achievements = createRecoverableLazy(() => import('./components/Achievements.jsx'), 'achievements');
const StatsDashboard = createRecoverableLazy(() => import('./components/StatsDashboard.jsx'), 'stats-dashboard');
const BuildingWorkshop = createRecoverableLazy(() => import('./components/BuildingWorkshop.jsx'), 'building-workshop');
const CityView = createRecoverableLazy(() => import('./components/CityView.jsx'), 'city-view');
// ⚠️ Lớp nền thành phố ở trang chủ cũng nạp LƯỜI, dù nó nằm ngay màn hình đầu tiên. Nạp tĩnh sẽ
// kéo cả `CityStage` + bộ vẽ 2D + bảng số liệu vào chunk chính (đo được +4,9 KB gzip) và làm chậm
// đúng thứ phải hiện ra trước nhất: cái đồng hồ. Thành phố chỉ là khung cảnh — nó hiện sau vài
// phần trăm giây cũng không sao, mà bấm được nút Bắt đầu ngay thì có sao.
const CityBackdrop = createRecoverableLazy(() => import('./components/city/CityBackdrop.jsx'), 'city-backdrop');
const Settings = createRecoverableLazy(() => import('./components/Settings.jsx'), 'settings');
const LootDropModal = createRecoverableLazy(() => import('./components/LootDropModal.jsx'), 'loot-drop-modal');
const CityGrowthMoment = createRecoverableLazy(() => import('./components/city/CityGrowthMoment.jsx'), 'city-growth-moment');
const FocusCityTease = createRecoverableLazy(() => import('./components/city/FocusCityTease.jsx'), 'focus-city-tease');
const DisasterModal = createRecoverableLazy(() => import('./components/DisasterModal.jsx'), 'disaster-modal');
const EraCrisisModal = createRecoverableLazy(() => import('./components/EraCrisisModal.jsx'), 'era-crisis-modal');
const PrestigeModal = createRecoverableLazy(() => import('./components/PrestigeModal.jsx'), 'prestige-modal');
const LevelUpModal = createRecoverableLazy(() => import('./components/LevelUpModal.jsx'), 'level-up-modal');
const WeeklyReportModal = createRecoverableLazy(() => import('./components/WeeklyReportModal.jsx'), 'weekly-report-modal');
const RewardToastHost = createRecoverableLazy(() => import('./components/RewardToastHost.jsx'), 'reward-toast-host');
const OnboardingOverlay = createRecoverableLazy(() => import('./components/OnboardingOverlay.jsx'), 'onboarding-overlay');

function createBoundaryLogger(scope) {
  return (error, errorInfo) => {
    console.error(`[boundary:${scope}]`, error, errorInfo);
  };
}

function isEditableShortcutTarget(target) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return Boolean(target.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]'));
}

function formatDurationMinutes(minutes) {
  const safeMinutes = Math.max(0, Math.floor(Number(minutes) || 0));
  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;

  if (hours <= 0) {
    return `${safeMinutes} phút`;
  }

  if (remainingMinutes === 0) {
    return `${hours} tiếng`;
  }

  return `${hours} tiếng ${remainingMinutes} phút`;
}

const SIDEBAR_ERROR_LOGGER = createBoundaryLogger('sidebar');
const TOP_RAIL_ERROR_LOGGER = createBoundaryLogger('top-rail');
const FOCUS_PANEL_ERROR_LOGGER = createBoundaryLogger('focus-panel');
const SUPPORT_RAIL_ERROR_LOGGER = createBoundaryLogger('support-rail');
const WORKSPACE_ERROR_LOGGER = createBoundaryLogger('workspace');
const OVERLAYS_ERROR_LOGGER = createBoundaryLogger('overlays');

function Glyph({ size = 16, stroke = 1.6, children, fill = 'none' }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

const AppIcon = {
  focus: (props) => (
    <Glyph {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l2.5 2.5" />
    </Glyph>
  ),
  vault: (props) => (
    <Glyph {...props}>
      <path d="M4 8l8-4 8 4v8l-8 4-8-4z" />
      <path d="M4 8l8 4 8-4" />
      <path d="M12 12v8" />
    </Glyph>
  ),
  stats: (props) => (
    <Glyph {...props}>
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-7" />
      <path d="M22 20H2" />
    </Glyph>
  ),
  city: (props) => (
    <Glyph {...props}>
      <path d="M3 21h18" />
      <path d="M5 21V11l4-3 4 3v10" />
      <path d="M13 21V7l3-2 3 2v14" />
      <path d="M8 14h2M16 11h1" />
    </Glyph>
  ),
  settings: (props) => (
    <Glyph {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </Glyph>
  ),
  report: (props) => (
    <Glyph {...props}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </Glyph>
  ),
  missions: (props) => (
    <Glyph {...props}>
      <path d="M9 11l2 2 4-4" />
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M9 4V2M15 4V2" />
    </Glyph>
  ),
  chevronLeft: (props) => (
    <Glyph {...props}>
      <path d="M14 6l-6 6 6 6" />
    </Glyph>
  ),
  play: (props) => (
    <Glyph {...props} fill="currentColor" stroke="none">
      <path d="M7 5v14l12-7z" />
    </Glyph>
  ),
  calendar: (props) => (
    <Glyph {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </Glyph>
  ),
  spark: (props) => (
    <Glyph {...props}>
      <path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" />
    </Glyph>
  ),
  more: (props) => (
    <Glyph {...props} fill="currentColor" stroke="none">
      <circle cx="5" cy="12" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="19" cy="12" r="1.7" />
    </Glyph>
  ),
};

const DESKTOP_TABS = [
  { id: 'focus', label: 'Tập trung', shortLabel: 'Tập trung', Icon: AppIcon.focus },
  { id: 'inventory', label: 'Hành trang', shortLabel: 'Hành trang', Icon: AppIcon.vault },
  { id: 'city', label: 'Thành Phố', shortLabel: 'Thành Phố', Icon: AppIcon.city },
  { id: 'stats', label: 'Thống kê', shortLabel: 'Thống kê', Icon: AppIcon.stats },
  { id: 'settings', label: 'Cài đặt', shortLabel: 'Cài đặt', Icon: AppIcon.settings },
];

const MOBILE_TABS = [
  { id: 'focus', label: 'Tập trung', shortLabel: 'Tập trung', Icon: AppIcon.focus },
  { id: 'missions', label: 'Nhiệm vụ', shortLabel: 'Nhiệm vụ', Icon: AppIcon.missions },
  { id: 'inventory', label: 'Hành trang', shortLabel: 'Hành trang', Icon: AppIcon.vault },
  { id: 'city', label: 'Thành Phố', shortLabel: 'Thành Phố', Icon: AppIcon.city },
  { id: 'stats', label: 'Thống kê', shortLabel: 'Thống kê', Icon: AppIcon.stats },
  { id: 'settings', label: 'Cài đặt', shortLabel: 'Cài đặt', Icon: AppIcon.settings },
];

// Mobile: 4 tab chính luôn hiện + nút "Thêm" mở các tab phụ → đỡ chật trên iPhone.
//
// ⚠️ ĐỔI 2026-08-27 — ĐỌC TRƯỚC KHI SỬA LẠI. Dòng này trước đây ghi: *"Thành Phố CỐ Ý không nằm
// trong nhóm chính: thanh dưới iPhone giữ đúng 4 nút"*. Lý do ấy vẫn còn nguyên giá trị (bốn nút
// là bốn nút), nhưng TIỀN ĐỀ của nó đã chết: hồi đó điều hướng có 8 mục và riêng Kỹ năng · Kho báu
// · Thành tích đã ăn ba ô, nên phải hy sinh một mục — và Thành Phố là mục bị hy sinh. Nay ba mục
// ấy gộp thành MỘT ("Hành trang") nên ô thứ tư được trả lại đúng cho Thành Phố. Thứ đổi chỗ là
// "Thống kê" — nó đi sang nút "Thêm" cùng "Cài đặt", vì hai mục đó là chỗ để NGỒI ĐỌC chứ không
// phải chỗ bấm vào giữa một phiên.
const MOBILE_PRIMARY_IDS = ['focus', 'missions', 'inventory', 'city'];
const MOBILE_PRIMARY_TABS = MOBILE_TABS.filter((t) => MOBILE_PRIMARY_IDS.includes(t.id));
const MOBILE_SECONDARY_TABS = MOBILE_TABS.filter((t) => !MOBILE_PRIMARY_IDS.includes(t.id));

// Ba màn cũ nay là ba TAB CON của "Hành trang".
//
// ⚠️ GIỮ NGUYÊN ID CŨ (`skills` · `collection` · `achievements`), đừng đổi cho "gọn". Thông báo đã
// LƯU trong localStorage của Đàm vẫn mang `action: { tab: 'skills' }` và `{ tab: 'collection',
// collectionTab: 'workshop' }`; đổi id ở đây thì mỗi thông báo cũ bấm vào sẽ không đi đâu cả, và
// KHÔNG có gì đỏ lên — build xanh, test xanh, chỉ có một nút chết. `resolveTabTarget` bên dưới
// dịch id cũ sang "tab Hành trang + tab con", nên mọi lời gọi `selectTab('skills')` cũ vẫn đúng.
const INVENTORY_TABS = [
  {
    id: 'skills',
    label: 'Kỹ năng',
    subtitle: 'Mở khóa các nhánh tăng trưởng dài hạn và định hình phong cách tập trung.',
  },
  {
    id: 'collection',
    label: 'Kho báu',
    subtitle: 'Theo dõi di vật, bản vẽ và lịch sử phiên dưới cùng một bề mặt điều hướng.',
  },
  {
    id: 'achievements',
    label: 'Thành tích',
    subtitle: 'Nhìn lại các cột mốc đã đạt và khoảng cách tới các biểu tượng kế tiếp.',
  },
];

const INVENTORY_SUB_IDS = INVENTORY_TABS.map((tab) => tab.id);

/** Dịch một id điều hướng (kể cả id cũ đã lưu trong thông báo) sang "tab nào + tab con nào". */
function resolveTabTarget(tab) {
  if (INVENTORY_SUB_IDS.includes(tab)) return { tab: 'inventory', sub: tab };
  return { tab, sub: null };
}

const COLLECTION_TABS = [
  { id: 'relics', label: 'Di vật' },
  { id: 'blueprints', label: 'Bản vẽ' },
  { id: 'workshop', label: 'Xưởng' },
  { id: 'history', label: 'Lịch sử' },
];

const FOCUS_INTRO_COPY = {
  badge: [
    'Hôm nay',
    'Nhịp hôm nay',
    'Tiến độ hôm nay',
    'Lịch hôm nay',
    'Ngày làm việc',
    'Nhịp làm việc',
    'Nhịp tập trung',
    'Mốc hôm nay',
    'Nhịp trong ngày',
    'Tiến trình ngày',
    'Guồng hôm nay',
    'Bản ghi hôm nay',
    'Đường chạy hôm nay',
    'Nhịp hiện tại',
    'Kế hoạch hôm nay',
    'Phiên hôm nay',
    'Mạch hôm nay',
    'Nhịp cá nhân',
    'Guồng trong ngày',
    'Lượt hôm nay',
    'Bản đồ hôm nay',
    'Tâm điểm hôm nay',
    'Đích hôm nay',
    'Nhịp chính hôm nay',
    'Đà hôm nay',
    'Sổ hôm nay',
    'Nếp hôm nay',
    'Cột mốc hôm nay',
    'Nhịp đang chạy',
    'Luồng hôm nay',
    'Bước hôm nay',
    'Nhịp trọng tâm',
    'Quỹ hôm nay',
    'Mốc cá nhân hôm nay',
    'Tổng quan hôm nay',
    'Đà tập trung',
    'Sổ nhịp hôm nay',
    'Khung hôm nay',
    'Nhịp mục tiêu',
    'Bản nhịp hôm nay',
  ],
  promptLead: [
    'Bắt đầu',
    'Mở',
    'Khởi động',
    'Vào guồng với',
    'Tạo đà bằng',
    'Bắt tay vào',
    'Dành',
    'Làm nóng bằng',
    'Mở đầu với',
    'Lấy đà bằng',
    'Vào việc với',
    'Tập trung vào',
    'Bắt đầu với',
    'Dành ra',
    'Thử',
    'Mở ra',
    'Bắt nhịp với',
    'Bắt đầu từ',
    'Làm một',
    'Khởi nhịp bằng',
    'Đi vào với',
    'Dành cho mình',
    'Bắt đầu ngày bằng',
    'Mở đầu ngày bằng',
    'Bắt đầu nhẹ với',
    'Bước vào với',
    'Tạo nhịp với',
  ],
  promptObject: [
    'một phiên sâu',
    'một phiên tập trung',
    'một phiên gọn',
    'một phiên 25 phút',
    'một phiên mới',
    'một lượt tập trung',
    'một phiên ngắn',
    'một phiên chỉn chu',
    'một nhịp làm việc ngắn',
    'một chặng tập trung',
    'một phiên thật gọn',
    'một phiên có mục tiêu rõ',
    'một chặng làm việc gọn',
    'một chặng 25 phút',
    'một phiên tập trung ngắn',
    'một phiên vào guồng',
    'một phiên vào việc',
    'một phiên giữ mạch',
    'một phiên cho việc chính',
    'một phiên có trọng tâm',
    'một chặng ngắn mà chắc',
    'một phiên thật chắc',
    'một phiên rõ việc',
    'một phiên chắc nhịp',
    'một chặng làm việc ngắn',
    'một phiên giữ nhịp',
    'một lượt có trọng tâm',
    'một phiên trọn vẹn',
    'một chặng gọn gàng',
    'một phiên mở đầu',
    'một phiên tập trung vừa đủ',
    'một phiên ngắn mà chắc',
    'một chặng làm việc rõ ràng',
  ],
  promptContinueLead: [
    'Tiếp nhịp với',
    'Nối tiếp bằng',
    'Làm thêm',
    'Giữ guồng với',
    'Đi tiếp với',
    'Bồi thêm bằng',
    'Dồn tiếp bằng',
    'Kéo tiếp với',
    'Nối guồng bằng',
    'Tiếp đà với',
    'Giữ mạch với',
    'Nhích thêm bằng',
    'Thêm tiếp bằng',
    'Làm tiếp với',
    'Chạy tiếp với',
    'Siết tiếp bằng',
    'Gom thêm bằng',
    'Đẩy tiếp với',
    'Giữ trớn với',
    'Tiếp mạch bằng',
    'Nối đà với',
    'Thêm nhịp bằng',
    'Đẩy nhịp với',
    'Làm thêm một',
    'Thử thêm',
    'Nối tiếp với',
    'Tiếp tục bằng',
    'Giữ nhịp bằng',
    'Làm thêm một chút với',
  ],
  promptContinueObject: [
    'một phiên nữa',
    'một lượt tập trung nữa',
    'một phiên gọn nữa',
    'một chặng tiếp theo',
    'một phiên giữ nhịp',
    'một phiên làm việc nữa',
    'một phiên chắc tay',
    'một chặng ngắn nữa',
    'một phiên có trọng tâm',
    'một phiên gọn mà chắc',
    'một phiên tiếp theo',
    'một chặng sâu nữa',
    'một phiên nữa cho hôm nay',
    'một lượt tiếp theo',
    'một phiên tiếp đà',
    'một chặng có chủ đích',
    'một phiên chắc nhịp',
    'một phiên thêm chút đà',
    'một phiên tiếp mạch',
    'một chặng gọn gàng nữa',
    'một phiên vào nhịp nữa',
    'một phiên thêm đà',
    'một chặng nối tiếp',
    'một chặng làm việc gọn nữa',
    'một phiên thêm nhịp',
    'một phiên chắc tay nữa',
    'một phiên tập trung tiếp',
    'một chặng nối nhịp',
    'một phiên làm tiếp',
    'một phiên ngắn nữa',
    'một chặng tiếp nhịp',
    'một phiên rõ việc nữa',
  ],
  promptAfterLead: [
    'Giữ nhịp bằng',
    'Làm thêm',
    'Dành thêm',
    'Đẩy tiếp bằng',
    'Mở thêm',
    'Giữ guồng với',
    'Chốt thêm bằng',
    'Tiếp tục với',
    'Bồi thêm bằng',
    'Nối tiếp bằng',
    'Làm dày bằng',
    'Giữ độ sâu bằng',
    'Giữ đà bằng',
    'Nâng nhịp với',
    'Kéo tiếp bằng',
    'Giữ mạch với',
    'Tiếp guồng bằng',
    'Nối guồng với',
    'Thêm độ sâu bằng',
    'Làm đầy bằng',
    'Tiếp nhịp với',
    'Giữ chắc bằng',
    'Làm gọn thêm bằng',
    'Đi tiếp với',
    'Dồn thêm bằng',
    'Siết thêm bằng',
    'Giữ nếp bằng',
    'Làm thêm một',
    'Dành thêm một',
    'Giữ đà với',
    'Nối tiếp với',
    'Tiếp tục bằng',
    'Thử thêm',
    'Làm thêm nữa với',
    'Giữ chất lượng bằng',
  ],
  promptAfterObject: [
    'một phiên chất lượng',
    'một phiên thật gọn',
    'một phiên sâu',
    'một phiên chỉn chu',
    'một phiên ngắn mà sâu',
    'một phiên tinh gọn',
    'một chặng làm việc chắc',
    'một phiên giữ guồng',
    'một lượt tập trung nữa',
    'một phiên gọn mà chắc',
    'một phiên nhịp tốt',
    'một phiên làm việc sâu',
    'một phiên giữ guồng',
    'một chặng chất lượng',
    'một phiên chắc tay',
    'một phiên sắc gọn',
    'một phiên làm việc gọn',
    'một phiên ngắn mà chắc',
    'một chặng tập trung nữa',
    'một phiên ít xao nhãng',
    'một phiên chắc nhịp',
    'một phiên sâu thêm',
    'một chặng thật gọn',
    'một phiên tiếp đà',
    'một phiên có trọng tâm',
    'một phiên giữ nhịp',
    'một phiên gọn gàng',
    'một chặng giữ đà',
    'một phiên trọn vẹn',
    'một phiên siết tập trung',
    'một phiên làm việc chắc',
    'một chặng tinh gọn',
    'một phiên thêm lực',
    'một phiên đúng việc',
    'một phiên rõ trọng tâm',
    'một phiên ngắn nhưng chắc',
    'một chặng làm việc gọn',
  ],
  progressZeroLead: [
    'Bạn vẫn chưa có',
    'Hôm nay bạn chưa có',
    'Hiện bạn chưa có',
    'Ngày hôm nay chưa có',
    'Bảng hôm nay chưa có',
    'Nhịp hôm nay chưa có',
    'Bạn hiện chưa có',
    'Cho tới lúc này bạn chưa có',
    'Tới giờ bạn chưa có',
    'Trong hôm nay bạn chưa có',
    'Tạm thời bạn chưa có',
    'Từ đầu ngày tới giờ bạn chưa có',
    'Bên trong nhịp hôm nay bạn chưa có',
    'Tới lúc này vẫn chưa có',
    'Ngày này vẫn chưa có',
    'Guồng hôm nay vẫn chưa có',
    'Tới hiện tại bạn vẫn chưa có',
    'Nhịp hiện tại vẫn chưa có',
    'Hôm nay tới giờ chưa có',
    'Bạn chưa kịp có',
    'Trên tiến độ hôm nay chưa có',
    'Bạn còn chưa có',
    'Bạn còn chưa ghi nhận',
    'Ngày này chưa ghi nhận',
    'Tới giờ vẫn chưa có',
    'Trong nhịp hôm nay vẫn chưa có',
    'Tới hiện tại bảng vẫn chưa có',
    'Phần đầu ngày chưa có',
    'Guồng làm việc hôm nay chưa có',
    'Bạn vẫn chưa chạm tới',
    'Trên mốc hôm nay chưa có',
    'Đầu ngày tới giờ chưa có',
  ],
  progressZeroTail: [
    'phiên nào được chốt',
    'phiên nào hoàn tất',
    'phiên nào để ghi nhận',
    'mốc phiên nào',
    'phiên nào vừa xong',
    'phiên nào trên bảng hôm nay',
    'phiên nào trong nhịp hiện tại',
    'lượt nào được hoàn tất',
    'phiên nào để mở nhịp',
    'phiên nào được đánh dấu xong',
    'phiên nào trong guồng hôm nay',
    'phiên nào trên tiến độ hiện tại',
    'lượt nào để tính nhịp',
    'mốc nào được chốt',
    'phiên nào để mở ngày',
    'phiên nào vừa khép lại',
    'chặng nào đã xong',
    'phiên nào để lấy đà',
    'phiên nào để đóng dấu',
    'lượt nào trong ngày',
    'mốc phiên nào cho hôm nay',
    'phiên nào để lên nhịp',
    'phiên nào đủ để tính nhịp',
    'phiên nào khép xong',
    'lượt nào để lấy guồng',
    'phiên nào trên sổ hôm nay',
    'mốc nào cho ngày này',
    'phiên nào được đóng lại',
    'chặng nào để tính tiến độ',
    'phiên nào ở đường chạy hôm nay',
    'lượt nào để mở guồng',
    'phiên nào để gài nhịp',
  ],
  progressSomeLead: [
    'Bạn đã hoàn thành',
    'Bạn đã chốt',
    'Bạn đã ghi nhận',
    'Bạn đã tích lũy',
    'Hiện bạn có',
    'Bạn đang giữ',
    'Bạn đã gom',
    'Bạn đang có',
    'Hôm nay bạn đã có',
    'Tính tới giờ bạn có',
    'Bạn đã đi qua',
    'Bạn đã khép',
    'Bạn đã đưa về',
    'Trên bảng hôm nay bạn có',
    'Trong guồng hôm nay bạn có',
    'Ngày này bạn đã có',
    'Bạn đã đóng được',
    'Bạn đã giữ được',
    'Đến lúc này bạn có',
    'Bạn đã chạm',
    'Bạn đang tích được',
    'Tới hiện tại bạn đã có',
    'Bạn đã điền vào ngày',
    'Bạn đã bỏ túi',
    'Bạn đã nạp vào nhịp',
    'Bạn đã tạo được',
    'Bạn đã kịp có',
    'Bảng hôm nay đang có',
    'Nhịp hiện tại đang có',
    'Bạn đã dựng được',
    'Bạn đã hoàn tất được',
    'Đầu ngày tới giờ bạn có',
  ],
  progressSomeTail: [
    'từ đầu ngày',
    'trong hôm nay',
    'cho tới lúc này',
    'ở thời điểm này',
    'tính đến hiện tại',
    'trên nhịp hôm nay',
    'trong guồng hôm nay',
    'trong mạch hôm nay',
    'trên tiến độ hôm nay',
    'từ đầu buổi',
    'từ sáng tới giờ',
    'trong ngày này',
    'ở nhịp hiện tại',
    'trên guồng hiện tại',
    'kể từ đầu nhịp',
    'đến lúc này',
    'trong lượt hôm nay',
    'trên mốc hôm nay',
    'trong đường chạy hôm nay',
    'ở mạch làm việc hôm nay',
    'suốt từ đầu ngày',
    'trong nhịp đang chạy',
    'trên sổ hôm nay',
    'trên đà hiện tại',
    'trong guồng làm việc',
    'ở mốc đang chạy',
    'từ lúc mở ngày',
    'trên nhịp mục tiêu',
    'trong nhịp của ngày',
    'ở tiến độ này',
    'trong chặng hôm nay',
    'trên bảng hiện tại',
  ],
  remainingLead: [
    'Còn',
    'Thêm',
    'Bạn chỉ còn',
    'Cần thêm',
    'Bạn còn',
    'Chỉ cần thêm',
    'Mục tiêu hôm nay còn',
    'Phần còn lại là',
    'Bạn đang thiếu',
    'Bạn còn đúng',
    'Bạn còn cần',
    'Giờ còn',
    'Chốt thêm',
    'Ráng thêm',
    'Đi tiếp thêm',
    'Bổ sung thêm',
    'Kéo thêm',
    'Bạn vẫn còn',
    'Còn thiếu',
    'Bạn còn vừa đủ',
    'Thêm đúng',
    'Lấp thêm',
    'Giờ bạn còn',
    'Chỉ thiếu',
    'Tiếp thêm',
    'Bù thêm',
    'Gom thêm',
    'Bạn chỉ thiếu',
    'Bạn còn thiếu đúng',
    'Thêm nữa',
    'Đi thêm',
    'Nhích thêm',
  ],
  remainingTail: [
    'để đạt nhịp mục tiêu hôm nay',
    'là đủ nhịp hôm nay',
    'để chạm mốc hôm nay',
    'để khép đủ guồng hôm nay',
    'là tròn nhịp mục tiêu',
    'để đủ đà hôm nay',
    'là xong mốc hôm nay',
    'để chốt nhịp hôm nay',
    'là đủ mạch hôm nay',
    'để về đích nhịp hôm nay',
    'để chốt chỉ tiêu hôm nay',
    'là đầy guồng hôm nay',
    'để khép ngày thật gọn',
    'để đủ lượt hôm nay',
    'là bạn chạm đích hôm nay',
    'để khóa mục tiêu hôm nay',
    'là tròn đường chạy hôm nay',
    'để khép mốc ngày',
    'là đủ tiến độ hôm nay',
    'để đi tới mốc cuối hôm nay',
    'là vừa đẹp cho hôm nay',
    'để đủ số phiên hôm nay',
    'để đủ guồng mục tiêu',
    'là tròn số hôm nay',
    'để chạm mức hôm nay',
    'để đủ nhịp cá nhân hôm nay',
    'là chốt xong chỉ tiêu ngày',
    'để đầy mốc của hôm nay',
    'là vừa tròn mục tiêu ngày',
    'để khép gọn hôm nay',
    'là xong quỹ phiên hôm nay',
    'để đủ chặng hôm nay',
  ],
  completedLead: [
    'Nhịp hôm nay đã đủ,',
    'Mục tiêu hôm nay đã xong,',
    'Bạn đã đủ nhịp hôm nay,',
    'Chỉ tiêu hôm nay đã chạm,',
    'Guồng hôm nay đã đủ,',
    'Bạn đã về đích nhịp hôm nay,',
    'Nhịp mục tiêu đã đủ,',
    'Đủ mốc hôm nay rồi,',
    'Phần số lượng đã xong,',
    'Hôm nay đã đủ phiên,',
    'Ngày hôm nay đã đủ nhịp,',
    'Đà hôm nay đã tới mốc,',
    'Bạn đã khép đủ phần số lượng,',
    'Mốc ngày đã hoàn tất,',
    'Tiến độ hôm nay đã đủ,',
    'Guồng của ngày đã tròn,',
    'Bạn đã chạm đủ số phiên,',
    'Chỉ tiêu ngày đã kín,',
    'Mạch hôm nay đã đủ,',
    'Nhịp chính hôm nay đã xong,',
    'Lượt hôm nay đã đủ mốc,',
    'Bạn đã về đủ đích cho hôm nay,',
    'Ngày này đã chạm mốc,',
    'Bạn đã đi đủ nhịp hôm nay,',
    'Số phiên hôm nay đã đủ,',
    'Mốc tập trung hôm nay đã xong,',
    'Quỹ phiên hôm nay đã kín,',
    'Đường chạy hôm nay đã đủ,',
    'Bạn đã khép đủ nhịp của ngày,',
    'Nhịp cá nhân hôm nay đã đạt,',
    'Mốc chính của hôm nay đã đủ,',
    'Phần nhịp hôm nay đã tròn,',
  ],
  completedTail: [
    'giờ là lúc nâng chất lượng từng phiên',
    'giờ cứ giữ từng phiên thật gọn',
    'giờ ưu tiên độ sâu',
    'giờ tập trung vào độ nét từng phiên',
    'giờ làm ít nhưng chắc',
    'giờ giữ guồng thật đều',
    'giờ chỉ cần từng phiên thật tốt',
    'giờ đẩy chất lượng lên',
    'giờ giữ từng lượt thật sắc',
    'giờ chăm vào từng phiên một',
    'giờ giữ nhịp nhưng làm kỹ hơn',
    'giờ tập trung vào độ chắc của từng lượt',
    'giờ ưu tiên từng phiên có điểm rơi rõ',
    'giờ làm chậm lại nhưng sâu hơn',
    'giờ chọn ít việc nhưng xử lý gọn',
    'giờ giữ sự sắc của từng phiên',
    'giờ dồn vào các phiên có trọng tâm',
    'giờ khóa sự chú ý cho từng lượt',
    'giờ tập trung vào chất hơn lượng',
    'giờ giữ độ gọn trong từng chặng',
    'giờ làm cho mỗi phiên đáng giá hơn',
    'giờ chắt từng phiên cho thật sạch',
    'giờ chỉ việc giữ tay lái thật chắc',
    'giờ ưu tiên những phiên có trọng tâm',
    'giờ làm gọn nhưng dứt điểm hơn',
    'giờ giữ từng chặng thật sáng rõ',
    'giờ chọn việc kỹ hơn cho từng lượt',
    'giờ chăm vào độ chắc thay vì số lượng',
    'giờ giữ đà nhưng bớt phân tán',
    'giờ siết chất lượng ở từng phiên',
    'giờ làm ít việc nhưng chạm sâu hơn',
    'giờ khiến mỗi phiên có sức nặng hơn',
  ],
  minuteProgressZero: [
    'Hôm nay bạn chưa có phút tập trung nào được ghi nhận.',
    'Cho tới lúc này bạn chưa tích được phút tập trung nào.',
    'Ngày hôm nay vẫn chưa ghi nhận phút tập trung nào.',
    'Nhịp hôm nay chưa có phút tập trung nào được chốt.',
    'Bạn vẫn chưa có phút tập trung nào trên bảng hôm nay.',
    'Tạm thời hôm nay chưa có phút tập trung nào được tính.',
    'Tiến độ hôm nay vẫn đang ở 0 phút tập trung.',
    'Hôm nay bạn còn chưa gom được phút tập trung nào.',
    'Chưa có phút tập trung nào được đóng vào hôm nay.',
    'Đầu ngày tới giờ bạn chưa có phút tập trung nào.',
  ],
  minuteProgressSome: [
    'Hôm nay bạn đã có {{countLabel}} tập trung.',
    'Bạn đã ghi nhận {{countLabel}} tập trung trong hôm nay.',
    'Tiến độ hiện tại là {{countLabel}} tập trung.',
    'Cho tới lúc này bạn đã tích được {{countLabel}} tập trung.',
    'Ngày hôm nay đã có {{countLabel}} tập trung được chốt.',
    'Bạn đang giữ {{countLabel}} tập trung trong ngày.',
    'Hiện bạn đã gom {{countLabel}} tập trung.',
    'Nhịp hôm nay đã có {{countLabel}} tập trung.',
    'Bạn đã đưa về {{countLabel}} tập trung từ đầu ngày.',
    'Tới giờ bạn đã có {{countLabel}} tập trung.',
  ],
  minuteRemaining: [
    'Còn {{remainingLabel}} để chạm mục tiêu ngày.',
    'Thêm {{remainingLabel}} nữa là đủ mốc hôm nay.',
    'Bạn còn {{remainingLabel}} để chốt mục tiêu ngày.',
    'Chỉ cần thêm {{remainingLabel}} để đủ nhịp hôm nay.',
    'Mục tiêu hôm nay còn {{remainingLabel}} nữa.',
    'Bạn đang thiếu {{remainingLabel}} để về đích hôm nay.',
    'Phần còn lại là {{remainingLabel}} để khép ngày.',
    'Thêm {{remainingLabel}} là bạn chạm mốc ngày.',
    'Còn đúng {{remainingLabel}} để tròn chỉ tiêu hôm nay.',
    'Nhích thêm {{remainingLabel}} là đủ mục tiêu ngày.',
  ],
  minuteCompleted: [
    'Mục tiêu ngày đã hoàn tất, giờ chỉ cần giữ phần việc quan trọng thật gọn.',
    'Mốc hôm nay đã đủ, giờ ưu tiên những việc đáng làm nhất.',
    'Bạn đã chạm mục tiêu ngày, giờ giữ nhịp thật chắc tay.',
    'Phần thời lượng hôm nay đã xong, giờ tập trung vào chất lượng.',
    'Đủ mục tiêu rồi, phần còn lại là làm gọn và rõ việc.',
    'Nhịp ngày đã đạt, giờ chỉ cần giữ sự tập trung thật sạch.',
    'Mốc thời lượng hôm nay đã kín, giờ chọn đúng việc để làm tiếp.',
    'Bạn đã đủ thời lượng cho hôm nay, giờ giữ từng lượt thật chắc.',
    'Phần số phút đã xong, giờ ưu tiên độ nét của từng phiên.',
    'Hôm nay đã đủ phút tập trung, giờ giữ nhịp mà không dàn trải.',
  ],
  badgeNatural: [
    'Hôm nay',
    'Tiến độ hôm nay',
    'Nhịp hôm nay',
    'Mốc hôm nay',
    'Ngày hôm nay',
    'Phần việc hôm nay',
    'Nhịp tập trung hôm nay',
    'Mục tiêu hôm nay',
  ],
  titleStart: [
    'Bắt đầu một phiên nhé?',
    'Mở một phiên tập trung nhé?',
    'Làm một phiên 25 phút nhé?',
    'Mình bắt đầu từ một phiên ngắn nhé?',
    'Bắt tay vào một phiên đầu tiên nhé?',
    'Mở đầu bằng một phiên gọn nhé?',
    'Vào việc với một phiên ngắn nhé?',
    'Bắt đầu từ việc quan trọng nhất nhé?',
    'Làm một phiên cho vào guồng nhé?',
    'Mở nhịp bằng một phiên trước nhé?',
    'Ngồi vào bàn và bắt đầu nhé?',
    'Thử một phiên tập trung nhé?',
  ],
  titleContinue: [
    'Mình làm tiếp một phiên nhé?',
    'Thêm một phiên nữa nhé?',
    'Giữ nhịp bằng một phiên nữa nhé?',
    'Làm tiếp một phiên ngắn nhé?',
    'Nối thêm một phiên nữa nhé?',
    'Tiếp tục với một phiên nữa nhé?',
    'Giữ guồng bằng một phiên nữa nhé?',
    'Làm thêm một phiên cho tròn nhịp nhé?',
    'Tiếp phần đang dở bằng một phiên nữa nhé?',
    'Thêm một phiên nữa rồi nghỉ nhé?',
    'Làm tiếp cho mạch khỏi đứt nhé?',
    'Đi thêm một phiên nữa nhé?',
  ],
  titleAfter: [
    'Nếu còn sức, làm thêm một phiên nữa nhé?',
    'Giữ nhịp bằng một phiên thật gọn nhé?',
    'Làm thêm một phiên chất lượng nữa nhé?',
    'Thêm một phiên nữa cho mượt guồng nhé?',
    'Làm thêm một phiên ngắn nữa nhé?',
    'Giữ sự tập trung thêm một nhịp nữa nhé?',
    'Nếu muốn đi tiếp, mình làm thêm một phiên nhé?',
    'Làm thêm một phiên nữa cho gọn việc nhé?',
    'Thêm một phiên nữa cho chắc tay nhé?',
    'Giữ đà bằng một phiên nữa nhé?',
  ],
  sessionProgressZero: [
    'Hôm nay bạn chưa có phiên nào.',
    'Hôm nay vẫn chưa có phiên nào được hoàn thành.',
    'Bạn chưa chốt phiên nào trong hôm nay.',
    'Tới lúc này, hôm nay vẫn là 0 phiên.',
    'Ngày hôm nay chưa ghi nhận phiên nào.',
    'Bạn vẫn chưa mở phiên nào trong hôm nay.',
    'Hôm nay chưa có phiên nào được tính.',
    'Nhịp hôm nay vẫn chưa có phiên nào.',
  ],
  sessionProgressSome: [
    'Hôm nay bạn đã hoàn thành {{countLabel}}.',
    'Tính tới lúc này, bạn đã có {{countLabel}}.',
    'Bạn đã đi được {{countLabel}} trong hôm nay.',
    'Nhịp hôm nay đang ở {{countLabel}}.',
    'Hôm nay bạn đã chốt {{countLabel}}.',
    'Bạn đã tích lũy {{countLabel}} từ đầu ngày.',
    'Tới giờ, bạn đã có {{countLabel}}.',
    'Ngày hôm nay đã ghi nhận {{countLabel}}.',
    'Bạn đang có {{countLabel}} trong hôm nay.',
    'Hôm nay bạn đã đi qua {{countLabel}}.',
  ],
  sessionRemaining: [
    'Còn {{remainingLabel}} nữa để đủ mục tiêu hôm nay.',
    'Thêm {{remainingLabel}} là chạm mốc hôm nay.',
    'Bạn còn {{remainingLabel}} nữa là đủ nhịp hôm nay.',
    'Chỉ cần thêm {{remainingLabel}} nữa thôi.',
    'Còn {{remainingLabel}} nữa là xong mục tiêu hôm nay.',
    'Bạn còn thiếu {{remainingLabel}} để đủ mốc hôm nay.',
    'Thêm {{remainingLabel}} nữa là tròn chỉ tiêu hôm nay.',
    'Còn đúng {{remainingLabel}} nữa để khép ngày.',
  ],
  sessionCompleted: [
    'Mục tiêu hôm nay đã đủ. Giờ cứ giữ chất lượng từng phiên.',
    'Hôm nay bạn đã đủ nhịp. Nếu làm tiếp, cứ giữ cho thật gọn.',
    'Mốc hôm nay đã xong. Phần còn lại là làm cho thật chắc.',
    'Hôm nay đã đủ số phiên. Giờ ưu tiên việc quan trọng nhất.',
    'Phần số lượng đã đủ. Giờ chỉ cần giữ độ tập trung.',
    'Mục tiêu hôm nay đã hoàn thành. Giờ cứ làm chậm mà chắc.',
    'Bạn đã chạm mốc hôm nay. Nếu làm thêm, cứ giữ nhịp nhẹ thôi.',
    'Nhịp hôm nay đã tròn. Giờ chỉ cần từng phiên thật sạch.',
  ],
  minuteProgressZeroNatural: [
    'Hôm nay bạn chưa có phút tập trung nào.',
    'Tới lúc này, hôm nay vẫn là 0 phút tập trung.',
    'Ngày hôm nay chưa ghi nhận phút tập trung nào.',
    'Bạn chưa tích lũy phút tập trung nào trong hôm nay.',
    'Hôm nay vẫn chưa có phút tập trung nào được tính.',
    'Bạn chưa gom được phút tập trung nào trong hôm nay.',
    'Nhịp hôm nay vẫn đang ở 0 phút tập trung.',
    'Hôm nay chưa có phút tập trung nào được ghi nhận.',
  ],
  minuteProgressSomeNatural: [
    'Hôm nay bạn đã có {{countLabel}} tập trung.',
    'Tính tới lúc này, bạn đã tích lũy {{countLabel}} tập trung.',
    'Tiến độ hôm nay đang ở {{countLabel}} tập trung.',
    'Bạn đã ghi nhận {{countLabel}} tập trung trong hôm nay.',
    'Ngày hôm nay đã có {{countLabel}} tập trung.',
    'Tới giờ, bạn đã có {{countLabel}} tập trung.',
    'Bạn đang giữ {{countLabel}} tập trung trong hôm nay.',
    'Hôm nay bạn đã tích được {{countLabel}} tập trung.',
  ],
  minuteRemainingNatural: [
    'Còn {{remainingLabel}} nữa để chạm mục tiêu hôm nay.',
    'Thêm {{remainingLabel}} là đủ mốc hôm nay.',
    'Bạn còn {{remainingLabel}} nữa là hoàn thành mục tiêu ngày.',
    'Chỉ cần thêm {{remainingLabel}} nữa thôi.',
    'Còn {{remainingLabel}} nữa là đủ chỉ tiêu hôm nay.',
    'Bạn còn thiếu {{remainingLabel}} để đủ mốc hôm nay.',
    'Thêm {{remainingLabel}} nữa là xong mục tiêu hôm nay.',
    'Còn đúng {{remainingLabel}} nữa để khép ngày.',
  ],
  minuteCompletedNatural: [
    'Mục tiêu hôm nay đã đủ. Giờ chỉ cần giữ sự tập trung cho việc quan trọng nhất.',
    'Phần thời lượng đã xong. Nếu làm tiếp, cứ giữ nhịp thật gọn.',
    'Mốc hôm nay đã đủ. Giờ ưu tiên những việc đáng làm nhất.',
    'Bạn đã chạm mục tiêu ngày. Giờ chỉ cần làm cho thật chắc tay.',
    'Hôm nay đã đủ thời lượng. Phần còn lại là giữ đầu óc thật sạch.',
    'Mục tiêu thời lượng đã hoàn thành. Giờ cứ chọn đúng việc để làm.',
    'Hôm nay đã đủ phút tập trung. Nếu làm tiếp, cứ làm nhẹ mà chắc.',
    'Phần số phút đã xong. Giờ tập trung vào chất lượng từng phiên.',
  ],
  titleSessionRunning: [
    'Cứ giữ nhịp này nhé.',
    'Bạn đang làm rất ổn.',
    'Mình đang đi đúng hướng rồi.',
    'Tiếp tục như vậy nhé.',
    'Phiên này đang vào guồng rồi.',
    'Cứ đi hết nhịp này nhé.',
    'Bạn đang tập trung tốt đấy.',
    'Giữ mạch này thêm chút nữa nhé.',
  ],
  titleSessionPaused: [
    'Mình quay lại nốt phiên này nhé.',
    'Phiên này vẫn đang chờ bạn đó.',
    'Chỉ cần quay lại là bắt được nhịp ngay.',
    'Bạn nghỉ một chút rồi vào lại cũng được.',
    'Phiên này vẫn còn đó, mình quay lại nhé.',
    'Mình chỉ đang dừng giữa chừng thôi, chưa sao cả.',
  ],
  sessionLiveProgressZero: [
    'Phiên hiện tại đang chạy, nên tiến độ hôm nay sẽ được cộng khi bạn hoàn thành nó.',
    'Bạn đã vào phiên rồi. Khi phiên này kết thúc, tiến độ hôm nay sẽ bắt đầu được tính.',
    'Phiên này đang diễn ra, nên phần tiến độ sẽ được cộng sau khi bạn hoàn thành.',
    'Tiến độ hôm nay chưa nhích lên vì phiên hiện tại vẫn chưa kết thúc.',
    'Phiên đang chạy chưa được tính vào hôm nay. Chỉ cần đi hết phiên này là sẽ có mốc đầu tiên.',
  ],
  sessionLiveProgressSome: [
    'Hôm nay bạn đã có {{countLabel}}. Phiên hiện tại vẫn đang diễn ra.',
    'Tính tới lúc này, bạn đã có {{countLabel}}. Phiên này đang chạy tiếp.',
    'Bạn đã đi được {{countLabel}} trong hôm nay. Phiên hiện tại vẫn chưa được cộng vào.',
    'Nhịp hôm nay đang ở {{countLabel}}. Phiên này sẽ được tính khi bạn hoàn thành nó.',
    'Hôm nay bạn đã có {{countLabel}}. Còn phiên hiện tại thì vẫn đang chạy.',
    'Bạn đang có {{countLabel}} trong hôm nay. Phiên này xong thì tiến độ sẽ nhích thêm.',
  ],
  sessionLiveStatusRunning: [
    'Cứ đi hết phiên này nhé. Hoàn thành xong là tiến độ hôm nay sẽ nhích lên.',
    'Bạn đang làm tốt rồi. Cứ giữ nhịp tới hết phiên này nhé.',
    'Chỉ cần đi nốt phiên này thôi là hôm nay sẽ có thêm tiến triển.',
    'Cứ tập trung thêm một chút nữa nhé. Xong phiên này rồi mình tính tiếp.',
    'Phiên này mà khép lại là mốc hôm nay sẽ sáng hơn ngay.',
  ],
  sessionLiveStatusPaused: [
    'Khi sẵn sàng, mình quay lại nốt phiên này nhé.',
    'Phiên này vẫn còn đó. Quay lại một chút là nối được ngay.',
    'Bạn không mất nhịp đâu. Mình quay lại là đi tiếp được.',
    'Chỉ cần quay lại nốt phiên này thôi là tiến độ sẽ chạy tiếp.',
    'Mình nghỉ một chút rồi quay lại cũng hoàn toàn ổn.',
  ],
  sessionLiveStatusDoneRunning: [
    'Mục tiêu hôm nay đã đủ rồi. Giờ cứ thong thả đi hết phiên này nhé.',
    'Bạn đã chạm mốc hôm nay rồi. Phiên này là phần làm thêm rất đẹp.',
    'Hôm nay đã đủ nhịp. Giờ chỉ cần giữ chất lượng tới cuối phiên thôi.',
    'Mốc hôm nay đã xong rồi. Nếu còn tập trung được, mình đi hết phiên này nhé.',
    'Bạn đã làm đủ cho hôm nay rồi. Giờ cứ khép nốt phiên này thật gọn.',
  ],
  sessionLiveStatusDonePaused: [
    'Mục tiêu hôm nay đã đủ rồi. Nếu muốn, mình quay lại nốt phiên này sau cũng được.',
    'Bạn đã chạm mốc hôm nay rồi, nên không cần vội nữa.',
    'Phần mục tiêu đã xong. Phiên đang dừng này không còn tạo áp lực đâu.',
    'Hôm nay đã đủ rồi. Muốn quay lại nốt phiên này lúc nào cũng được.',
    'Bạn đã làm đủ cho hôm nay rồi. Phần còn lại chỉ là phần thưởng thêm thôi.',
  ],
};

function getFocusIntroDayIndex() {
  const [year, month, day] = localDateStr().split('-').map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

function pickDailyVariantParts(dayIndex, banks) {
  let cursor = dayIndex;

  // Mixed-radix selection keeps the full tuple unique for a very long cycle.
  return banks.map((options, slotIndex) => {
    const size = options.length;
    if (!size) return '';

    const digit = cursor % size;
    cursor = Math.floor(cursor / size);
    const offset = ((slotIndex + 1) * 3) % size;
    const index = size > 1 ? (digit * (size - 1) + offset) % size : 0;
    return options[index];
  });
}

function renderFocusIntroCopy(template, values) {
  return template
    .split(/(\{\{countLabel\}\}|\{\{remainingLabel\}\})/g)
    .filter(Boolean)
    .map((part, index) => {
      if (part === '{{countLabel}}') {
        return (
          <strong key={`count-${index}`} className="font-semibold text-[var(--ink)]">
            {values.countLabel}
          </strong>
        );
      }
      if (part === '{{remainingLabel}}') {
        return (
          <strong key={`remaining-${index}`} className="font-semibold text-[var(--ink)]">
            {values.remainingLabel}
          </strong>
        );
      }
      return <React.Fragment key={`text-${index}`}>{part}</React.Fragment>;
    });
}

function formatDailyGoalValue(value, goalType) {
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
  return `${safeValue.toLocaleString()} ${goalType === 'minutes' ? 'phút' : 'phiên'}`;
}

function getLiveSessionIntroCopy({
  greeting,
  weekdayLabel,
  countValue,
  remainingValue,
  isFocusSessionPaused,
  goalType,
}) {
  const dayIndex = getFocusIntroDayIndex();
  const [badge, title] = pickDailyVariantParts(dayIndex, [
    FOCUS_INTRO_COPY.badgeNatural,
    isFocusSessionPaused ? FOCUS_INTRO_COPY.titleSessionPaused : FOCUS_INTRO_COPY.titleSessionRunning,
  ]);

  const countIsZero = countValue <= 0;
  const goalMet = remainingValue <= 0;

  const [progressTemplate, statusTemplate] = pickDailyVariantParts(dayIndex, [
    countIsZero ? FOCUS_INTRO_COPY.sessionLiveProgressZero : FOCUS_INTRO_COPY.sessionLiveProgressSome,
    goalMet
      ? (isFocusSessionPaused ? FOCUS_INTRO_COPY.sessionLiveStatusDonePaused : FOCUS_INTRO_COPY.sessionLiveStatusDoneRunning)
      : (isFocusSessionPaused ? FOCUS_INTRO_COPY.sessionLiveStatusPaused : FOCUS_INTRO_COPY.sessionLiveStatusRunning),
  ]);

  return {
    badgeLabel: `${badge} · ${weekdayLabel}`,
    title: `${greeting}. ${title}`,
    progressTemplate,
    statusTemplate,
    remainingValue,
    goalType,
  };
}

function getMinuteGoalIntroCopy({ greeting, focusMinutesToday, weekdayLabel, dailyGoalMinutes }) {
  const remainingMinutes = Math.max(0, dailyGoalMinutes - focusMinutesToday);
  const dayIndex = getFocusIntroDayIndex();
  const [badge] = pickDailyVariantParts(dayIndex, [FOCUS_INTRO_COPY.badgeNatural]);

  if (remainingMinutes <= 0) {
    const [title, progressTemplate, statusTemplate] = pickDailyVariantParts(dayIndex, [
      FOCUS_INTRO_COPY.titleAfter,
      FOCUS_INTRO_COPY.minuteProgressSomeNatural,
      FOCUS_INTRO_COPY.minuteCompletedNatural,
    ]);
    return {
      badgeLabel: `${badge} · ${weekdayLabel}`,
      title: `${greeting}. ${title}`,
      progressTemplate,
      statusTemplate,
      remainingValue: remainingMinutes,
      goalType: 'minutes',
    };
  }

  if (focusMinutesToday <= 0) {
    const [title, progressTemplate, statusTemplate] = pickDailyVariantParts(dayIndex, [
      FOCUS_INTRO_COPY.titleStart,
      FOCUS_INTRO_COPY.minuteProgressZeroNatural,
      FOCUS_INTRO_COPY.minuteRemainingNatural,
    ]);
    return {
      badgeLabel: `${badge} · ${weekdayLabel}`,
      title: `${greeting}. ${title}`,
      progressTemplate,
      statusTemplate,
      remainingValue: remainingMinutes,
      goalType: 'minutes',
    };
  }

  const [title, progressTemplate, statusTemplate] = pickDailyVariantParts(dayIndex, [
    FOCUS_INTRO_COPY.titleContinue,
    FOCUS_INTRO_COPY.minuteProgressSomeNatural,
    FOCUS_INTRO_COPY.minuteRemainingNatural,
  ]);

  return {
    badgeLabel: `${badge} · ${weekdayLabel}`,
    title: `${greeting}. ${title}`,
    progressTemplate,
    statusTemplate,
    remainingValue: remainingMinutes,
    goalType: 'minutes',
  };
}

function getSessionGoalIntroCopy({ greeting, sessionsCompletedToday, weekdayLabel, dailyGoalSessions }) {
  const remainingSessions = Math.max(0, dailyGoalSessions - sessionsCompletedToday);
  const dayIndex = getFocusIntroDayIndex();
  const [badge] = pickDailyVariantParts(dayIndex, [FOCUS_INTRO_COPY.badgeNatural]);

  if (remainingSessions <= 0) {
    const [title, progressTemplate, statusTemplate] = pickDailyVariantParts(dayIndex, [
      FOCUS_INTRO_COPY.titleAfter,
      FOCUS_INTRO_COPY.sessionProgressSome,
      FOCUS_INTRO_COPY.sessionCompleted,
    ]);

    return {
      badgeLabel: `${badge} · ${weekdayLabel}`,
      title: `${greeting}. ${title}`,
      progressTemplate,
      statusTemplate,
      remainingValue: remainingSessions,
      goalType: 'sessions',
    };
  }

  if (sessionsCompletedToday <= 0) {
    const [title, progressTemplate, statusTemplate] = pickDailyVariantParts(dayIndex, [
      FOCUS_INTRO_COPY.titleStart,
      FOCUS_INTRO_COPY.sessionProgressZero,
      FOCUS_INTRO_COPY.sessionRemaining,
    ]);

    return {
      badgeLabel: `${badge} · ${weekdayLabel}`,
      title: `${greeting}. ${title}`,
      progressTemplate,
      statusTemplate,
      remainingValue: remainingSessions,
      goalType: 'sessions',
    };
  }

  const [title, progressTemplate, statusTemplate] = pickDailyVariantParts(dayIndex, [
    FOCUS_INTRO_COPY.titleContinue,
    FOCUS_INTRO_COPY.sessionProgressSome,
    FOCUS_INTRO_COPY.sessionRemaining,
  ]);

  return {
    badgeLabel: `${badge} · ${weekdayLabel}`,
    title: `${greeting}. ${title}`,
    progressTemplate,
    statusTemplate,
    remainingValue: remainingSessions,
    goalType: 'sessions',
  };
}

function getFocusIntroCopy({
  greeting,
  sessionsCompletedToday,
  focusMinutesToday,
  weekdayLabel,
  dailyGoalType,
  dailyGoalSessions,
  dailyGoalMinutes,
  hasFocusSessionInProgress,
  isFocusSessionPaused,
}) {
  if (hasFocusSessionInProgress) {
    const countValue = dailyGoalType === 'minutes' ? focusMinutesToday : sessionsCompletedToday;
    const remainingValue = Math.max(
      0,
      dailyGoalType === 'minutes'
        ? dailyGoalMinutes - focusMinutesToday
        : dailyGoalSessions - sessionsCompletedToday,
    );

    return getLiveSessionIntroCopy({
      greeting,
      weekdayLabel,
      countValue,
      remainingValue,
      isFocusSessionPaused,
      goalType: dailyGoalType,
    });
  }

  if (dailyGoalType === 'minutes') {
    return getMinuteGoalIntroCopy({
      greeting,
      focusMinutesToday,
      weekdayLabel,
      dailyGoalMinutes,
    });
  }

  return getSessionGoalIntroCopy({
    greeting,
    sessionsCompletedToday,
    weekdayLabel,
    dailyGoalSessions,
  });
}

function getGreeting(hour) {
  if (hour < 5) return 'Chào buổi khuya';
  if (hour < 11) return 'Chào buổi sáng';
  if (hour < 18) return 'Chào buổi chiều';
  if (hour < 23) return 'Chào buổi tối';
  return 'Chào buổi khuya';
}

function getWeekdayLabel() {
  const weekday = getVietnamDayOfWeek();
  const map = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
  return map[weekday] ?? 'Hôm nay';
}

export default function App() {
  useGameLoop();

  const [storesHydrated, setStoresHydrated] = useState(() => (
    useGameStore.persist.hasHydrated() && useSettingsStore.persist.hasHydrated()
  ));
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const hydrateEngines = useSettingsStore((s) => s.hydrateEngines);
  const uiTheme = useSettingsStore((s) => s.uiTheme);
  const uiSkin = useSettingsStore((s) => s.uiSkin);
  const dailyGoalType = useSettingsStore((s) => s.dailyGoalType);
  const dailyGoalSessions = useSettingsStore((s) => s.dailyGoalSessions);
  const dailyGoalMinutes = useSettingsStore((s) => s.dailyGoalMinutes);
  const refreshPushState = useSettingsStore((s) => s.refreshPushState);
  const checkRankChallengeDeadlines = useGameStore((s) => s.checkRankChallengeDeadlines);
  const checkEraCrisisDeadlines = useGameStore((s) => s.checkEraCrisisDeadlines);
  const closeDisasterModal = useGameStore((s) => s.closeDisasterModal);
  const isDisasterModalOpen = useGameStore((s) => s.ui.disasterModalOpen);
  const timerSessionRunning = useGameStore((s) => s.timerSession.isRunning);
  const timerSessionPausedAt = useGameStore((s) => s.timerSession.pausedAt);
  const refreshDailyMissions = useGameStore((s) => s.refreshDailyMissions);
  const openWeeklyReport = useGameStore((s) => s.openWeeklyReport);
  const missionBoundaryRef = useRef({ day: localDateStr(), week: localWeekMondayStr() });

  useEffect(() => {
    const syncHydrationState = () => {
      setStoresHydrated(useGameStore.persist.hasHydrated() && useSettingsStore.persist.hasHydrated());
    };

    syncHydrationState();
    const unsubscribeGameHydration = useGameStore.persist.onFinishHydration(syncHydrationState);
    const unsubscribeSettingsHydration = useSettingsStore.persist.onFinishHydration(syncHydrationState);

    return () => {
      unsubscribeGameHydration?.();
      unsubscribeSettingsHydration?.();
    };
  }, []);

  useEffect(() => {
    if (!storesHydrated) return;

    hydrateEngines();
    void refreshPushState();
    checkRankChallengeDeadlines();
    refreshDailyMissions();
    initSync();
  }, [storesHydrated, hydrateEngines, refreshPushState, checkRankChallengeDeadlines, refreshDailyMissions]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      void refreshPushState();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refreshPushState]);

  useEffect(() => {
    if (!storesHydrated) return;
    if (!timerSessionRunning) checkEraCrisisDeadlines();
  }, [storesHydrated, checkEraCrisisDeadlines, timerSessionRunning]);

  useEffect(() => {
    if (!storesHydrated) return;
    if (timerSessionRunning && isDisasterModalOpen) {
      closeDisasterModal();
    }
  }, [closeDisasterModal, isDisasterModalOpen, storesHydrated, timerSessionRunning]);

  useEffect(() => {
    if (!storesHydrated) return undefined;

    const refreshIfBoundaryChanged = () => {
      const day = localDateStr();
      const week = localWeekMondayStr();
      const boundaryChanged =
        missionBoundaryRef.current.day !== day ||
        missionBoundaryRef.current.week !== week;

      if (!boundaryChanged) return;

      // ⚠️ Sang tuần mới KHÔNG còn tự bật báo cáo tuần (ADR-061) — cái chấm trên mục "Báo cáo
      // tuần" tự sáng vì nó suy ra từ `lastWeeklyReportDate`, không cần ai đi bật.
      missionBoundaryRef.current = { day, week };
      refreshDailyMissions();
    };

    missionBoundaryRef.current = { day: localDateStr(), week: localWeekMondayStr() };

    const reconcileTimeSensitiveState = () => {
      if (!timerSessionRunning) checkEraCrisisDeadlines();
      refreshIfBoundaryChanged();
    };

    const intervalId = window.setInterval(reconcileTimeSensitiveState, 30_000);
    const handleFocus = () => reconcileTimeSensitiveState();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') reconcileTimeSensitiveState();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [storesHydrated, checkEraCrisisDeadlines, refreshDailyMissions, timerSessionRunning]);

  const isOnBreak = useGameStore((s) => s.ui.isOnBreak);
  const breakSecsLeft = useGameStore((s) => s.ui.breakSecondsLeft);
  const breakStartedAt = useGameStore((s) => s.breakSession.startedAt);
  const breakTotalSeconds = useGameStore((s) => s.breakSession.totalSeconds);
  const breakIsRunning = useGameStore((s) => s.breakSession.isRunning);
  const breakLiveWasActiveRef = useRef(false);

  useEffect(() => {
    if (breakIsRunning && breakStartedAt && breakTotalSeconds > 0) {
      updateTimerLive({
        isRunning: true,
        isBreak: true,
        mode: 'break',
        startedAt: new Date(breakStartedAt).toISOString(),
        totalSeconds: breakTotalSeconds,
        pausedSecondsRemaining: null,
      });
      breakLiveWasActiveRef.current = true;
      return;
    }

    if (breakLiveWasActiveRef.current) {
      clearTimerLive({ isBreak: true, mode: 'break', pausedSecondsRemaining: 0, endedReason: 'completed' });
    }
    breakLiveWasActiveRef.current = false;
  }, [breakIsRunning, breakStartedAt, breakTotalSeconds]);

  const activeBook = useGameStore((s) => s.progress.activeBook);
  const totalEP = useGameStore((s) => s.progress.totalEP);
  const totalEXP = useGameStore((s) => s.player.totalEXP);
  const level = useGameStore((s) => s.player.level);
  const dailyTracking = useGameStore((s) => s.dailyTracking);
  const history = useGameStore((s) => s.history);
  const currentStreak = useGameStore((s) => s.streak.currentStreak);
  // Lá Chắn Chuỗi: có kỹ năng VÀ tuần này chưa tiêu. Nó KHÔNG làm hết treo — chỉ đổi hậu quả,
  // nên `evaluateStreakAtRisk` vẫn báo treo, chỉ là câu chữ bớt nặng. Cùng phép tính mà
  // `FocusRail` dùng cho thẻ Chuỗi ở cột phải.
  const hasStreakShield = useGameStore((s) => (
    !!s.player.unlockedSkills?.la_chan_streak && s.streak?.skipShieldUsedWeekKey !== localWeekMondayStr()
  ));
  const lootModalOpen = useGameStore((s) => s.ui.lootModalOpen);
  const disasterModalOpen = useGameStore((s) => s.ui.disasterModalOpen);
  const eraCrisisModalOpen = useGameStore((s) => s.ui.eraCrisisModalOpen);
  const prestigeModalOpen = useGameStore((s) => s.ui.prestigeModalOpen);
  const weeklyReportOpen = useGameStore((s) => s.ui.weeklyReportOpen);
  const weeklyReportPending = useGameStore((s) => s.ui.weeklyReportPending);
  const lastWeeklyReportSeenDate = useGameStore((s) => s.lastWeeklyReportSeenDate);
  // ⚠️ Dùng CHÍNH `localWeekMondayStr` mà store gọi (`getWeekMonday` chỉ là một lớp bọc quanh nó),
  // không tự dựng lại phép tính "thứ Hai của tuần này" — hai công thức cho một luật thì sớm muộn
  // một bên trôi, và triệu chứng ở đây sẽ là cái chấm sáng/tắt lệch một ngày mà chẳng ai truy ra.
  // `history.length > 0` khớp đúng điều kiện của `checkWeeklyReport`: người dùng mới chưa có phiên
  // nào thì bản tổng kết rỗng, chấm vào đó là chỉ vào một trang trắng.
  const weeklyReportUnseen = history.length > 0 && lastWeeklyReportSeenDate !== localWeekMondayStr();
  const levelUpQueueLength = useGameStore((s) => s.ui.levelUpQueue.length);
  const achievementQueueLength = useGameStore((s) => s.ui.achievementQueue.length);
  // Hai kênh phần thưởng nhẹ này store đã ghi từ lâu nhưng TRƯỚC 2026-08-27 không
  // màn hình nào đọc (xem chú thích đầu `engine/rewardFeed.js`) — chồng toast là
  // chỗ đọc đầu tiên, nên chúng phải nằm trong điều kiện dựng lớp phủ.
  const missionCompletedCount = useGameStore((s) => (s.ui.missionCompletedIds ?? []).length);
  const relicPending = useGameStore((s) => Boolean(s.ui.relicNotification));

  const eraMeta = ERA_METADATA[activeBook] ?? ERA_METADATA[1];
  const eraStart = ERA_THRESHOLDS[`ERA_${activeBook - 1}_END`] ?? 0;
  const eraEnd = ERA_THRESHOLDS[`ERA_${activeBook}_END`] ?? ERA_THRESHOLDS.ERA_15_END;
  const eraGap = Math.max(1, eraEnd - eraStart);
  const eraProgress = Math.min(1, Math.max(0, (totalEP - eraStart) / eraGap));
  // ⚠️ THANH TIÊU ĐỀ NAY ĐO **CHẶNG**, KHÔNG ĐO CẢ KỶ. Một kỷ dài 5.600–20.800 EP nên ở nhịp
  // thường một phiên đẩy thanh đúng ~1% và nó đầy một lần mỗi 1–6 THÁNG — tức người chơi không
  // bao giờ nhìn thấy mình đang tiến. Chặng chia quãng ấy làm ba: ~3% mỗi phiên, đầy ba lần mỗi
  // kỷ. `eraProgress` vẫn giữ vì nó là con số ĐÚNG cho câu hỏi "còn bao xa tới kỷ sau", chỉ là
  // nó không phải con số nên đặt ở chỗ liếc mắt.
  const eraStage = getEraStage(activeBook, totalEP);
  const { progressPct: levelPct } = getLevelProgress(totalEXP);

  const [activeTab, setActiveTab] = useState('focus');
  const [inventoryTab, setInventoryTab] = useState('skills');
  const [collectionTab, setCollectionTab] = useState('relics');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [supportRailOpen, setSupportRailOpen] = useState(true);
  const [focusFullscreen, setFocusFullscreen] = useState(false);
  const enterMotion = useEnterMotion();
  // ⚠️ NGOẠI LỆ CÓ LÝ DO — cột phải THU GỌN chứ không XUẤT HIỆN. `enter` là opacity+y nên nó
  // không diễn đạt được một bề ngang đang co lại, và bề ngang ấy do chính `animate` khai (không
  // có lớp CSS nào đặt nó) ⇒ phải dùng `useSnapMotion`: bỏ hẳn thì cột bung ra chiếm cả màn hình.
  const supportRailMotion = useSnapMotion({
    animate: { width: supportRailOpen ? 340 : 60 },
    transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] },
  });
  // Mũi tên chỉ HƯỚNG thu/mở — góc quay chính là trạng thái, nên nó nhảy chứ không biến mất.
  const supportRailChevronMotion = useSnapMotion({
    animate: { rotate: supportRailOpen ? 180 : 0 },
    transition: { duration: 0.2 },
  });
  const leftShiftPressedRef = useRef(false);
  const isDesktop = useMinWidth(1024);
  const isWideViewport = useMinWidth(768);
  const showFocusFullscreen = focusFullscreen && activeTab === 'focus';
  const activeInventoryTab = INVENTORY_TABS.find((tab) => tab.id === inventoryTab) ?? INVENTORY_TABS[0];
  const {
    hasAttention: inventoryNeedsAttention,
    markAchievementsSeen,
    unseenAchievementCount,
  } = useInventoryAttention();
  // Một TẬP chứ không phải một cờ `inventoryNeedsAttention` truyền thẳng: thanh bên và thanh dưới
  // đều chỉ hỏi "mục này có chấm không", nên ngày mai thêm chấm cho một tab khác thì không phải
  // đi mở lại hai component điều hướng.
  //
  // ⚠️ CHẤM "BÁO CÁO TUẦN CHƯA XEM" KHÔNG ĐI QUA TẬP NÀY, và đó là chủ ý: nó đọc
  // `weeklyReportUnseen` (suy từ `lastWeeklyReportSeenDate`) chứ không đọc một id tab. Nhét nó vào
  // đây thì phải đặt cho nó một id giả `'weeklyReport'` — một khoá trông như tab mà không có tab
  // nào tên thế, và `selectTab` sẽ nuốt im lặng nếu có ai lỡ truyền nó đi.
  const attentionTabIds = useMemo(
    () => new Set(inventoryNeedsAttention ? ['inventory'] : []),
    [inventoryNeedsAttention],
  );
  // ⚠️ MỌI đường vào điều hướng phải đi qua đây, kể cả khi nơi gọi truyền id CŨ
  // (`skills`/`collection`/`achievements`) — `resolveTabTarget` dịch chúng thành
  // "tab Hành trang + tab con", nên không nơi gọi nào phải biết chuyện gộp tab đã xảy ra.
  const selectTab = (tab) => {
    const target = resolveTabTarget(tab);
    if (target.sub) setInventoryTab(target.sub);
    setActiveTab(target.tab);
    if (target.tab !== 'focus') {
      setFocusFullscreen(false);
    }
  };

  // Cái chấm tắt khi Đàm ĐÃ XEM, không phải khi anh đi ngang qua: chỉ mở tab con "Thành tích"
  // mới ghi dấu. Mở "Hành trang" rồi ngồi ở "Kỹ năng" thì thành tích mới vẫn còn là chưa xem.
  useEffect(() => {
    if (activeTab !== 'inventory' || inventoryTab !== 'achievements') return;
    markAchievementsSeen();
  }, [activeTab, inventoryTab, markAchievementsSeen, unseenAchievementCount]);

  useEffect(() => {
    if (!focusFullscreen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setFocusFullscreen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusFullscreen]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === 'ShiftLeft') {
        leftShiftPressedRef.current = true;
        return;
      }

      if (event.defaultPrevented || event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      if (!leftShiftPressedRef.current) return;
      if (isEditableShortcutTarget(event.target)) return;

      if (event.code === 'KeyF') {
        if (activeTab !== 'focus') return;
        event.preventDefault();
        setFocusFullscreen((value) => !value);
        return;
      }

      if (event.code !== 'KeyG') return;

      const canToggleSidebar = isWideViewport && !showFocusFullscreen;
      const canToggleSupportRail = isDesktop && activeTab === 'focus' && !showFocusFullscreen;
      if (!canToggleSidebar && !canToggleSupportRail) return;

      event.preventDefault();

      const hasVisibleExpandedPanel = (canToggleSidebar && sidebarOpen) || (canToggleSupportRail && supportRailOpen);

      if (hasVisibleExpandedPanel) {
        if (canToggleSidebar) setSidebarOpen(false);
        if (canToggleSupportRail) setSupportRailOpen(false);
        return;
      }

      if (canToggleSidebar) setSidebarOpen(true);
      if (canToggleSupportRail) setSupportRailOpen(true);
    };

    const handleKeyUp = (event) => {
      if (event.code === 'ShiftLeft') {
        leftShiftPressedRef.current = false;
      }
    };

    const handleBlur = () => {
      leftShiftPressedRef.current = false;
    };

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('blur', handleBlur);
      leftShiftPressedRef.current = false;
    };
  }, [activeTab, isDesktop, isWideViewport, showFocusFullscreen, sidebarOpen, supportRailOpen]);

  const weekdayLabel = getWeekdayLabel();
  const greeting = getGreeting(getVietnamHour());
  const todayKey = localDateStr();
  // ⚠️ Hai con số này dùng chung công thức với vòng MỤC TIÊU NGÀY quanh đồng hồ
  // (`PomodoroEngine.jsx`). Đừng tính lại tại chỗ: hai chỗ cùng nói "hôm nay đi được bao nhiêu"
  // mà lệch nhau thì màn hình tự mâu thuẫn với chính nó, và không có gì đỏ lên.
  const sessionsCompletedToday = countSessionsOnDay(dailyTracking, todayKey);
  // ⚠️ Ô "Chuỗi" xưa nay chỉ hiện một CON SỐ, mà con số không phân biệt được hai tình huống ngược
  // hẳn nhau: "17 ngày, hôm nay xong rồi" và "17 ngày, hết hôm nay không làm là mất sạch". Cái thứ
  // hai là thứ đáng nói nhất trong ngày, và trước 2026-08-29 nó chỉ sống trong AI Coach và trong
  // push lúc 17h — tức chỉ tới được Đàm khi anh KHÔNG mở app.
  const streakRisk = evaluateStreakAtRisk({
    currentStreak,
    sessionsCompletedToday,
    shieldReady: hasStreakShield,
  });
  // ⚠️ PHẢI ĐỨNG SAU `sessionsCompletedToday`. Bản đầu đặt nó ở trên (cạnh `eraStage`, chỗ đọc
  // xuôi hơn) và cả app TRẮNG XOÁ: `const` trong vùng chết tạm thời ném `ReferenceError` ngay
  // lúc render. ESLint KHÔNG bắt (`no-use-before-define` không bật), `npm test` KHÔNG bắt (test
  // đọc mã nguồn, không dựng React), `npm run build` KHÔNG bắt — chỉ ảnh chụp mới thấy.
  const focusMinutesToday = sumFocusMinutesOnDay(history, todayKey);
  const focusHoursToday = formatDurationMinutes(focusMinutesToday);
  const hasFocusSessionInProgress = timerSessionRunning && !isOnBreak;
  const isFocusSessionPaused = hasFocusSessionInProgress && Boolean(timerSessionPausedAt);
  const handleNotificationNavigate = (action) => {
    if (!action) return;
    if (action.collectionTab) {
      setCollectionTab(action.collectionTab);
      selectTab('collection');
    } else if (action.tab) {
      selectTab(action.tab);
    }
  };

  const renderTopRail = () => (
    <AppErrorBoundary
      area="thanh trạng thái"
      description="Top rail gặp lỗi. Nội dung chính vẫn có thể hoạt động độc lập."
      onError={TOP_RAIL_ERROR_LOGGER}
      resetKeys={[activeBook, level, sessionsCompletedToday, focusHoursToday, currentStreak, totalEP, showFocusFullscreen]}
      variant="section"
    >
      <TopRail
        activeBook={activeBook}
        eraLabel={eraMeta.label}
        eraEnd={eraEnd}
        eraProgress={eraProgress}
        eraStage={eraStage}
        streakRisk={streakRisk}
        level={level}
        levelPct={levelPct / 100}
        sessionsCompletedToday={sessionsCompletedToday}
        focusHoursToday={focusHoursToday}
        currentStreak={currentStreak}
        totalEP={totalEP}
        notificationControl={<NotificationCenter onNavigate={handleNotificationNavigate} />}
      />
    </AppErrorBoundary>
  );

  return (
      <div
        className="flex h-screen overflow-hidden text-[var(--ink)]"
        style={{ background: 'var(--app-bg, var(--canvas))' }}
        data-theme={uiSkin === 'inkgold' ? 'dark' : uiTheme}
        data-skin={uiSkin}
      >
        {!showFocusFullscreen && (
          <AppErrorBoundary
            area="thanh điều hướng"
            description="Thanh điều hướng gặp lỗi khi render. Bạn vẫn có thể tải lại ứng dụng nếu lỗi lặp lại."
            onError={SIDEBAR_ERROR_LOGGER}
            resetKeys={[activeTab, sidebarOpen, showFocusFullscreen]}
            variant="section"
          >
            <EditorialSidebar
              activeTab={activeTab}
              attentionTabIds={attentionTabIds}
              isOpen={sidebarOpen}
              onOpenWeeklyReport={openWeeklyReport}
              weeklyReportUnseen={weeklyReportUnseen}
              onSelect={selectTab}
              onToggle={() => setSidebarOpen((value) => !value)}
            />
          </AppErrorBoundary>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          {!showFocusFullscreen && isDesktop && !(activeTab === 'focus' && hasFocusSessionInProgress) && renderTopRail()}

          <main className={`min-h-0 flex-1 ${showFocusFullscreen ? 'overflow-y-auto overscroll-y-contain' : 'overflow-hidden'}`}>
            {showFocusFullscreen ? (
              <AppErrorBoundary
                area="chế độ tập trung toàn màn hình"
                description="Timer toàn màn hình gặp lỗi. Thử render lại khu vực này trước khi tải lại ứng dụng."
                onError={FOCUS_PANEL_ERROR_LOGGER}
                resetKeys={[activeTab, showFocusFullscreen]}
                variant="section"
              >
                <PomodoroEngine
                  fullScreenMode
                  immersiveMode
                  onExitFullScreen={() => setFocusFullscreen(false)}
                />
              </AppErrorBoundary>
            ) : activeTab === 'focus' ? (
              <div className="flex h-full min-h-0">
                {/* ⚠️ Thêm một lớp bọc `relative` chỉ để LỚP NỀN THÀNH PHỐ có chỗ neo. Không đặt lớp
                    nền vào thẳng vùng cuộn bên trong được: nó sẽ cuộn theo nội dung và chỉ phủ được
                    đúng một màn hình đầu, phần dưới trơ ra nền trắng. Neo ở ngoài vùng cuộn thì
                    thành phố đứng yên như một khung cảnh thật phía sau. */}
                <div className="relative min-h-0 min-w-0 flex-1">
                  <Suspense fallback={null}>
                    <CityBackdrop hasFocusSessionInProgress={hasFocusSessionInProgress} />
                  </Suspense>
                  <div className="relative h-full min-h-0 min-w-0 overflow-x-hidden overflow-y-auto scroll-pb-[calc(env(safe-area-inset-bottom)+7.4rem)]">
                    {!isDesktop && !showFocusFullscreen && !hasFocusSessionInProgress && renderTopRail()}
                    <AppErrorBoundary
                      area="trang tập trung"
                      description="Khu vực timer chính gặp lỗi. Các phần khác của app vẫn được giữ lại."
                      onError={FOCUS_PANEL_ERROR_LOGGER}
                      resetKeys={[activeTab, isDesktop, isWideViewport, focusFullscreen]}
                      variant="section"
                    >
                      <div className="mx-auto max-w-[860px] px-5 pb-[calc(env(safe-area-inset-bottom)+7.4rem)] pt-8 md:px-8 md:pb-28 lg:px-12 lg:pb-8 xl:px-16">
                        <FocusIntro
                          greeting={greeting}
                          sessionsCompletedToday={sessionsCompletedToday}
                          focusMinutesToday={focusMinutesToday}
                          weekdayLabel={weekdayLabel}
                          dailyGoalType={dailyGoalType}
                          dailyGoalSessions={dailyGoalSessions}
                          dailyGoalMinutes={dailyGoalMinutes}
                          hasFocusSessionInProgress={hasFocusSessionInProgress}
                          isFocusSessionPaused={isFocusSessionPaused}
                        />
                        {/*
                          Một dòng: phiên này đang đẩy công trình nào tới đâu.
                          ⚠️ ĐẶT NGAY DƯỚI LỜI CHÀO, TRƯỚC đồng hồ — không phải sau. Thẻ đồng hồ
                          cao gần hết màn iPhone, nên bất cứ thứ gì đặt sau nó đều nằm DƯỚI nếp gấp
                          và Đàm sẽ không thấy đúng vào lúc cần thấy. Ảnh chụp khung 390px cho thấy
                          rõ điều đó. Ở đây nó đứng cạnh câu "còn N phiên nữa là đủ nhịp hôm nay" —
                          hai câu cùng trả lời một câu hỏi: bấm Bắt đầu bây giờ thì được gì.
                          ⚠️ Cột GIỮA chứ không phải `FocusRail`: cột phải là `hidden … lg:flex`,
                          tức trên iPhone không bao giờ hiện.
                        */}
                        <Suspense fallback={null}>
                          <FocusCityTease />
                        </Suspense>
                        {/*
                          Dòng thứ hai, ngay dưới dòng "đang xây" — và hai dòng này CỐ Ý đứng cạnh
                          nhau vì chúng trả lời hai nửa của cùng một câu hỏi: dòng trên nói *phiên
                          này đang đẩy cái gì tới đâu*, dòng dưới nói *ngoài việc bấm Bắt đầu thì
                          còn việc gì đang chờ*. Cùng lý do bố cục: cột GIỮA, trên nếp gấp iPhone.
                          Cả hai đều tự IM khi không có gì để nói, nên không có ngày nào màn Tập
                          trung mọc ra hai dòng rỗng.
                        */}
                        {/*
                          ⚠️ ẨN KHI PHIÊN ĐANG CHẠY. Dòng này là một cái NÚT, và nó mời đi sang tab
                          khác — đặt nó giữa màn hình tập trung trong lúc Đàm đang tập trung là mời
                          anh rời khỏi đúng việc anh vừa bấm nút để làm. Soi ảnh lúc đồng hồ đang
                          chạy mới thấy: nó nằm ngay trên đồng hồ, sáng màu nhấn.
                          `FocusCityTease` và `FocusStageCountdown` thì Ở LẠI: chúng nói *phiên này
                          đang đẩy cái gì tới đâu* — tức động lực để NGỒI YÊN, không phải lời mời đi.
                          Cùng luật mà `FocusCoachMobile` đã dùng (`hidden={hasFocusSessionInProgress}`).
                        */}
                        {!hasFocusSessionInProgress && (
                          <FocusNextAction onNavigate={handleNotificationNavigate} />
                        )}
                        {/*
                          Dòng thứ ba của cùng một bộ: "còn ~N phiên nữa tới mốc kế tiếp". Đặt SAU
                          hai dòng kia vì nó nói về đích XA hơn — thứ tự đọc đi từ *phiên này đang
                          đẩy cái gì* → *còn việc gì đang chờ* → *còn bao xa tới mốc*. Cả ba đều tự
                          IM khi không có gì để nói.
                        */}
                        <FocusStageCountdown />
                        <div className="mt-6">
                          <PomodoroEngine
                            immersiveMode={isWideViewport}
                            onEnterFullScreen={() => {
                              selectTab('focus');
                              setFocusFullscreen(true);
                            }}
                          />
                        </div>
                        {/* Thẻ AI Coach gọn cho ĐIỆN THOẠI (cột phải chỉ hiện trên màn rộng).
                            Ẩn khi đang chạy phiên để giữ màn Focus tĩnh. */}
                        <FocusCoachMobile
                          hidden={hasFocusSessionInProgress}
                          sessionsCompletedToday={sessionsCompletedToday}
                          focusMinutesToday={focusMinutesToday}
                          dailyGoalType={dailyGoalType}
                          dailyGoalSessions={dailyGoalSessions}
                          dailyGoalMinutes={dailyGoalMinutes}
                        />
                      </div>
                    </AppErrorBoundary>
                  </div>
                </div>

                <AppErrorBoundary
                  area="cột hỗ trợ bên phải"
                  description="Cột nhiệm vụ và tài nguyên gặp lỗi. Timer chính vẫn tiếp tục hoạt động."
                  onError={SUPPORT_RAIL_ERROR_LOGGER}
                  resetKeys={[activeTab, supportRailOpen, isDesktop]}
                  variant="section"
                >
                  <Motion.aside
                    className="hidden min-h-0 overflow-hidden border-l lg:flex lg:flex-col"
                    style={{ borderColor: 'var(--line)', background: 'var(--canvas)' }}
                    {...supportRailMotion}
                  >
                    <div className="min-h-0 flex-1 overflow-y-auto">
                      {supportRailOpen ? (
                        <div className="space-y-4 p-4">
                          <FocusRail
                            sessionsCompletedToday={sessionsCompletedToday}
                            focusMinutesToday={focusMinutesToday}
                            dailyGoalType={dailyGoalType}
                            dailyGoalSessions={dailyGoalSessions}
                            dailyGoalMinutes={dailyGoalMinutes}
                          />
                          <DailyMissions />
                          <ResourceDisplay />
                          <RankDisplay />
                        </div>
                      ) : (
                        <div className="flex h-full items-center justify-center px-2">
                          <div
                            className="mono whitespace-nowrap text-[10px] font-medium tracking-[0.12em] text-[var(--muted)]"
                            style={{ writingMode: 'vertical-rl', textOrientation: 'upright' }}
                          >
                            Vì cuộc sống thịnh vượng
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="px-2 pb-3 pt-3">
                      <button
                        type="button"
                        onClick={() => setSupportRailOpen((value) => !value)}
                        title={supportRailOpen ? 'Thu gọn cột phải' : 'Mở rộng cột phải'}
                        className={`flex h-[34px] w-full items-center rounded-[8px] text-[12.5px] text-[var(--muted-2)] transition-colors hover:bg-[var(--panel)] ${
                          supportRailOpen ? 'gap-2.5 px-2.5 justify-start' : 'justify-center'
                        }`}
                      >
                        <Motion.span {...supportRailChevronMotion}>
                          <AppIcon.chevronLeft size={15} />
                        </Motion.span>
                        {supportRailOpen && <span>Thu gọn</span>}
                      </button>
                    </div>
                  </Motion.aside>
                </AppErrorBoundary>
              </div>
            ) : (
              <AppErrorBoundary
                area="workspace hiện tại"
                description="Nội dung tab đang mở gặp lỗi. Chuyển tab hoặc thử render lại khu vực này để tiếp tục."
                onError={WORKSPACE_ERROR_LOGGER}
                resetKeys={[activeTab, inventoryTab, collectionTab]}
                variant="section"
              >
                <AnimatePresence mode="wait">
                  {activeTab === 'inventory' && (
                    <TabPane key="inventory">
                      <ShellPane
                        title="Hành trang"
                        subtitle={activeInventoryTab.subtitle}
                        topRail={!isDesktop && !showFocusFullscreen ? renderTopRail() : null}
                      >
                        <InventoryView
                          collectionTab={collectionTab}
                          onChange={setInventoryTab}
                          onCollectionChange={setCollectionTab}
                          sub={inventoryTab}
                        />
                      </ShellPane>
                    </TabPane>
                  )}

                  {activeTab === 'missions' && (
                    <TabPane key="missions">
                      <ShellPane
                        title="Nhiệm vụ"
                        subtitle="Gom toàn bộ nhiệm vụ hôm nay, nhịp tuần, giai đoạn hiện tại và rank vào một workspace riêng để phần tập trung trên mobile gọn hơn."
                        topRail={!isDesktop && !showFocusFullscreen ? renderTopRail() : null}
                      >
                        <div className="space-y-4">
                          <DailyMissions />
                          <ResourceDisplay />
                          <RankDisplay />
                        </div>
                      </ShellPane>
                    </TabPane>
                  )}

                  {activeTab === 'city' && (
                    <TabPane key="city">
                      <ShellPane
                        title="Thành Phố"
                        subtitle="Mỗi công trình đã xây là một căn nhà. Qua kỷ mới, thành phố cũ được niêm phong để ghé thăm lại."
                        topRail={!isDesktop && !showFocusFullscreen ? renderTopRail() : null}
                      >
                        <DeferredTabContent>
                          <CityView />
                        </DeferredTabContent>
                      </ShellPane>
                    </TabPane>
                  )}

                  {activeTab === 'stats' && (
                    <TabPane key="stats">
                      <ShellPane topRail={!isDesktop && !showFocusFullscreen ? renderTopRail() : null}>
                        <DeferredTabContent>
                          <StatsDashboard />
                        </DeferredTabContent>
                      </ShellPane>
                    </TabPane>
                  )}

                  {activeTab === 'settings' && (
                    <TabPane key="settings">
                      <ShellPane
                        title="Cài đặt"
                        subtitle="Âm thanh, nhắc nghỉ, theme và các điều chỉnh hành vi của timer."
                        topRail={!isDesktop && !showFocusFullscreen ? renderTopRail() : null}
                      >
                        <DeferredTabContent>
                          <Settings />
                        </DeferredTabContent>
                      </ShellPane>
                    </TabPane>
                  )}
                </AnimatePresence>
              </AppErrorBoundary>
            )}
          </main>
        </div>

      {!isDesktop && !showFocusFullscreen && (
        <div
          className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex flex-col items-center px-2.5 sm:px-3"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
        >
          {moreMenuOpen && (
            <>
              <div
                className="pointer-events-auto fixed inset-0"
                onClick={() => setMoreMenuOpen(false)}
                aria-hidden="true"
              />
              {/*
                ⚠️ Số cột đọc từ chính danh sách, KHÔNG chốt cứng `grid-cols-3`: nhóm phụ vừa đi
                từ 4 mục xuống 2 (Thống kê · Cài đặt), và một lưới 3 cột cho 2 mục để lại một ô
                trống ngay giữa thanh — không có gì đỏ lên, chỉ trông như hỏng.
              */}
              <Motion.div
                {...enterMotion}
                className="pointer-events-auto relative mb-2 grid w-full max-w-[760px] gap-1 rounded-[22px] border p-1.5 backdrop-blur-xl"
                style={{
                  borderColor: 'var(--line)',
                  background: 'var(--panel-soft)',
                  boxShadow: '0 16px 34px rgba(31,30,29,0.12)',
                  gridTemplateColumns: `repeat(${Math.min(3, Math.max(1, MOBILE_SECONDARY_TABS.length + 1))}, minmax(0, 1fr))`,
                }}
              >
                {MOBILE_SECONDARY_TABS.map((tab) => {
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => { selectTab(tab.id); setMoreMenuOpen(false); }}
                      className="flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-[16px] px-1 py-2 text-[11px] font-medium leading-none transition-colors"
                      style={{
                        color: active ? 'var(--ink)' : 'var(--muted)',
                        background: active ? 'var(--panel-strong)' : 'transparent',
                        border: active ? '1px solid var(--line)' : '1px solid transparent',
                      }}
                    >
                      <tab.Icon size={17} />
                      <span className="truncate">{tab.shortLabel}</span>
                    </button>
                  );
                })}
                {/*
                  ⚠️ MỤC NÀY LÀ ĐIỀU KIỆN AN TOÀN CỦA ADR-061, KHÔNG PHẢI MỘT TIỆN ÍCH THÊM VÀO.
                  Trước nó, iPhone **không có đường nào** mở báo cáo tuần — cái nút duy nhất nằm ở
                  thanh bên desktop (`hidden md:flex`), nên báo cáo chỉ tới được Đàm bằng đúng cái
                  hộp thoại tự bật mà ADR-061 vừa gỡ. Gỡ tự-bật mà không thêm mục này thì trên
                  thiết bị Đàm dùng nhiều nhất, báo cáo tuần biến mất hoàn toàn.
                  Nó là HÀNH ĐỘNG chứ không phải tab, nên nó không nằm trong `MOBILE_SECONDARY_TABS`
                  (mảng ấy nuôi `selectTab`, mà không có tab nào tên `weeklyReport`) — bù lại số cột
                  ở trên phải cộng thêm 1, đúng tinh thần "đọc từ danh sách, không chốt cứng".
                */}
                <button
                  type="button"
                  onClick={() => { openWeeklyReport(); setMoreMenuOpen(false); }}
                  className="flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-[16px] px-1 py-2 text-[11px] font-medium leading-none transition-colors"
                  style={{ color: 'var(--muted)', background: 'transparent', border: '1px solid transparent' }}
                >
                  <span className="relative">
                    <AppIcon.report size={17} />
                    {weeklyReportUnseen && (
                      <span
                        aria-hidden="true"
                        className="absolute -right-1.5 -top-1 h-[6px] w-[6px] rounded-full"
                        style={{ background: 'var(--accent)' }}
                      />
                    )}
                  </span>
                  <span className="truncate">Báo cáo tuần</span>
                </button>
              </Motion.div>
            </>
          )}
          <nav
            className="pointer-events-auto flex w-full max-w-[760px] items-center gap-0.5 rounded-[24px] border p-1 backdrop-blur-xl"
            style={{
              borderColor: 'var(--line)',
              background: 'var(--panel-soft)',
              boxShadow: '0 12px 28px rgba(31,30,29,0.08)',
            }}
          >
            {MOBILE_PRIMARY_TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => { selectTab(tab.id); setMoreMenuOpen(false); }}
                  className="relative flex min-h-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-[16px] px-1 py-1.5 text-[10px] font-medium leading-none transition-colors"
                  style={{
                    color: active ? 'var(--ink)' : 'var(--muted)',
                    background: active ? 'var(--panel-strong)' : 'transparent',
                    border: active ? '1px solid var(--line)' : '1px solid transparent',
                    boxShadow: active ? '0 8px 14px rgba(31,30,29,0.03)' : 'none',
                  }}
                >
                  <span className="relative">
                    <tab.Icon size={15} />
                    {attentionTabIds.has(tab.id) && (
                      // Chấm chú ý nằm ở GÓC ICON; chấm "đang mở" nằm ở đáy nút. Hai chấm nói hai
                      // chuyện khác nhau nên chúng không được ở cùng một chỗ, kể cả khi tab này
                      // vừa đang mở vừa đang có việc.
                      <span
                        aria-hidden="true"
                        className="absolute -right-1.5 -top-1 h-[6px] w-[6px] rounded-full"
                        style={{ background: 'var(--accent)' }}
                      />
                    )}
                  </span>
                  <span className="truncate">{tab.shortLabel}</span>
                  {active && (
                    <span
                      className="absolute bottom-1 h-[3px] w-[3px] rounded-full"
                      style={{ background: 'var(--accent)' }}
                    />
                  )}
                </button>
              );
            })}
            {(() => {
              const secondaryActive = MOBILE_SECONDARY_TABS.some((t) => t.id === activeTab);
              const active = secondaryActive || moreMenuOpen;
              return (
                <button
                  type="button"
                  onClick={() => setMoreMenuOpen((v) => !v)}
                  aria-label="Thêm mục"
                  aria-expanded={moreMenuOpen}
                  className="relative flex min-h-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-[16px] px-1 py-1.5 text-[10px] font-medium leading-none transition-colors"
                  style={{
                    color: active ? 'var(--ink)' : 'var(--muted)',
                    background: active ? 'var(--panel-strong)' : 'transparent',
                    border: active ? '1px solid var(--line)' : '1px solid transparent',
                    boxShadow: active ? '0 8px 14px rgba(31,30,29,0.03)' : 'none',
                  }}
                >
                  <AppIcon.more size={15} />
                  <span className="truncate">Thêm</span>
                  {secondaryActive && (
                    <span
                      className="absolute bottom-1 h-[3px] w-[3px] rounded-full"
                      style={{ background: 'var(--accent)' }}
                    />
                  )}
                </button>
              );
            })()}
          </nav>
        </div>
      )}

      <AppErrorBoundary
        area="lớp thông báo và modal"
        description="Một modal hoặc lớp thông báo vừa gặp lỗi. Giao diện chính vẫn được giữ lại."
        onError={OVERLAYS_ERROR_LOGGER}
        resetKeys={[
          lootModalOpen,
          disasterModalOpen,
          eraCrisisModalOpen,
          prestigeModalOpen,
          weeklyReportOpen,
          weeklyReportPending,
          levelUpQueueLength,
          achievementQueueLength,
          missionCompletedCount,
          relicPending,
        ]}
        variant="section"
      >
        <GlobalOverlays
          lootModalOpen={lootModalOpen}
          disasterModalOpen={disasterModalOpen}
          eraCrisisModalOpen={eraCrisisModalOpen}
          prestigeModalOpen={prestigeModalOpen}
          weeklyReportOpen={weeklyReportOpen}
          weeklyReportPending={weeklyReportPending}
          levelUpQueueLength={levelUpQueueLength}
          achievementQueueLength={achievementQueueLength}
          missionCompletedCount={missionCompletedCount}
          relicPending={relicPending}
          onNavigate={handleNotificationNavigate}
        />
        <Suspense fallback={null}>
          <OnboardingOverlay />
        </Suspense>
      </AppErrorBoundary>
    </div>
  );
}

/**
 * GlobalOverlays — nơi LUẬT MỨC ĐỘ LÀM PHIỀN được thi hành (2026-08-27, ADR-060).
 *
 * ⚠️ CHẶN MÀN HÌNH CHỈ DÀNH CHO BỐN VIỆC, và cả bốn đều buộc Đàm phải QUYẾT ĐỊNH
 * gì đó: lên kỷ · thăng hoa · khủng hoảng kỷ · thảm hoạ. Mọi phần thưởng còn lại
 * đi qua `RewardToastHost` — tự tắt sau 4 giây, bấm vào mới mở chi tiết.
 *
 * ⚠️ CỔNG "LÊN KỶ" ĐỌC `pendingReward.eraChanged`, KHÔNG ĐỌC MỘT CỜ MỚI NÀO. Store
 * vẫn bật `lootModalOpen` ĐỒNG BỘ y như cũ (ba bài test ở `completeFocusSession.test.js`
 * khẳng định điều đó) — ta chỉ đổi phần HIỂN THỊ, đúng điểm cắm mà `RewardSequence`
 * (component đã gộp vào đây) chọn từ trước. Sửa store để hoãn/đổi luồng là cách chắc
 * chắn làm vỡ ba bài đó, và đụng vào đúng hàm dài nhất dự án.
 *
 * ⚠️ `detail` là trạng thái CỤC BỘ, không vào store: nó chỉ sống đúng một lượt xem,
 * không cần đồng bộ lên Supabase, và cho vào store là thêm một trường `ui` nữa mà
 * ngày mai lại có người quên dọn.
 */
function GlobalOverlays(props) {
  const { lootModalOpen } = props;
  // ⚠️ MẸO VÒNG ĐỜI (kế thừa từ `RewardSequence`, component nay đã gộp vào
  // `OverlayStack`), và vì đúng lý do cũ: `detail` ("Đàm đã bấm xem chi tiết") phải trở về `null` khi phần thưởng
  // ĐỔI, nếu không phần thưởng KẾ TIẾP sẽ tự mở hộp thoại mà không ai bấm — tức
  // luật "chỉ bốn việc được chặn màn hình" lặng lẽ hỏng sau đúng một lần bấm.
  // Đặt `key` để React dựng lại thì state tự sạch; một `useEffect` đi dọn state là
  // chỗ để quên dọn, và React cũng cấm gọi `setState` thẳng trong thân effect.
  const levelUpHead = useGameStore((s) => s.ui.levelUpQueue[0]?.newLevel ?? null);
  return (
    <OverlayStack
      key={`${lootModalOpen ? 'loot' : 'none'}:${levelUpHead ?? 'none'}`}
      {...props}
    />
  );
}

function OverlayStack({
  lootModalOpen,
  disasterModalOpen,
  eraCrisisModalOpen,
  prestigeModalOpen,
  weeklyReportOpen,
  weeklyReportPending,
  levelUpQueueLength,
  achievementQueueLength,
  missionCompletedCount,
  relicPending,
  onNavigate,
}) {
  const [detail, setDetail] = useState(null);
  const [momentSeen, setMomentSeen] = useState(false);
  const pendingEraChanged = useGameStore((s) => Boolean(s.ui.pendingReward?.eraChanged));
  const reduceMotion = useReducedMotion();
  const growth = useCityGrowthMoment(lootModalOpen);

  const hasLevelUp = levelUpQueueLength > 0;

  /**
   * ⚠️ KHOẢNH KHẮC THÀNH PHỐ VẪN CHẠY SAU **MỌI** PHIÊN — đừng buộc nó vào hộp thoại.
   * Trước đây nó nằm trong `RewardSequence`, mà `RewardSequence` chỉ dựng khi hộp
   * thoại phần thưởng bật. Nếu cứ để nguyên như thế sau khi hộp thoại thôi tự bật
   * thì lễ mừng "vừa xây xong một công trình" sẽ **biến mất trong im lặng** ở mọi
   * phiên thường — một tính năng chết mà không có gì đỏ lên. Nó không nằm trong bảy
   * đường trao thưởng và cũng không đòi Đàm quyết định gì; nó là một đoạn chuyển
   * cảnh tự kết thúc, nên luật "chỉ bốn việc được chặn màn hình" không áp cho nó.
   * ⚠️ Nhưng nó CÓ che màn hình lúc chạy, nên nó phải nằm trong `blocking` để đồng
   * hồ toast dừng lại — nếu không, 4 giây của thẻ cháy hết sau lưng lễ mừng.
   *
   * `momentSeen` tự sạch nhờ `key` ở `GlobalOverlays` (đổi mỗi lần hộp thoại bật/tắt),
   * đúng mẹo vòng đời `RewardSequence` từng dùng — không cần effect đi dọn state.
   */
  const showMoment = lootModalOpen && !!growth && !momentSeen && !reduceMotion;

  // Hộp thoại phần thưởng mở THẲNG chỉ khi lên kỷ; ngoài ra phải do Đàm bấm vào thẻ.
  // `!showMoment` giữ đúng thứ tự cũ: lễ mừng xong rồi mới tới phần thưởng.
  const showLootModal = lootModalOpen && !showMoment && (pendingEraChanged || detail === 'loot');
  const showLevelModal = hasLevelUp && detail === 'level';

  // ⚠️ NẠP TRƯỚC gói mã của màn phần thưởng ngay khi một phiên vừa xong. Đo bằng máy
  // (bản Phase 4′): không có dòng này thì gói `loot-drop-modal` chỉ bắt đầu tải SAU
  // khi khoảnh khắc kết thúc — trên mạng yếu đó là một khoảng trắng ngay sau 25 phút
  // làm việc thật. Nay nó còn phục vụ thêm một đường nữa: Đàm bấm vào thẻ tổng kết
  // thì hộp thoại phải bật ra ngay, không đợi tải.
  useEffect(() => {
    if (lootModalOpen) LootDropModal.preload?.();
  }, [lootModalOpen]);

  // Mọi thứ đang chặn màn hình. Sáu số hạng, nhưng chỉ BA trong số đó tự bật:
  // lên kỷ (`showLootModal` khi `eraChanged`) · thảm hoạ · khủng hoảng kỷ. Thăng
  // hoa do Đàm bấm ở Cài đặt, còn `detail === 'loot'|'level'` là do Đàm bấm vào thẻ —
  // một hộp thoại Đàm tự mở thì không phải "làm phiền".
  // ⚠️ HẾT NGOẠI LỆ (2026-08-27, đóng `TECH_DEBT #87`). `weeklyReportOpen` từng TỰ bật sáng
  // thứ Hai, tức nó chặn màn hình mà không nằm trong bốn việc được phép. Nay `checkWeeklyReport`
  // chỉ bật một lời MỜI (`weeklyReportPending` → một thẻ toast); cờ này chỉ lên khi Đàm bấm —
  // nút ở thanh bên hoặc chính cái thẻ ấy — nên nó rơi vào đúng câu đã ghi ở trên: "một hộp
  // thoại Đàm tự mở thì không phải làm phiền".
  const blocking = showMoment || showLootModal || disasterModalOpen || eraCrisisModalOpen
    || prestigeModalOpen || weeklyReportOpen || showLevelModal;

  const hasToast = (
    (lootModalOpen && !pendingEraChanged)
    || relicPending
    || hasLevelUp
    || achievementQueueLength > 0
    || missionCompletedCount > 0
    || weeklyReportPending
  );

  if (!blocking && !hasToast) return null;

  return (
    <Suspense fallback={null}>
      {showMoment && (
        <CityGrowthMoment moment={growth.moment} era={growth.era} onDone={() => setMomentSeen(true)} />
      )}
      {showLootModal && <LootDropModal />}
      {disasterModalOpen && <DisasterModal />}
      {eraCrisisModalOpen && <EraCrisisModal />}
      {prestigeModalOpen && <PrestigeModal />}
      {showLevelModal && <LevelUpModal autoDismissMs={0} />}
      {weeklyReportOpen && <WeeklyReportModal />}
      {hasToast && (
        <RewardToastHost
          paused={blocking}
          onNavigate={onNavigate}
          onOpenDetail={setDetail}
        />
      )}
    </Suspense>
  );
}

function EditorialSidebar({ activeTab, attentionTabIds, isOpen, onOpenWeeklyReport, onSelect, onToggle, weeklyReportUnseen = false }) {
  // ⚠️ NGOẠI LỆ CÓ LÝ DO — cùng chuyện với cột phải: cột trái THU GỌN chứ không XUẤT HIỆN, và
  // bề ngang do chính `animate` khai nên phải NHẢY tới đích chứ không được bỏ đi (`useSnapMotion`).
  const railMotion = useSnapMotion({
    animate: { width: isOpen ? 232 : 66 },
    transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] },
  });
  const chevronMotion = useSnapMotion({
    animate: { rotate: isOpen ? 0 : 180 },
    transition: { duration: 0.2 },
  });
  return (
    <Motion.aside
      className="hidden md:flex md:flex-col"
      style={{ background: '#1b1a17', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      {...railMotion}
    >
      {/* Thương hiệu */}
      <div className={`flex items-center gap-2.5 px-3.5 pb-2 pt-4 ${isOpen ? '' : 'justify-center px-0'}`}>
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] text-[15px] font-bold"
          style={{ background: 'var(--accent)', color: '#faf9f6', fontFamily: 'var(--skin-font-display)', boxShadow: '0 4px 12px rgba(var(--accent-rgb),0.4)' }}
        >
          DC
        </span>
        {isOpen && (
          <span className="text-[15px] font-bold uppercase leading-none tracking-[0.08em]" style={{ color: '#faf9f6', fontFamily: 'var(--skin-font-display)' }}>
            Pomodoro
          </span>
        )}
      </div>

      <div className="mx-3 mb-1 mt-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />

      <nav className="mt-1 flex flex-1 flex-col gap-1 px-2.5">
        {DESKTOP_TABS.filter((tab) => tab.id !== 'settings').map((tab) => (
          <SidebarItem
            key={tab.id}
            active={activeTab === tab.id}
            attention={attentionTabIds?.has(tab.id) ?? false}
            icon={<tab.Icon size={18} />}
            isOpen={isOpen}
            label={tab.label}
            onClick={() => onSelect(tab.id)}
          />
        ))}
        <div className="mx-1.5 my-2 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
        <SidebarItem
          active={activeTab === 'settings'}
          icon={<AppIcon.settings size={18} />}
          isOpen={isOpen}
          label="Cài đặt"
          onClick={() => onSelect('settings')}
        />
      </nav>

      <div className="mt-auto flex flex-col gap-1 px-2.5 pb-3 pt-3">
        {/* ⚠️ CHẤM NÀY LÀ LƯỚI AN TOÀN CỦA VIỆC BỎ HỘP THOẠI TỰ BẬT (`TECH_DEBT #87`). Thẻ toast
            sáng thứ Hai tự tắt sau 4 giây và có thể bị lỡ; cái chấm thì ở lại tới khi Đàm mở bản
            tổng kết ra thật. Không có nó thì việc bỏ chặn màn hình đúng là "đổi một phiền toái
            nhỏ lấy một mất mát thật" — và cú bấm ấy mở thẳng bản TUẦN TRƯỚC, xem `openWeeklyReport`. */}
        <SidebarItem
          active={false}
          attention={weeklyReportUnseen}
          icon={<AppIcon.report size={18} />}
          isOpen={isOpen}
          label="Báo cáo tuần"
          onClick={onOpenWeeklyReport}
        />
        <button
          type="button"
          onClick={onToggle}
          className={`flex h-9 items-center rounded-[11px] text-[12.5px] transition-colors hover:bg-[rgba(255,255,255,0.06)] ${
            isOpen ? 'gap-2.5 px-3 justify-start' : 'justify-center'
          }`}
          style={{ color: 'rgba(250,249,246,0.5)' }}
        >
          <Motion.span {...chevronMotion}>
            <AppIcon.chevronLeft size={16} />
          </Motion.span>
          {isOpen && <span>Thu gọn</span>}
        </button>
      </div>
    </Motion.aside>
  );
}

function SidebarItem({ active, attention = false, icon, isOpen, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={!isOpen ? label : undefined}
      className={`group flex items-center rounded-[12px] transition-colors hover:bg-[rgba(255,255,255,0.06)] ${
        isOpen ? 'gap-3 px-1.5 py-1 justify-start' : 'justify-center py-1'
      }`}
    >
      <span
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] transition-colors"
        style={{
          background: active ? 'var(--accent)' : 'transparent',
          color: active ? '#faf9f6' : 'rgba(250,249,246,0.55)',
          boxShadow: active ? '0 4px 12px rgba(var(--accent-rgb),0.4)' : 'none',
        }}
      >
        {icon}
        {attention && (
          // Chấm gắn vào Ô ICON chứ không vào cả nút: thanh bên thu gọn còn 66px thì chỉ ô icon
          // còn lại, gắn vào nút thì chấm trôi ra rìa và biến mất.
          <span
            aria-hidden="true"
            className="absolute right-0.5 top-0.5 h-[7px] w-[7px] rounded-full"
            style={{ background: 'var(--accent)', boxShadow: '0 0 0 2px #1b1a17' }}
          />
        )}
      </span>
      {isOpen && (
        <span
          className="truncate text-[13.5px] font-medium"
          style={{ color: active ? '#faf9f6' : 'rgba(250,249,246,0.62)' }}
        >
          {label}
        </span>
      )}
    </button>
  );
}

function TopRail({
  activeBook,
  eraLabel,
  eraEnd,
  eraProgress,
  eraStage,
  streakRisk,
  level,
  levelPct,
  sessionsCompletedToday,
  focusHoursToday,
  currentStreak,
  totalEP,
  notificationControl,
}) {
  return (
    <header
      className="shrink-0 border-b bg-[var(--canvas)] px-5 py-3 md:px-6"
      style={{ borderColor: 'var(--line)', borderBottomWidth: '2px', borderTop: '3px solid var(--accent)' }}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        {/*
          ⚠️ CẤP CHỈ NÓI MỘT LẦN Ở KHỔ ĐIỆN THOẠI (đổi 2026-08-29). Trước đó cùng một thanh có
          "Kỷ 8 · Cấp 5" bên trái VÀ huy hiệu "Lv 5" bên phải — cùng con số, cách nhau ~250px, lại
          một cái tiếng Việt một cái tiếng Anh. Bỏ khỏi dòng trái (giữ huy hiệu vì nó là điểm nhấn
          thị giác cho một con số tăng rất chậm) và đổi "Lv" sang "Cấp" cho hết jargon.
          ⚠️ Khối `md:block` bên dưới thì GIỮ NGUYÊN "Kỷ · Cấp": ở khổ md huy hiệu này đã ẩn mà
          `LevelDot` thì mãi `xl` mới hiện, nên bỏ ở đó là làm cấp biến mất hẳn trong một dải khổ.
        */}
        <div className="flex items-start justify-between gap-3 md:hidden">
          <div>
            <div className="mono text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">Kỷ {activeBook}</div>
            <div className="mt-1 text-[20px] font-bold leading-none tracking-[-0.03em] text-[var(--ink)]" style={{ fontFamily: 'var(--skin-font-display)' }}>{eraLabel}</div>
          </div>
          <div
            className="rounded-full border px-3 py-1.5"
            style={{
              borderColor: 'var(--line)',
              background: 'var(--panel)',
              boxShadow: '0 10px 18px rgba(31,30,29,0.04)',
            }}
          >
            <span className="mono text-[11px] font-semibold text-[var(--ink)]">Cấp {level}</span>
          </div>
        </div>

        <div className="hidden min-w-[220px] md:block">
          <div className="mono text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">Kỷ {activeBook} · Cấp {level}</div>
          <div className="mt-1 text-[23px] font-bold leading-none tracking-[-0.03em] text-[var(--ink)]" style={{ fontFamily: 'var(--skin-font-display)' }}>{eraLabel}</div>
        </div>

        <div
          className="min-w-0 flex-1 rounded-[18px] border px-3 py-2.5"
          style={{
            borderColor: 'var(--line)',
            background: 'var(--panel-soft)',
            boxShadow: '0 8px 16px rgba(31,30,29,0.03)',
          }}
        >
          {/*
            ⚠️ THANH NÀY ĐO **CHẶNG**, KHÔNG ĐO CẢ KỶ (2026-08-29).
            Một kỷ dài 5.600–20.800 EP ⇒ ở nhịp thường một phiên đẩy thanh ~1% và nó đầy ĐÚNG MỘT
            LẦN mỗi 1–6 tháng. Một cái đích xa tới mức không nhìn thấy mình đang tiến thì không
            phải một cái đích. Mỗi kỷ đã chia sẵn 3 chặng từ lâu (`makeEraStages`) nhưng chặng chỉ
            được dùng ở `ResourceDisplay` — mà thẻ đó nằm ở cột phải `hidden … lg:flex`, tức trên
            iPhone Đàm KHÔNG BAO GIỜ thấy. Đây là chỗ cả hai nền tảng đều thấy.
            Phép tính ở `engine/eraStage.js`, dùng CHUNG với `ResourceDisplay` và màn Tập trung.
          */}
          <div className="flex items-center justify-between gap-3">
            <span className="mono min-w-0 truncate text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
              {eraStage ? eraStage.label : 'Tiến trình kỷ'}
            </span>
            <span className="mono whitespace-nowrap text-[11.5px] text-[var(--muted)]">
              {/* ⚠️ ĐƠN VỊ Ở ĐÂY LÀ **EP**, KHÔNG PHẢI XP. Cùng đơn vị mà `ResourceDisplay`/
                  `PrestigeModal`/`StakePanel` đều gọi là EP. Chữ "XP" ở đây từng nói dối suốt một
                  thời gian dài mà không ai thấy, vì trên tài khoản mới nó chỉ là "0 / 1.300" — vô
                  hại. Chỉ khi soi bằng fixture "đã chơi 6 tháng" mới lộ ra: cấp 4 mà thanh XP báo
                  20.888, trong khi cấp 4 cần 24.000 XP — hai đại lượng khác nhau, cùng một nhãn,
                  ngay trên thanh tiêu đề. */}
              {eraStage
                ? `${Math.round(eraStage.epInStage).toLocaleString()} / ${eraStage.epRange.toLocaleString()} EP`
                : `${totalEP.toLocaleString()} / ${eraEnd.toLocaleString()} EP`}
            </span>
          </div>
          <div className="mt-2.5 h-[3px] overflow-hidden rounded-full bg-[var(--line)]">
            <div
              className="h-full rounded-full bg-[var(--ink)] transition-[width] duration-500"
              style={{ width: `${(eraStage ? eraStage.progress : eraProgress) * 100}%` }}
            />
          </div>
          {/* Ba vạch chặng: cho thấy đây là mốc thứ mấy trong ba, tức "đầy thanh" sẽ tới BA lần
              mỗi kỷ chứ không phải một. Không có nó thì thanh mới trông y hệt thanh cũ, chỉ chạy
              nhanh hơn — và người xem không có cách nào biết vì sao. */}
          {eraStage && (
            <div className="mt-1.5 flex gap-1" aria-hidden="true">
              {Array.from({ length: eraStage.total }, (_, i) => (
                <span
                  key={i}
                  className="h-[2px] flex-1 rounded-full"
                  style={{ background: i <= eraStage.index ? 'var(--accent)' : 'var(--line)' }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-[repeat(3,minmax(0,1fr))_auto] items-center gap-2 lg:hidden">
          <TinyStat compact label="Phiên" value={sessionsCompletedToday.toLocaleString()} />
          <TinyStat compact label="Tập trung" value={focusHoursToday} />
          <TinyStat
            compact
            label={streakRisk?.atRisk ? 'Chuỗi ⚠' : 'Chuỗi'}
            value={currentStreak.toLocaleString()}
            accent
            atRisk={streakRisk?.atRisk === true}
          />
          <div className="flex items-center justify-end">
            {notificationControl}
          </div>
        </div>

        {/* HUD gọn như mockup: chỉ vòng cấp (số trong vòng) — số liệu ngày đã nằm ở cột phải/Thống kê */}
        <div className="hidden items-center gap-2 xl:flex" title={`Cấp ${level} · ${(levelPct * 100).toFixed(0)}%`}>
          <LevelDot level={level} pct={levelPct} />
        </div>

        <div className="hidden items-center justify-end gap-2 lg:ml-auto lg:flex">
          {notificationControl}
        </div>
      </div>
    </header>
  );
}

function LevelDot({ level, pct }) {
  const radius = 11;
  const circumference = 2 * Math.PI * radius;
  const size = radius * 2 + 4;
  return (
    <div
      className="relative rounded-full"
      style={{
        width: size,
        height: size,
        background: 'var(--panel-strong)',
      }}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--line)" strokeWidth="2" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (pct * circumference)}
          strokeLinecap="round"
        />
      </svg>
      <span className="mono absolute inset-0 flex items-center justify-center text-[10px] font-semibold">
        {level}
      </span>
    </div>
  );
}

function TinyStat({ accent = false, atRisk = false, compact = false, label, value }) {
  // ⚠️ Trạng thái "treo" nói bằng CẢ HAI: viền màu VÀ chữ "⚠" trong nhãn. Chỉ đổi màu thì người
  // không phân biệt được màu sẽ không nhận ra gì — cùng luật đã áp cho thẻ phần thưởng (ADR-060:
  // độ hiếm phải đọc được KHI KHÔNG NHÌN MÀU).
  return (
    <div
      className={`rounded-[16px] border text-center leading-tight ${compact ? 'min-w-[68px] px-2.5 py-2' : 'min-w-[72px] px-3 py-2'}`}
      style={{
        borderColor: atRisk ? 'var(--accent2)' : 'var(--line)',
        background: 'var(--panel-soft)',
        boxShadow: '0 8px 16px rgba(31,30,29,0.03)',
      }}
    >
      <div className="mono text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">{label}</div>
      <div className="mono mt-1 text-[12.5px] font-semibold" style={{ color: accent ? 'var(--accent)' : 'var(--ink)' }}>
        {value}
      </div>
    </div>
  );
}

function FocusIntro({
  greeting,
  sessionsCompletedToday,
  focusMinutesToday,
  weekdayLabel,
  dailyGoalType,
  dailyGoalSessions,
  dailyGoalMinutes,
  hasFocusSessionInProgress,
  isFocusSessionPaused,
}) {
  // Màn Focus tĩnh: khi phiên đang chạy/tạm dừng, ẩn lời chào lớn để chỉ còn đồng hồ.
  if (hasFocusSessionInProgress) return null;
  const { badgeLabel, title, progressTemplate, remainingValue, statusTemplate } = getFocusIntroCopy({
    greeting,
    sessionsCompletedToday,
    focusMinutesToday,
    weekdayLabel,
    dailyGoalType,
    dailyGoalSessions,
    dailyGoalMinutes,
    hasFocusSessionInProgress,
    isFocusSessionPaused,
  });
  const emphasisValues = {
    countLabel: formatDailyGoalValue(
      dailyGoalType === 'minutes' ? focusMinutesToday : sessionsCompletedToday,
      dailyGoalType,
    ),
    remainingLabel: formatDailyGoalValue(remainingValue, dailyGoalType),
  };

  return (
    <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t px-1 pt-4" style={{ borderColor: 'var(--line)' }}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-[var(--muted-2)]">
        <AppIcon.calendar size={13} />
        <span>{badgeLabel}</span>
      </div>
      <h1
        className="text-[19px] font-semibold leading-snug tracking-[-0.01em] text-[var(--ink)] md:text-[21px]"
        style={{ fontFamily: 'var(--skin-font-display)' }}
      >
        {title}
      </h1>
      <p className="w-full text-[12.5px] leading-[1.5] text-[var(--muted)] md:max-w-[560px]">
        {renderFocusIntroCopy(progressTemplate, emphasisValues)}{' '}
        {renderFocusIntroCopy(statusTemplate, emphasisValues)}
      </p>
    </div>
  );
}

function ShellPane({ children, subtitle, title, topRail = null }) {
  return (
    <div className="h-full overflow-y-auto">
      {topRail}
      {/*
        ⚠️ KHỐI TIÊU ĐỀ ĐÃ ĐƯỢC CẮT GỌN (2026-08-29) — đo trước khi cắt: ở khung 390px, tab Thành
        Phố có canvas 3D **chỉ chiếm 24% chiều cao** và nó bắt đầu ở y=537, tức **63% màn hình
        trôi qua trước khi thấy thứ đáng xem nhất**. Ba lớp bị gỡ/thu, mỗi lớp một lý do riêng:

        · **Chữ "Workspace"** — GỠ HẲN. Nó là tiếng Anh trong một app tiếng Việt, và nó xuất hiện
          y hệt nhau ở CẢ NĂM tab ⇒ nó không phân biệt được gì cả, chỉ tốn một dòng mỗi màn hình.
          Một nhãn giống nhau ở mọi nơi thì không mang thông tin.
        · **`subtitle`** — chỉ còn hiện trên MÀN RỘNG. Nó giải thích luật chơi, tức chỉ đáng đọc
          vài lần đầu; trên điện thoại nó đứng chắn ngay chỗ đắt nhất, mỗi lần mở tab, mãi mãi.
        · **`h1`** — nhỏ lại trên điện thoại (28 → 21px). Nhãn tab đang sáng ở thanh dưới ĐÃ nói
          tên màn hình rồi, nên đây là chỗ nói lần thứ hai; theo luật sẵn có của dự án thì *chỗ
          nói ít hơn phải nhường*. Vẫn giữ ở màn rộng, nơi thanh bên có thể đang thu gọn.
      */}
      <div className="mx-auto max-w-[1120px] px-5 pb-28 pt-5 md:px-8 md:pt-8 lg:px-12 lg:pb-8">
        {title ? (
          <>
            {/*
              ⚠️ CẢ KHỐI TIÊU ĐỀ ẨN TRÊN ĐIỆN THOẠI (`hidden md:block`). Nhãn tab đang SÁNG ở thanh
              dưới đã nói đúng tên màn hình rồi — đây là chỗ nói lần thứ hai, và luật sẵn có của dự
              án là *hai chỗ nói cùng một chuyện thì chỗ nói ít hơn phải nhường*. Ở màn rộng thì
              giữ: thanh bên có thể đang thu gọn, và ở đó chỗ trống không phải thứ khan hiếm.
              Đo được ở tab Thành Phố, khung 390px: bỏ khối này đưa canvas 3D từ y=380 lên y≈270,
              tức thành phố lọt trọn vào nửa trên màn hình thay vì nằm vắt qua nếp gấp.
            */}
            <div className="mb-6 hidden md:block">
              <h1
                className="text-[28px] font-semibold leading-[1.08] tracking-[-0.02em] text-[var(--ink)] md:text-[33px]"
                style={{ fontFamily: 'var(--skin-font-display)' }}
              >
                {title}
              </h1>
              {subtitle && (
                <p className="mt-2.5 max-w-[680px] text-[13.5px] leading-[1.6] text-[var(--muted)]">
                  {subtitle}
                </p>
              )}
            </div>
            <div className="md:border-t md:pt-6" style={{ borderColor: 'var(--line)' }}>
              {children}
            </div>
          </>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function TabPane({ children }) {
  // `enter` mang sẵn `exit` — bỏ nó đi thì `AnimatePresence mode="wait"` tháo tab cũ tức thì
  // và mỗi lần chuyển tab giật một cái.
  const enterMotion = useEnterMotion();
  return (
    <Motion.div {...enterMotion} className="h-full">
      {children}
    </Motion.div>
  );
}

function DeferredTabContent({ children }) {
  return <Suspense fallback={<TabLoadingState />}>{children}</Suspense>;
}

function TabLoadingState() {
  return (
    <div
      className="rounded-[18px] border px-5 py-10 text-center"
      style={{ borderColor: 'var(--line)', background: 'var(--canvas)' }}
    >
      <div className="inline-flex items-center gap-3 rounded-full border px-4 py-2 text-sm text-[var(--muted)]" style={{ borderColor: 'var(--line)' }}>
        <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--accent)]" />
        Đang tải nội dung...
      </div>
    </div>
  );
}

function useMinWidth(minWidth) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(`(min-width: ${minWidth}px)`).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const media = window.matchMedia(`(min-width: ${minWidth}px)`);
    const update = (event) => setMatches(event.matches);

    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [minWidth]);

  return matches;
}

/**
 * Dải tab con dạng viên thuốc — MỘT công thức cho mọi tầng tab con.
 *
 * ⚠️ Trước 2026-08-27 khối này nằm thẳng trong `CollectionView`. Lúc "Hành trang" cần đúng dải
 * ấy cho ba tab con của nó, cách rẻ nhất là chép sang — và đó là cách một giao diện tách làm hai
 * kiểu: hai bản sao trôi khỏi nhau ở bo góc, ở màu chữ khi không chọn, rồi hai tầng tab con nằm
 * chồng nhau trên cùng một màn hình mà trông không cùng một app.
 */
function SubTabs({ items, onChange, value }) {
  return (
    <div
      className="mb-6 inline-flex flex-wrap gap-2 rounded-[18px] border p-1.5"
      style={{
        borderColor: 'var(--line)',
        background: 'var(--panel)',
        boxShadow: '0 8px 16px rgba(31,30,29,0.03)',
      }}
    >
      {items.map((tab) => {
        const active = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange?.(tab.id)}
            className="rounded-full px-4 py-2 text-[13px] font-medium transition-colors"
            style={{
              background: active ? 'var(--panel-strong)' : 'transparent',
              color: active ? 'var(--ink)' : 'var(--muted)',
              border: active ? '1px solid var(--line)' : '1px solid transparent',
              boxShadow: active ? '0 8px 14px rgba(31,30,29,0.03)' : 'none',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * "Hành trang" — một tab điều hướng, ba màn cũ nguyên vẹn bên trong.
 *
 * Đây là việc GOM NHÓM, không phải viết lại: mỗi tab con vẫn dựng đúng component cũ, với đúng
 * state cũ (`collectionTab` vẫn do `App` giữ, nên mở thông báo "Xưởng" vẫn rơi thẳng vào Xưởng).
 */
function InventoryView({ collectionTab, onCollectionChange, onChange, sub }) {
  return (
    <div>
      <SubTabs items={INVENTORY_TABS} onChange={onChange} value={sub} />

      {sub === 'skills' && (
        <DeferredTabContent>
          <SkillTree onOpenAchievements={() => onChange?.('achievements')} />
        </DeferredTabContent>
      )}
      {sub === 'collection' && <CollectionView onChange={onCollectionChange} sub={collectionTab} />}
      {sub === 'achievements' && (
        <DeferredTabContent>
          <Achievements />
        </DeferredTabContent>
      )}
    </div>
  );
}

function CollectionView({ sub = 'relics', onChange }) {
  return (
    <div>
      <SubTabs items={COLLECTION_TABS} onChange={onChange} value={sub} />

      <Suspense fallback={<TabLoadingState />}>
        {sub === 'relics' && <RelicInventory />}
        {sub === 'blueprints' && <BlueprintInventory />}
        {sub === 'workshop' && <BuildingWorkshop />}
        {sub === 'history' && <SessionHistory />}
      </Suspense>
    </div>
  );
}

function SessionHistory() {
  const history = useGameStore((s) => s.history);

  if (history.length === 0) {
    return (
      <div
        className="rounded-[22px] border py-14 text-center"
        style={{
          borderColor: 'var(--line)',
          background: 'var(--panel)',
          boxShadow: '0 12px 26px rgba(31,30,29,0.04)',
        }}
      >
        <div className="serif text-[28px] text-[var(--muted)]">Chưa có lịch sử phiên</div>
        <p className="mt-2 text-[14px] text-[var(--muted)]">Bắt đầu một phiên mới để tạo mốc đầu tiên.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((entry) => (
        <article
          key={entry.id}
          className="rounded-[22px] border p-4"
          style={{
            borderColor: 'var(--line)',
            background: 'var(--panel)',
            boxShadow: '0 10px 24px rgba(31,30,29,0.04)',
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border"
              style={{
                borderColor: 'var(--line)',
                background: 'var(--item-bg-solid)',
              }}
            >
              <span className="mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                {entry.jackpot ? 'JP' : ((entry.refinedEarned ?? 0) > 0 || (entry.minutes ?? 0) >= 45) ? 'RF' : 'PM'}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="serif text-[20px] font-medium text-[var(--ink)]">{entry.minutes} phút</span>
                <span className="rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ borderColor: 'var(--line-2)', color: 'var(--muted)' }}>
                  {entry.tier}
                </span>
                {entry.multiplier > 1 && (
                  <span className="rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ borderColor: 'rgba(201,100,66,0.22)', color: 'var(--accent)' }}>
                    ×{entry.multiplier.toFixed(1)}
                  </span>
                )}
              </div>

              <p className="mt-1 text-[13px] text-[var(--muted)]">
                +{(entry.xpEarned ?? entry.epEarned ?? 0).toLocaleString()} XP
              </p>

              {entry.goal && (
                <p className="mt-2 text-[13px] leading-[1.55] text-[var(--ink-2)]">
                  <strong className="font-semibold text-[var(--ink)]">Mục tiêu:</strong> {entry.goal}
                </p>
              )}

              {typeof entry.goalAchieved === 'boolean' && (
                <div className="mt-2">
                  <span
                    className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]"
                    style={{
                      background: entry.goalAchieved ? 'var(--good-soft)' : 'rgba(var(--accent-rgb),0.12)',
                      color: entry.goalAchieved ? 'var(--good)' : 'var(--accent-ink)',
                    }}
                  >
                    {entry.goalAchieved ? 'Đạt mục tiêu' : 'Chưa đạt mục tiêu'}
                  </span>
                </div>
              )}

              {entry.note && (
                <div className="mt-2 text-[12px] text-[var(--muted)]">
                  <span className="mono mr-1 text-[10px] uppercase tracking-[0.16em]">Ghi chú</span>
                  <RichTextView value={entry.note} compact className="mt-1" />
                </div>
              )}

              {entry.nextNote && (
                <p className="mt-2 text-[12px] text-[var(--accent-ink)]">
                  <span className="mono mr-1 text-[10px] uppercase tracking-[0.16em]">Lần sau</span>
                  {entry.nextNote}
                </p>
              )}
            </div>

            <div
              className="shrink-0 rounded-[14px] border px-3 py-2 text-right text-[11px] text-[var(--muted)]"
              style={{
                borderColor: 'var(--line)',
                background: 'var(--item-bg)',
              }}
            >
              <div>{formatVietnamDate(entry.timestamp, { month: 'short', day: 'numeric' })}</div>
              <div className="mono mt-1">{formatVietnamTime(entry.timestamp, { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

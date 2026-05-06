import React, { useEffect, useRef, useState, Suspense } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { initSync } from './lib/syncService';

import AppErrorBoundary from './components/AppErrorBoundary';
import PomodoroEngine from './components/PomodoroEngine';
import ResourceDisplay from './components/ResourceDisplay';
import RankDisplay from './components/RankDisplay';
import Settings from './components/Settings';
import LootDropModal from './components/LootDropModal';
import DisasterModal from './components/DisasterModal';
import EraCrisisModal from './components/EraCrisisModal';
import AchievementToast from './components/AchievementToast';
import DailyMissions from './components/DailyMissions';
import PrestigeModal from './components/PrestigeModal';
import LevelUpModal from './components/LevelUpModal';
import WeeklyReportModal from './components/WeeklyReportModal';
import NotificationCenter from './components/NotificationCenter';
import { DCPomodoroSidebarBrand } from './components/DCPomodoroBrand';
import { useGameLoop } from './hooks/useGameLoop';
import useGameStore from './store/gameStore';
import useSettingsStore from './store/settingsStore';
import { ERA_METADATA, ERA_THRESHOLDS } from './engine/constants';
import { getLevelProgress } from './engine/gameMath';
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
  skills: (props) => (
    <Glyph {...props}>
      <path d="M12 3v18" />
      <path d="M12 7c3 0 5-2 8-2" />
      <path d="M12 11c-3 0-5-2-8-2" />
      <path d="M12 15c3 0 5-2 8-2" />
    </Glyph>
  ),
  vault: (props) => (
    <Glyph {...props}>
      <path d="M4 8l8-4 8 4v8l-8 4-8-4z" />
      <path d="M4 8l8 4 8-4" />
      <path d="M12 12v8" />
    </Glyph>
  ),
  trophy: (props) => (
    <Glyph {...props}>
      <path d="M8 4h8v5a4 4 0 0 1-8 0z" />
      <path d="M5 5h3v3a3 3 0 0 1-3-3z" />
      <path d="M19 5h-3v3a3 3 0 0 0 3-3z" />
      <path d="M9 14h6l-1 5h-4z" />
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
};

const DESKTOP_TABS = [
  { id: 'focus', label: 'Tập trung', shortLabel: 'Tập trung', Icon: AppIcon.focus },
  { id: 'skills', label: 'Kỹ năng', shortLabel: 'Kỹ năng', Icon: AppIcon.skills },
  { id: 'collection', label: 'Kho báu', shortLabel: 'Kho báu', Icon: AppIcon.vault },
  { id: 'achievements', label: 'Thành tích', shortLabel: 'Thành tích', Icon: AppIcon.trophy },
  { id: 'stats', label: 'Thống kê', shortLabel: 'Thống kê', Icon: AppIcon.stats },
  { id: 'settings', label: 'Cài đặt', shortLabel: 'Cài đặt', Icon: AppIcon.settings },
];

const MOBILE_TABS = [
  { id: 'focus', label: 'Tập trung', shortLabel: 'Tập trung', Icon: AppIcon.focus },
  { id: 'missions', label: 'Nhiệm vụ', shortLabel: 'Nhiệm vụ', Icon: AppIcon.missions },
  { id: 'skills', label: 'Kỹ năng', shortLabel: 'Kỹ năng', Icon: AppIcon.skills },
  { id: 'collection', label: 'Kho báu', shortLabel: 'Kho báu', Icon: AppIcon.vault },
  { id: 'achievements', label: 'Thành tích', shortLabel: 'Thành tích', Icon: AppIcon.trophy },
  { id: 'stats', label: 'Thống kê', shortLabel: 'Thống kê', Icon: AppIcon.stats },
  { id: 'settings', label: 'Cài đặt', shortLabel: 'Cài đặt', Icon: AppIcon.settings },
];

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
  const hydrateEngines = useSettingsStore((s) => s.hydrateEngines);
  const uiTheme = useSettingsStore((s) => s.uiTheme);
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
  const checkWeeklyReport = useGameStore((s) => s.checkWeeklyReport);
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
    checkWeeklyReport();
    initSync();
  }, [storesHydrated, hydrateEngines, refreshPushState, checkRankChallengeDeadlines, refreshDailyMissions, checkWeeklyReport]);

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

      const weekChanged = missionBoundaryRef.current.week !== week;
      missionBoundaryRef.current = { day, week };
      refreshDailyMissions();
      if (weekChanged) checkWeeklyReport();
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
  }, [storesHydrated, checkEraCrisisDeadlines, checkWeeklyReport, refreshDailyMissions, timerSessionRunning]);

  const isOnBreak = useGameStore((s) => s.ui.isOnBreak);
  const breakSecsLeft = useGameStore((s) => s.ui.breakSecondsLeft);
  const breakTrayWasActiveRef = useRef(false);

  useEffect(() => {
    if (!window.electronAPI) {
      breakTrayWasActiveRef.current = isOnBreak;
      return;
    }
    if (isOnBreak) {
      const mm = String(Math.floor(breakSecsLeft / 60)).padStart(2, '0');
      const ss = String(breakSecsLeft % 60).padStart(2, '0');
      window.electronAPI.updateTray({ state: 'BREAK', timeLeft: `${mm}:${ss}` });
      breakTrayWasActiveRef.current = true;
      return;
    }
    if (breakTrayWasActiveRef.current) {
      window.electronAPI.updateTray({ state: 'IDLE', timeLeft: '' });
    }
    breakTrayWasActiveRef.current = false;
  }, [isOnBreak, breakSecsLeft]);

  const activeBook = useGameStore((s) => s.progress.activeBook);
  const totalEP = useGameStore((s) => s.progress.totalEP);
  const totalEXP = useGameStore((s) => s.player.totalEXP);
  const level = useGameStore((s) => s.player.level);
  const dailyTracking = useGameStore((s) => s.dailyTracking);
  const history = useGameStore((s) => s.history);
  const currentStreak = useGameStore((s) => s.streak.currentStreak);
  const lootModalOpen = useGameStore((s) => s.ui.lootModalOpen);
  const disasterModalOpen = useGameStore((s) => s.ui.disasterModalOpen);
  const eraCrisisModalOpen = useGameStore((s) => s.ui.eraCrisisModalOpen);
  const prestigeModalOpen = useGameStore((s) => s.ui.prestigeModalOpen);
  const weeklyReportOpen = useGameStore((s) => s.ui.weeklyReportOpen);
  const levelUpQueueLength = useGameStore((s) => s.ui.levelUpQueue.length);
  const achievementQueueLength = useGameStore((s) => s.ui.achievementQueue.length);

  const eraMeta = ERA_METADATA[activeBook] ?? ERA_METADATA[1];
  const eraStart = ERA_THRESHOLDS[`ERA_${activeBook - 1}_END`] ?? 0;
  const eraEnd = ERA_THRESHOLDS[`ERA_${activeBook}_END`] ?? ERA_THRESHOLDS.ERA_15_END;
  const eraGap = Math.max(1, eraEnd - eraStart);
  const eraProgress = Math.min(1, Math.max(0, (totalEP - eraStart) / eraGap));
  const { progressPct: levelPct } = getLevelProgress(totalEXP);

  const [activeTab, setActiveTab] = useState('focus');
  const [collectionTab, setCollectionTab] = useState('relics');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [supportRailOpen, setSupportRailOpen] = useState(true);
  const [focusFullscreen, setFocusFullscreen] = useState(false);
  const leftShiftPressedRef = useRef(false);
  const isDesktop = useMinWidth(1024);
  const isWideViewport = useMinWidth(768);
  const showFocusFullscreen = focusFullscreen && activeTab === 'focus';
  const selectTab = (tab) => {
    setActiveTab(tab);
    if (tab !== 'focus') {
      setFocusFullscreen(false);
    }
  };

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
  const sessionsCompletedToday = dailyTracking?.date === todayKey
    ? (dailyTracking.sessionsCompleted ?? 0)
    : 0;
  const focusMinutesToday = history.reduce(
    (sum, entry) => (localDateStr(entry.timestamp) === todayKey ? sum + (entry.minutes ?? 0) : sum),
    0,
  );
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
        className="flex h-screen overflow-hidden bg-[var(--canvas)] text-[var(--ink)]"
        data-theme={uiTheme}
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
              isOpen={sidebarOpen}
              onOpenWeeklyReport={openWeeklyReport}
              onSelect={selectTab}
              onToggle={() => setSidebarOpen((value) => !value)}
            />
          </AppErrorBoundary>
        )}

        <div className="flex min-w-0 flex-1 flex-col bg-[var(--canvas)]">
          {!showFocusFullscreen && isDesktop && renderTopRail()}

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
                <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto scroll-pb-[calc(env(safe-area-inset-bottom)+7.4rem)]">
                  {!isDesktop && !showFocusFullscreen && renderTopRail()}
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
                      <div className="mt-6">
                        <PomodoroEngine
                          immersiveMode={isWideViewport}
                          onEnterFullScreen={() => {
                            selectTab('focus');
                            setFocusFullscreen(true);
                          }}
                        />
                      </div>
                    </div>
                  </AppErrorBoundary>
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
                    animate={{ width: supportRailOpen ? 340 : 60 }}
                    transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <div className="min-h-0 flex-1 overflow-y-auto">
                      {supportRailOpen ? (
                        <div className="space-y-4 p-4">
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
                        <Motion.span
                          animate={{ rotate: supportRailOpen ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
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
                resetKeys={[activeTab, collectionTab]}
                variant="section"
              >
                <AnimatePresence mode="wait">
                  {activeTab === 'skills' && (
                    <TabPane key="skills">
                      <ShellPane
                        title="Kỹ năng"
                        subtitle="Mở khóa các nhánh tăng trưởng dài hạn và định hình phong cách tập trung."
                        topRail={!isDesktop && !showFocusFullscreen ? renderTopRail() : null}
                      >
                        <DeferredTabContent>
                          <SkillTree />
                        </DeferredTabContent>
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

                  {activeTab === 'collection' && (
                    <TabPane key="collection">
                      <ShellPane
                        title="Kho báu"
                        subtitle="Theo dõi di vật, bản vẽ và lịch sử phiên dưới cùng một bề mặt điều hướng."
                        topRail={!isDesktop && !showFocusFullscreen ? renderTopRail() : null}
                      >
                        <CollectionView sub={collectionTab} onChange={setCollectionTab} />
                      </ShellPane>
                    </TabPane>
                  )}

                  {activeTab === 'achievements' && (
                    <TabPane key="achievements">
                      <ShellPane
                        title="Thành tích"
                        subtitle="Nhìn lại các cột mốc đã đạt và khoảng cách tới các biểu tượng kế tiếp."
                        topRail={!isDesktop && !showFocusFullscreen ? renderTopRail() : null}
                      >
                        <DeferredTabContent>
                          <Achievements />
                        </DeferredTabContent>
                      </ShellPane>
                    </TabPane>
                  )}

                  {activeTab === 'stats' && (
                    <TabPane key="stats">
                      <ShellPane
                        title="Thống kê"
                        subtitle="Các xu hướng theo ngày, theo chuỗi và theo lịch sử phiên được gom trong một workspace gọn hơn."
                        topRail={!isDesktop && !showFocusFullscreen ? renderTopRail() : null}
                      >
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
                        <Settings />
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
          className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-2.5 sm:px-3"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
        >
          <nav
            className="pointer-events-auto flex w-full max-w-[760px] items-center gap-0.5 rounded-[24px] border p-1 backdrop-blur-xl"
            style={{
              borderColor: 'var(--line)',
              background: 'var(--panel-soft)',
              boxShadow: '0 12px 28px rgba(31,30,29,0.08)',
            }}
          >
            {MOBILE_TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => selectTab(tab.id)}
                  className="relative flex min-h-[48px] flex-1 flex-col items-center justify-center gap-px rounded-[16px] px-1 py-1.5 text-[9px] font-medium leading-none transition-colors"
                  style={{
                    color: active ? 'var(--ink)' : 'var(--muted)',
                    background: active ? 'var(--panel-strong)' : 'transparent',
                    border: active ? '1px solid var(--line)' : '1px solid transparent',
                    boxShadow: active ? '0 8px 14px rgba(31,30,29,0.03)' : 'none',
                  }}
                >
                  <tab.Icon size={14} />
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
          levelUpQueueLength,
          achievementQueueLength,
        ]}
        variant="section"
      >
        <GlobalOverlays />
      </AppErrorBoundary>
    </div>
  );
}

function GlobalOverlays() {
  return (
    <>
      <LootDropModal />
      <DisasterModal />
      <EraCrisisModal />
      <PrestigeModal />
      <LevelUpModal />
      <WeeklyReportModal />
      <AchievementToast />
    </>
  );
}

function EditorialSidebar({ activeTab, isOpen, onOpenWeeklyReport, onSelect, onToggle }) {
  return (
    <Motion.aside
      className="hidden border-r bg-[var(--canvas)] md:flex md:flex-col"
      style={{ borderColor: 'var(--line)' }}
      animate={{ width: isOpen ? 258 : 60 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
    >
      <DCPomodoroSidebarBrand isOpen={isOpen} />

      <nav className="mt-2 flex flex-1 flex-col gap-0.5 px-2">
        {isOpen && (
          <div className="px-2.5 pb-2">
            <div className="mono text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">Điều hướng</div>
          </div>
        )}
        {DESKTOP_TABS.filter((tab) => tab.id !== 'settings').map((tab) => (
          <SidebarItem
            key={tab.id}
            active={activeTab === tab.id}
            icon={<tab.Icon size={17} />}
            isOpen={isOpen}
            label={tab.label}
            onClick={() => onSelect(tab.id)}
          />
        ))}
        <div className="mx-2 my-3 h-px bg-[var(--line)]" />
        {isOpen && (
          <div className="px-2.5 pb-2">
            <div className="mono text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">Hệ thống</div>
          </div>
        )}
        <SidebarItem
          active={activeTab === 'settings'}
          icon={<AppIcon.settings size={17} />}
          isOpen={isOpen}
          label="Cài đặt"
          onClick={() => onSelect('settings')}
        />
      </nav>

      <div className="mt-auto flex flex-col gap-1 px-2 pb-3 pt-3">
        <SidebarItem
          active={false}
          icon={<AppIcon.report size={17} />}
          isOpen={isOpen}
          label="Báo cáo tuần"
          onClick={onOpenWeeklyReport}
        />
        <button
          type="button"
          onClick={onToggle}
          className={`flex h-[34px] items-center rounded-[8px] text-[12.5px] text-[var(--muted-2)] transition-colors hover:bg-[var(--panel)] ${
            isOpen ? 'gap-2.5 px-2.5 justify-start' : 'justify-center'
          }`}
        >
          <Motion.span
            animate={{ rotate: isOpen ? 0 : 180 }}
            transition={{ duration: 0.2 }}
          >
            <AppIcon.chevronLeft size={15} />
          </Motion.span>
          {isOpen && <span>Thu gọn</span>}
        </button>
      </div>
    </Motion.aside>
  );
}

function SidebarItem({ active, icon, isOpen, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={!isOpen ? label : undefined}
      className={`group relative flex min-h-[40px] items-center rounded-[12px] border text-left text-[13.5px] font-medium transition-colors hover:bg-[var(--panel)] ${
        isOpen ? 'gap-2.5 px-2.5 justify-start' : 'justify-center'
      }`}
      style={{
        background: active ? 'var(--panel-soft)' : 'transparent',
        borderColor: active ? 'var(--line)' : 'transparent',
        color: active ? 'var(--ink)' : 'var(--muted)',
        boxShadow: 'none',
      }}
    >
      {active && (
        <span
          className="absolute inset-y-[7px] left-[-8px] w-[2px] rounded-full"
          style={{ background: 'var(--accent)' }}
        />
      )}
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] transition-colors"
        style={{
          background: 'transparent',
          color: active ? 'var(--ink)' : 'var(--muted)',
          border: '1px solid transparent',
        }}
      >
        {icon}
      </span>
      {isOpen && <span className="truncate">{label}</span>}
    </button>
  );
}

function TopRail({
  activeBook,
  eraLabel,
  eraEnd,
  eraProgress,
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
      style={{ borderColor: 'var(--line)' }}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex items-start justify-between gap-3 md:hidden">
          <div>
            <div className="mono text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">Kỷ {activeBook}</div>
            <div className="serif mt-1 text-[17px] font-medium tracking-[-0.02em] text-[var(--ink)]">{eraLabel}</div>
          </div>
          <div
            className="rounded-full border px-3 py-1.5"
            style={{
              borderColor: 'var(--line)',
              background: 'var(--panel)',
              boxShadow: '0 10px 18px rgba(31,30,29,0.04)',
            }}
          >
            <span className="mono text-[11px] font-semibold text-[var(--ink)]">Lv {level}</span>
          </div>
        </div>

        <div className="hidden min-w-[190px] md:block">
          <div className="mono text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">Kỷ {activeBook}</div>
          <div className="serif mt-1 text-[17px] font-medium tracking-[-0.02em] text-[var(--ink)]">{eraLabel}</div>
        </div>

        <div
          className="min-w-0 flex-1 rounded-[18px] border px-3 py-2.5"
          style={{
            borderColor: 'var(--line)',
            background: 'var(--panel-soft)',
            boxShadow: '0 8px 16px rgba(31,30,29,0.03)',
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="mono whitespace-nowrap text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">Tiến trình kỷ</span>
            <span className="mono whitespace-nowrap text-[11.5px] text-[var(--muted)]">
              {totalEP.toLocaleString()} / {eraEnd.toLocaleString()} XP
            </span>
          </div>
          <div className="mt-2.5 h-[3px] overflow-hidden rounded-full bg-[var(--line)]">
            <div
              className="h-full rounded-full bg-[var(--ink)] transition-[width] duration-500"
              style={{ width: `${eraProgress * 100}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-[repeat(3,minmax(0,1fr))_auto] items-center gap-2 lg:hidden">
          <TinyStat compact label="Phiên" value={sessionsCompletedToday.toLocaleString()} />
          <TinyStat compact label="Tập trung" value={focusHoursToday} />
          <TinyStat compact label="Chuỗi" value={currentStreak.toLocaleString()} accent />
          <div className="flex items-center justify-end">
            {notificationControl}
          </div>
        </div>

        <div className="hidden items-center gap-2 xl:flex">
          <div
            className="flex items-center gap-2 rounded-[16px] border px-3 py-2"
            style={{
              borderColor: 'var(--line)',
              background: 'var(--panel-soft)',
              boxShadow: '0 8px 16px rgba(31,30,29,0.03)',
            }}
          >
            <LevelDot level={level} pct={levelPct} />
            <div className="leading-tight">
              <div className="mono text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">Cấp</div>
              <div className="mono text-[12.5px] font-semibold text-[var(--ink)]">
                {level} · {(levelPct * 100).toFixed(0)}%
              </div>
            </div>
          </div>
          <TinyStat label="Phiên" value={sessionsCompletedToday.toLocaleString()} />
          <TinyStat label="Tập trung" value={focusHoursToday} />
          <TinyStat label="Chuỗi" value={currentStreak.toLocaleString()} accent />
        </div>

        <div className="hidden items-center justify-end lg:ml-auto lg:flex">
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

function TinyStat({ accent = false, compact = false, label, value }) {
  return (
    <div
      className={`rounded-[16px] border text-center leading-tight ${compact ? 'min-w-[68px] px-2.5 py-2' : 'min-w-[72px] px-3 py-2'}`}
      style={{
        borderColor: 'var(--line)',
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
    <div className="mb-8 border-t px-1 pt-5 md:pt-6" style={{ borderColor: 'var(--line)' }}>
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
        <AppIcon.calendar size={14} />
        <span>{badgeLabel}</span>
      </div>
      <h1 className="serif mt-3 text-[32px] font-medium leading-[1.05] tracking-[-0.035em] text-[var(--ink)] md:text-[38px]">
        {title}
      </h1>
      <p className="mt-3 max-w-[620px] text-[14px] leading-[1.65] text-[var(--muted)]">
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
      <div className="mx-auto max-w-[1120px] px-5 pb-28 pt-8 md:px-8 lg:px-12 lg:pb-8">
        <div className="mb-7">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
            <AppIcon.spark size={14} />
            <span>Workspace</span>
          </div>
          <h1 className="serif mt-3 text-[30px] font-medium leading-[1.06] tracking-[-0.03em] text-[var(--ink)] md:text-[36px]">
            {title}
          </h1>
          <p className="mt-3 max-w-[700px] text-[14px] leading-[1.65] text-[var(--muted)]">
            {subtitle}
          </p>
        </div>
        <div className="border-t pt-5 md:pt-6" style={{ borderColor: 'var(--line)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function TabPane({ children }) {
  return (
    <Motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className="h-full"
    >
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

function CollectionView({ sub = 'relics', onChange }) {
  return (
    <div>
      <div
        className="mb-6 inline-flex flex-wrap gap-2 rounded-[18px] border p-1.5"
        style={{
          borderColor: 'var(--line)',
          background: 'var(--panel)',
          boxShadow: '0 8px 16px rgba(31,30,29,0.03)',
        }}
      >
        {COLLECTION_TABS.map((tab) => {
          const active = sub === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
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
                <p className="mt-2 text-[12px] text-[var(--muted)]">
                  <span className="mono mr-1 text-[10px] uppercase tracking-[0.16em]">Ghi chú</span>
                  {entry.note}
                </p>
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

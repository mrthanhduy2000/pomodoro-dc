/**
 * feedNotifications.js — In-app feed notifications (the bell): builders + append with a cap. Moved verbatim out of gameStore.js (ADR-078).
 *
 * Comments inside are the originals (Vietnamese where they were written so); the rules they
 * explain have not changed by moving. Pure: no store, no DOM.
 */
import { CATALOG_LOOKUP as BLUEPRINT_LOOKUP } from './buildChoices';
import { ERA_METADATA, RANK_SYSTEM } from './constants';

export const UI_NOTIFICATION_LIMIT = 40;

export function createUiNotification({
  title,
  body = '',
  icon = '✦',
  category = 'system',
  action = null,
  createdAt = Date.now(),
}) {
  return {
    id: `notif_${createdAt}_${Math.random().toString(36).slice(2, 8)}`,
    title,
    body,
    icon,
    category,
    action,
    createdAt,
    readAt: null,
  };
}

export function appendUiNotification(feed, notification) {
  if (!notification?.title) return Array.isArray(feed) ? feed : [];
  return [
    createUiNotification(notification),
    ...(Array.isArray(feed) ? feed : []),
  ].slice(0, UI_NOTIFICATION_LIMIT);
}

export function appendUiNotifications(feed, notifications = []) {
  return notifications
    .filter((notification) => notification?.title)
    .reverse()
    .reduce((nextFeed, notification) => appendUiNotification(nextFeed, notification), Array.isArray(feed) ? feed : []);
}

export function getBlueprintIdentity(bpId) {
  const blueprint = BLUEPRINT_LOOKUP[bpId];
  return {
    label: blueprint?.label ?? bpId,
    icon: blueprint?.icon ?? '🏗️',
  };
}

export function describeNames(names = []) {
  const cleanNames = names.filter(Boolean);
  if (cleanNames.length === 0) return '';
  if (cleanNames.length === 1) return cleanNames[0];
  if (cleanNames.length === 2) return `${cleanNames[0]} và ${cleanNames[1]}`;
  return `${cleanNames[0]}, ${cleanNames[1]} và ${cleanNames.length - 2} mục khác`;
}

export function makeWorkshopQueuedNotification(bpId, sessionsToComplete = 0) {
  const blueprint = getBlueprintIdentity(bpId);
  return {
    title: 'Đã đưa vào xưởng',
    body: `${blueprint.label} đang trong hàng chờ xây dựng${sessionsToComplete > 0 ? `, cần ${sessionsToComplete} phiên để hoàn tất.` : '.'}`,
    icon: blueprint.icon,
    category: 'workshop',
    action: { tab: 'collection', collectionTab: 'workshop' },
  };
}

export function makeWorkshopCompletedNotification(bpIds = []) {
  const identities = bpIds.map(getBlueprintIdentity);
  const firstIcon = identities[0]?.icon ?? '🏗️';
  const summary = describeNames(identities.map((item) => item.label));
  return {
    title: bpIds.length > 1 ? 'Xưởng đã hoàn tất nhiều công trình' : 'Công trình đã hoàn tất',
    body: `${summary} đã hoàn tất và hiệu ứng công trình đang có hiệu lực.`,
    icon: firstIcon,
    category: 'workshop',
    action: { tab: 'collection', collectionTab: 'workshop' },
  };
}

/**
 * Công trình của một kỷ ĐÃ ĐÓNG vừa xây xong (Phase 4D — "di sản dang dở").
 *
 * ⚠️ CỐ Ý KHÔNG dùng chung `makeWorkshopCompletedNotification`: câu của hàm đó kết bằng *"hiệu ứng
 * công trình đang có hiệu lực"*, mà di sản thì **không** sinh hiệu ứng nào. Dùng lại cho tiện ở
 * đây là để app nói một câu sai — và là kiểu sai tệ nhất, vì Đàm sẽ tưởng mình vừa mạnh lên rồi
 * lên kế hoạch dựa trên một đặc quyền không tồn tại.
 * Cũng vì thế `action` trỏ về TAB THÀNH PHỐ chứ không về Xưởng: chỗ để ngắm nó là bảo tàng.
 */
export function makeLegacyCompletedNotification(entries = []) {
  const identities = entries.map((entry) => getBlueprintIdentity(entry.bpId));
  const eras = [...new Set(entries.map((entry) => entry.era))].sort((a, b) => a - b);
  const summary = describeNames(identities.map((item) => item.label));
  return {
    title: 'Xây xong công trình dang dở',
    body: `${summary} đã hoàn tất và được ghi vào thành phố ${eras.length > 1 ? 'các kỷ' : 'kỷ'} `
      + `${eras.join(', ')} trong bảo tàng. Công trình kỷ cũ không mang lại đặc quyền — nó hoàn `
      + 'thiện lịch sử của bạn.',
    icon: identities[0]?.icon ?? '🏛️',
    category: 'workshop',
    action: { tab: 'city' },
  };
}

export function makeRankUpFeedNotification(bookNumber, rankIdx) {
  const rank = RANK_SYSTEM[bookNumber]?.ranks?.[rankIdx];
  if (!rank) return null;
  return {
    title: 'Thăng rank',
    body: `Bạn vừa đạt ${rank.label}. Buff mới đã có hiệu lực.`,
    icon: rank.icon ?? '👑',
    category: 'rank',
    action: { tab: 'focus' },
  };
}

export function makeEraUpFeedNotification(bookNumber) {
  const eraMeta = ERA_METADATA[bookNumber];
  if (!eraMeta) return null;
  return {
    title: 'Kỷ nguyên mới',
    body: `Bạn đã bước vào ${eraMeta.label}. Những bản vẽ và mốc mới vừa mở ra.`,
    icon: eraMeta.icon ?? '⏳',
    category: 'era',
    action: { tab: 'focus' },
  };
}

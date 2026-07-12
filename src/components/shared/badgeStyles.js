import { BLUEPRINT_RARITY_LABEL } from '../../engine/constants';

// RARITY_STYLE byte-identical giữa BuildingWorkshop.jsx và BlueprintInventory.jsx
// trước khi gộp — an toàn dùng chung thật (khác TYPE_STYLE, vẫn khai riêng mỗi file
// vì độ đậm nhạt màu nền lệch nhau thật giữa 2 nơi).
export const RARITY_STYLE = {
  common: { label: BLUEPRINT_RARITY_LABEL.common, color: 'text-slate-200', bg: 'bg-slate-700/60', border: 'border-slate-500/50' },
  rare:   { label: BLUEPRINT_RARITY_LABEL.rare,   color: 'text-cyan-200',  bg: 'bg-cyan-900/30',  border: 'border-cyan-700/50' },
  epic:   { label: BLUEPRINT_RARITY_LABEL.epic,   color: 'text-fuchsia-200', bg: 'bg-fuchsia-900/30', border: 'border-fuchsia-700/50' },
};

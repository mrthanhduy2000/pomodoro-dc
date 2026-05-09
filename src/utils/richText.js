export const RICH_TEXT_TONES = [
  { id: 'red', label: 'Đỏ', color: '#c96442', soft: 'rgba(201, 100, 66, 0.14)' },
  { id: 'yellow', label: 'Vàng', color: '#b07d3b', soft: 'rgba(176, 125, 59, 0.16)' },
  { id: 'green', label: 'Xanh lá', color: '#5b7a52', soft: 'rgba(91, 122, 82, 0.16)' },
  { id: 'blue', label: 'Xanh dương', color: '#2563eb', soft: 'rgba(37, 99, 235, 0.14)' },
  { id: 'purple', label: 'Tím', color: '#7c3aed', soft: 'rgba(124, 58, 237, 0.14)' },
];

export const RICH_TEXT_TONE_MAP = Object.fromEntries(RICH_TEXT_TONES.map((tone) => [tone.id, tone]));

export function stripRichTextMarkup(value = '') {
  return String(value ?? '')
    .replace(/\[([^\]\n]+)\]\([^)\n]+\)/g, '$1')
    .replace(/\{\{(?:red|yellow|green|blue|purple):([^}\n]+)\}\}/gi, '$1')
    .replace(/<u>([^<\n]+)<\/u>/gi, '$1')
    .replace(/\*\*([^*\n]+)\*\*/g, '$1')
    .replace(/__([^_\n]+)__/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/_([^_\n]+)_/g, '$1')
    .replace(/~~([^~\n]+)~~/g, '$1')
    .replace(/`([^`\n]+)`/g, '$1')
    .replace(/==([^=\n]+)==/g, '$1')
    .replace(/^\s{0,3}#{1,3}\s+/gm, '')
    .replace(/^\s*[-*]\s+\[[ xX]\]\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .trim();
}

export function countRichTextWords(value = '') {
  const plainText = stripRichTextMarkup(value);
  return plainText ? plainText.split(/\s+/).length : 0;
}

export function trimRichTextToWordLimit(value = '', maxWords = Infinity) {
  if (!Number.isFinite(maxWords) || maxWords <= 0) return String(value ?? '');
  const tokens = String(value ?? '').match(/\S+\s*/g);
  if (!tokens || tokens.length <= maxWords) return String(value ?? '');
  return tokens.slice(0, maxWords).join('').trimEnd();
}

export function createRichTextPreview(value = '', maxChars = 140) {
  const plainText = stripRichTextMarkup(value).replace(/\s+/g, ' ');
  if (!plainText) return '';
  if (!Number.isFinite(maxChars) || plainText.length <= maxChars) return plainText;
  return `${plainText.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`;
}

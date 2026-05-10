export const RICH_TEXT_TONES = [
  { id: 'red', label: 'Đỏ', color: '#c96442', soft: 'rgba(201, 100, 66, 0.14)' },
  { id: 'yellow', label: 'Vàng', color: '#b07d3b', soft: 'rgba(176, 125, 59, 0.16)' },
  { id: 'green', label: 'Xanh lá', color: '#5b7a52', soft: 'rgba(91, 122, 82, 0.16)' },
  { id: 'blue', label: 'Xanh dương', color: '#2563eb', soft: 'rgba(37, 99, 235, 0.14)' },
  { id: 'purple', label: 'Tím', color: '#7c3aed', soft: 'rgba(124, 58, 237, 0.14)' },
];

export const RICH_TEXT_TONE_MAP = Object.fromEntries(RICH_TEXT_TONES.map((tone) => [tone.id, tone]));

const INLINE_PATTERNS = [
  { type: 'link', regex: /\[([^\]\n]+)\]\(([^)\n]+)\)/ },
  { type: 'color', regex: /\{\{(red|yellow|green|blue|purple):([^}\n]+)\}\}/i },
  { type: 'underline', regex: /<u>([^<\n]+)<\/u>/i },
  { type: 'bold', regex: /\*\*([^*\n]+)\*\*/ },
  { type: 'strike', regex: /~~([^~\n]+)~~/ },
  { type: 'mark', regex: /==([^=\n]+)==/ },
  { type: 'code', regex: /`([^`\n]+)`/ },
  { type: 'italicStar', regex: /\*([^*\n]+)\*/ },
  { type: 'italicUnderscore', regex: /_([^_\n]+)_/ },
];

function findNextInlineToken(text) {
  let winner = null;

  for (const pattern of INLINE_PATTERNS) {
    const match = pattern.regex.exec(text);
    if (!match) continue;
    if (!winner || match.index < winner.match.index) {
      winner = { ...pattern, match };
    }
  }

  return winner;
}

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

function trimPlainTextWords(value = '', maxWords = 0) {
  if (maxWords <= 0) return { text: '', words: 0, didTrim: true };

  const text = String(value ?? '');
  const leadingWhitespace = text.match(/^\s*/)?.[0] ?? '';
  const body = text.slice(leadingWhitespace.length);
  const tokens = body.match(/\S+\s*/g);
  if (!tokens || tokens.length === 0) {
    return { text, words: 0, didTrim: false };
  }

  if (tokens.length <= maxWords) {
    return { text, words: tokens.length, didTrim: false };
  }

  return {
    text: `${leadingWhitespace}${tokens.slice(0, maxWords).join('')}`.trimEnd(),
    words: maxWords,
    didTrim: true,
  };
}

function wrapInlineToken(type, match, text) {
  if (!text) return '';

  if (type === 'link') return `[${text}](${match[2]})`;
  if (type === 'color') return `{{${String(match[1]).toLowerCase()}:${text}}}`;
  if (type === 'underline') return `<u>${text}</u>`;
  if (type === 'bold') return `**${text}**`;
  if (type === 'strike') return `~~${text}~~`;
  if (type === 'mark') return `==${text}==`;
  if (type === 'code') return `\`${text}\``;
  if (type === 'italicUnderscore') return `_${text}_`;
  return `*${text}*`;
}

function getInlineTokenText(type, match) {
  if (type === 'link') return match[1];
  if (type === 'color') return match[2];
  return match[1];
}

function trimInlineToWordLimit(value = '', maxWords = 0) {
  if (maxWords <= 0) return { text: '', words: 0, didTrim: true };

  let remaining = String(value ?? '');
  let output = '';
  let words = 0;

  while (remaining) {
    const token = findNextInlineToken(remaining);

    if (!token) {
      const plain = trimPlainTextWords(remaining, maxWords - words);
      output += plain.text;
      words += plain.words;
      return { text: output, words, didTrim: plain.didTrim };
    }

    if (token.match.index > 0) {
      const before = remaining.slice(0, token.match.index);
      const plain = trimPlainTextWords(before, maxWords - words);
      output += plain.text;
      words += plain.words;
      if (plain.didTrim) return { text: output, words, didTrim: true };
    }

    const inner = trimInlineToWordLimit(getInlineTokenText(token.type, token.match), maxWords - words);
    output += wrapInlineToken(token.type, token.match, inner.text);
    words += inner.words;
    if (inner.didTrim) return { text: output, words, didTrim: true };

    remaining = remaining.slice(token.match.index + token.match[0].length);
  }

  return { text: output, words, didTrim: false };
}

function splitRichTextLine(line = '') {
  const checklistMatch = line.match(/^(\s*[-*]\s+\[[ xX]\]\s+)(.*)$/);
  if (checklistMatch) return { prefix: checklistMatch[1], body: checklistMatch[2] };

  const headingMatch = line.match(/^(\s{0,3}#{1,3}\s+)(.*)$/);
  if (headingMatch) return { prefix: headingMatch[1], body: headingMatch[2] };

  const calloutMatch = line.match(/^(\s*>\s?)(.*)$/);
  if (calloutMatch) return { prefix: calloutMatch[1], body: calloutMatch[2] };

  return { prefix: '', body: line };
}

export function trimRichTextToWordLimit(value = '', maxWords = Infinity) {
  if (!Number.isFinite(maxWords) || maxWords <= 0) return String(value ?? '');
  if (countRichTextWords(value) <= maxWords) return String(value ?? '');

  let remainingWords = maxWords;
  const lines = String(value ?? '').split(/\r?\n/);
  const outputLines = [];

  for (const line of lines) {
    if (remainingWords <= 0) break;

    const { prefix, body } = splitRichTextLine(line);
    const trimmed = trimInlineToWordLimit(body, remainingWords);
    if (trimmed.text || prefix) {
      outputLines.push(`${prefix}${trimmed.text}`.trimEnd());
    }
    remainingWords -= trimmed.words;
    if (trimmed.didTrim) break;
  }

  return outputLines.join('\n').trimEnd();
}

export function createRichTextPreview(value = '', maxChars = 140) {
  const plainText = stripRichTextMarkup(value).replace(/\s+/g, ' ');
  if (!plainText) return '';
  if (!Number.isFinite(maxChars) || plainText.length <= maxChars) return plainText;
  return `${plainText.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`;
}

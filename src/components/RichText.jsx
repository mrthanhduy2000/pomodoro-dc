import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import {
  RICH_TEXT_TONE_MAP,
  RICH_TEXT_TONES,
  countRichTextWords,
  trimRichTextToWordLimit,
} from '../utils/richText';

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

const GUIDE_EXAMPLES = [
  { id: 'bold', label: 'ưu tiên', className: 'font-bold' },
  { id: 'italic', label: 'ý phụ', className: 'italic' },
  { id: 'underline', label: 'deadline', className: 'underline underline-offset-2' },
  { id: 'mark', label: 'cần chốt', className: 'rounded-[5px] px-1', style: { backgroundColor: 'rgba(176, 125, 59, 0.18)' } },
  { id: 'check', label: 'việc cần làm', className: '' },
];

function clampNumber(value, min, max) {
  if (min > max) return (min + max) / 2;
  return Math.min(Math.max(value, min), max);
}

function escapeHtml(value = '') {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function isNodeInside(parent, node) {
  if (!parent || !node) return false;
  return node === parent || parent.contains(node.nodeType === Node.TEXT_NODE ? node.parentNode : node);
}

function getEditorSelectionRange(editor) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  if (!isNodeInside(editor, range.commonAncestorContainer)) return null;
  return range;
}

function restoreSelectionRange(range) {
  if (!range) return;
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

function getEditorSelectionRect(editor) {
  const range = getEditorSelectionRange(editor);
  if (!range || range.collapsed) return null;

  const rect = range.getBoundingClientRect();
  if (rect.width || rect.height) return rect;

  const firstClientRect = range.getClientRects()[0];
  return firstClientRect ?? null;
}

function getSafeHref(url) {
  const trimmedUrl = String(url ?? '').trim();
  if (/^(https?:\/\/|mailto:|\/)/i.test(trimmedUrl)) return trimmedUrl;
  return null;
}

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

function renderInline(text, keyPrefix = 'inline') {
  const nodes = [];
  let remaining = String(text ?? '');
  let nodeIndex = 0;

  while (remaining) {
    const token = findNextInlineToken(remaining);

    if (!token) {
      nodes.push(remaining);
      break;
    }

    const { match, type } = token;
    if (match.index > 0) {
      nodes.push(remaining.slice(0, match.index));
    }

    const key = `${keyPrefix}_${type}_${nodeIndex}`;
    if (type === 'link') {
      const href = getSafeHref(match[2]);
      nodes.push(href ? (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noreferrer"
          className="font-semibold underline underline-offset-4"
          style={{ color: 'var(--accent, #c96442)' }}
        >
          {renderInline(match[1], `${key}_label`)}
        </a>
      ) : (
        <span key={key}>{renderInline(match[1], `${key}_label`)}</span>
      ));
    } else if (type === 'color') {
      const tone = RICH_TEXT_TONE_MAP[String(match[1]).toLowerCase()] ?? RICH_TEXT_TONE_MAP.red;
      nodes.push(
        <span key={key} style={{ color: tone.color, fontWeight: 650 }}>
          {renderInline(match[2], `${key}_color`)}
        </span>,
      );
    } else if (type === 'underline') {
      nodes.push(
        <span key={key} className="underline decoration-[1.5px] underline-offset-4">
          {renderInline(match[1], `${key}_underline`)}
        </span>,
      );
    } else if (type === 'bold') {
      nodes.push(
        <strong key={key} className="font-bold">
          {renderInline(match[1], `${key}_bold`)}
        </strong>,
      );
    } else if (type === 'strike') {
      nodes.push(
        <span key={key} className="line-through opacity-70">
          {renderInline(match[1], `${key}_strike`)}
        </span>,
      );
    } else if (type === 'mark') {
      nodes.push(
        <mark
          key={key}
          className="rounded-[5px] px-1 py-0.5"
          style={{ backgroundColor: 'rgba(176, 125, 59, 0.18)', color: 'inherit' }}
        >
          {renderInline(match[1], `${key}_mark`)}
        </mark>,
      );
    } else if (type === 'code') {
      nodes.push(
        <code
          key={key}
          className="rounded-md border px-1.5 py-0.5 font-mono text-[0.92em]"
          style={{
            background: 'rgba(31, 30, 29, 0.06)',
            borderColor: 'var(--line, rgba(31,30,29,0.12))',
            color: 'var(--accent-ink, #8a3f24)',
          }}
        >
          {match[1]}
        </code>,
      );
    } else {
      nodes.push(
        <em key={key} className="italic">
          {renderInline(match[1], `${key}_italic`)}
        </em>,
      );
    }

    remaining = remaining.slice(match.index + match[0].length);
    nodeIndex += 1;
  }

  return nodes;
}

function renderInlineHtml(text) {
  const chunks = [];
  let remaining = String(text ?? '');

  while (remaining) {
    const token = findNextInlineToken(remaining);

    if (!token) {
      chunks.push(escapeHtml(remaining));
      break;
    }

    const { match, type } = token;
    if (match.index > 0) {
      chunks.push(escapeHtml(remaining.slice(0, match.index)));
    }

    if (type === 'link') {
      const href = getSafeHref(match[2]);
      chunks.push(href
        ? `<a href="${escapeHtml(href)}" data-rich-link="true" target="_blank" rel="noreferrer" style="color: var(--accent, #c96442); font-weight: 650; text-decoration: underline; text-underline-offset: 4px;">${renderInlineHtml(match[1])}</a>`
        : `<span>${renderInlineHtml(match[1])}</span>`);
    } else if (type === 'color') {
      const toneId = String(match[1]).toLowerCase();
      const tone = RICH_TEXT_TONE_MAP[toneId] ?? RICH_TEXT_TONE_MAP.red;
      chunks.push(`<span data-rich-color="${tone.id}" style="color: ${tone.color}; font-weight: 650;">${renderInlineHtml(match[2])}</span>`);
    } else if (type === 'underline') {
      chunks.push(`<u>${renderInlineHtml(match[1])}</u>`);
    } else if (type === 'bold') {
      chunks.push(`<strong>${renderInlineHtml(match[1])}</strong>`);
    } else if (type === 'strike') {
      chunks.push(`<s style="opacity: 0.72;">${renderInlineHtml(match[1])}</s>`);
    } else if (type === 'mark') {
      chunks.push(`<mark style="background-color: rgba(176, 125, 59, 0.18); border-radius: 5px; color: inherit; padding: 0 4px;">${renderInlineHtml(match[1])}</mark>`);
    } else if (type === 'code') {
      chunks.push(`<code style="background: rgba(31, 30, 29, 0.06); border: 1px solid var(--line, rgba(31,30,29,0.12)); border-radius: 6px; color: var(--accent-ink, #8a3f24); font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 0.92em; padding: 1px 6px;">${escapeHtml(match[1])}</code>`);
    } else {
      chunks.push(`<em>${renderInlineHtml(match[1])}</em>`);
    }

    remaining = remaining.slice(match.index + match[0].length);
  }

  return chunks.join('');
}

function getChecklistControlHtml(checked = false) {
  return `<span data-rich-control="checkbox" contenteditable="false" style="align-items: center; background: ${checked ? 'var(--good-soft, rgba(91,122,82,0.16))' : 'transparent'}; border: 1px solid ${checked ? 'rgba(91,122,82,0.28)' : 'var(--line-2, rgba(31,30,29,0.18))'}; border-radius: 5px; color: var(--good, #5b7a52); display: inline-flex; flex: 0 0 auto; font-size: 10px; font-weight: 700; height: 16px; justify-content: center; line-height: 1; margin-right: 10px; margin-top: 0.18em; width: 16px;">${checked ? '✓' : ''}</span>`;
}

function renderEditorLineHtml(line) {
  if (!String(line ?? '').trim()) return '<div><br></div>';

  const checklistMatch = line.match(/^\s*[-*]\s+\[([ xX])\]\s+(.*)$/);
  if (checklistMatch) {
    const checked = checklistMatch[1].toLowerCase() === 'x';
    return `<div data-rich-block="check" data-checked="${checked ? 'true' : 'false'}" style="display: flex; align-items: flex-start; gap: 0; min-height: 1.7em;">${getChecklistControlHtml(checked)}<span>${renderInlineHtml(checklistMatch[2])}</span></div>`;
  }

  const headingMatch = line.match(/^\s{0,3}(#{1,3})\s+(.+)$/);
  if (headingMatch) {
    const level = String(headingMatch[1].length);
    const fontSize = level === '1' ? '1.05rem' : '0.95rem';
    return `<div data-rich-block="heading" data-level="${level}" style="color: var(--ink, #1f1e1d); font-size: ${fontSize}; font-weight: 650; line-height: 1.35;">${renderInlineHtml(headingMatch[2])}</div>`;
  }

  const calloutMatch = line.match(/^\s*>\s?(.*)$/);
  if (calloutMatch) {
    return `<div data-rich-block="callout" style="background: rgba(201, 100, 66, 0.08); border-left: 2px solid var(--accent, #c96442); border-radius: 12px; color: var(--ink-2, #3a3936); padding: 8px 12px;">${renderInlineHtml(calloutMatch[1])}</div>`;
  }

  return `<div>${renderInlineHtml(line)}</div>`;
}

function richTextToEditorHtml(value = '') {
  const lines = String(value ?? '').split(/\r?\n/);
  return lines.map(renderEditorLineHtml).join('');
}

function serializeNodeChildren(node) {
  return Array.from(node.childNodes ?? []).map((child) => serializeInlineNode(child)).join('');
}

function serializeInlineNode(node) {
  if (!node) return '';
  if (node.nodeType === Node.TEXT_NODE) return node.nodeValue.replace(/\u00a0/g, ' ');
  if (node.nodeType !== Node.ELEMENT_NODE) return '';

  const element = node;
  const tagName = element.tagName.toLowerCase();
  if (tagName === 'br') return '';
  if (element.dataset?.richControl) return '';

  const content = serializeNodeChildren(element);
  if (!content) return '';

  if (element.dataset?.richColor && RICH_TEXT_TONE_MAP[element.dataset.richColor]) {
    return `{{${element.dataset.richColor}:${content}}}`;
  }

  if (tagName === 'a') {
    const href = getSafeHref(element.getAttribute('href'));
    return href ? `[${content}](${href})` : content;
  }

  if (tagName === 'strong' || tagName === 'b') return `**${content}**`;
  if (tagName === 'em' || tagName === 'i') return `*${content}*`;
  if (tagName === 'u') return `<u>${content}</u>`;
  if (tagName === 's' || tagName === 'strike' || tagName === 'del') return `~~${content}~~`;
  if (tagName === 'mark') return `==${content}==`;
  if (tagName === 'code') return `\`${element.textContent.replace(/\s+/g, ' ').trim() || content}\``;

  return content;
}

function isBlockElement(node) {
  if (!node || node.nodeType !== Node.ELEMENT_NODE) return false;
  return ['div', 'p', 'h1', 'h2', 'h3', 'li'].includes(node.tagName.toLowerCase());
}

function serializeBlockNode(node) {
  if (!node) return '';
  if (node.nodeType === Node.TEXT_NODE) return serializeInlineNode(node);
  if (node.nodeType !== Node.ELEMENT_NODE) return '';

  const element = node;
  const tagName = element.tagName.toLowerCase();
  if (tagName === 'br') return '';

  const content = serializeNodeChildren(element).trim();
  const blockType = element.dataset?.richBlock;

  if (blockType === 'check') {
    return `- [${element.dataset.checked === 'true' ? 'x' : ' '}] ${content || 'việc cần làm'}`;
  }

  if (blockType === 'callout') return `> ${content}`;

  if (blockType === 'heading') {
    const level = clampNumber(Number(element.dataset.level) || 1, 1, 3);
    return `${'#'.repeat(level)} ${content}`;
  }

  if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3') {
    const level = clampNumber(Number(tagName.slice(1)) || 1, 1, 3);
    return `${'#'.repeat(level)} ${content}`;
  }

  return content;
}

function serializeEditorRichText(editor) {
  if (!editor) return '';
  const childNodes = Array.from(editor.childNodes);
  if (!childNodes.length) return '';

  if (!childNodes.some(isBlockElement)) {
    return serializeNodeChildren(editor).trim();
  }

  return childNodes.map(serializeBlockNode).join('\n').replace(/\n+$/g, '');
}

function renderRichLine(line, index, compact) {
  const trimmedLine = line.trim();
  const textClassName = compact ? 'text-[11px] leading-5' : 'text-sm leading-[1.7]';

  if (!trimmedLine) {
    return <div key={`blank_${index}`} className={compact ? 'h-1' : 'h-2'} />;
  }

  const checklistMatch = line.match(/^\s*[-*]\s+\[([ xX])\]\s+(.*)$/);
  if (checklistMatch) {
    const checked = checklistMatch[1].toLowerCase() === 'x';
    return (
      <div key={`check_${index}`} className={`flex items-start gap-2.5 ${textClassName}`}>
        <span
          aria-hidden="true"
          className="mt-[0.22em] flex size-4 shrink-0 items-center justify-center rounded-[5px] border text-[10px] font-bold"
          style={{
            background: checked ? 'var(--good-soft, rgba(91,122,82,0.16))' : 'transparent',
            borderColor: checked ? 'rgba(91,122,82,0.28)' : 'var(--line-2, rgba(31,30,29,0.18))',
            color: 'var(--good, #5b7a52)',
          }}
        >
          {checked ? '✓' : ''}
        </span>
        <span className={checked ? 'line-through opacity-70' : ''}>
          {renderInline(checklistMatch[2], `check_${index}`)}
        </span>
      </div>
    );
  }

  const headingMatch = line.match(/^\s{0,3}(#{1,3})\s+(.+)$/);
  if (headingMatch) {
    const sizeClass = headingMatch[1].length === 1
      ? compact ? 'text-[14px]' : 'text-[1.05rem]'
      : compact ? 'text-[12px]' : 'text-[0.95rem]';
    return (
      <p key={`heading_${index}`} className={`${sizeClass} font-semibold leading-tight`} style={{ color: 'var(--ink, #1f1e1d)' }}>
        {renderInline(headingMatch[2], `heading_${index}`)}
      </p>
    );
  }

  const calloutMatch = line.match(/^\s*>\s?(.*)$/);
  if (calloutMatch) {
    return (
      <div
        key={`callout_${index}`}
        className={`rounded-[14px] border-l-2 px-3 py-2 ${textClassName}`}
        style={{
          background: 'rgba(201, 100, 66, 0.08)',
          borderColor: 'var(--accent, #c96442)',
          color: 'var(--ink-2, #3a3936)',
        }}
      >
        {renderInline(calloutMatch[1], `callout_${index}`)}
      </div>
    );
  }

  return (
    <p key={`line_${index}`} className={textClassName}>
      {renderInline(line, `line_${index}`)}
    </p>
  );
}

export function RichTextView({ value, className = '', style, compact = false, placeholder = '' }) {
  const lines = useMemo(() => String(value ?? '').split(/\r?\n/), [value]);
  const hasContent = String(value ?? '').trim().length > 0;

  if (!hasContent && !placeholder) return null;

  return (
    <div
      className={`rich-text-view select-text space-y-2 break-words ${className}`}
      style={{ color: 'inherit', ...style }}
    >
      {hasContent
        ? lines.map((line, index) => renderRichLine(line, index, compact))
        : <p className={compact ? 'text-[11px] leading-5 opacity-60' : 'text-sm leading-[1.7] opacity-60'}>{placeholder}</p>}
    </div>
  );
}

function FormatButton({ children, label, shortcut, onClick, lightTheme }) {
  const title = shortcut ? `${label} (${shortcut})` : label;

  return (
    <button
      type="button"
      aria-label={label}
      title={title}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`flex size-8 items-center justify-center rounded-[10px] border text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 ${
        lightTheme
          ? 'border-[var(--line)] bg-white text-[var(--ink)] hover:border-[var(--line-2)] hover:bg-[rgba(244,242,236,0.94)] focus-visible:ring-[rgba(31,30,29,0.14)]'
          : 'border-white/10 bg-white/[0.04] text-slate-200 hover:border-white/20 hover:bg-white/[0.08] focus-visible:ring-white/30'
      }`}
    >
      {children}
    </button>
  );
}

function FloatingFormatButton({ children, label, shortcut, onClick, lightTheme }) {
  const title = shortcut ? `${label} (${shortcut})` : label;

  return (
    <button
      type="button"
      aria-label={label}
      title={title}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`flex size-8 shrink-0 items-center justify-center rounded-[8px] text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 ${
        lightTheme
          ? 'text-[var(--ink)] hover:bg-[rgba(31,30,29,0.07)] focus-visible:ring-[rgba(31,30,29,0.14)]'
          : 'text-slate-100 hover:bg-white/[0.12] focus-visible:ring-white/30'
      }`}
    >
      {children}
    </button>
  );
}

export function RichNoteEditor({
  value,
  onChange,
  placeholder,
  rows = 4,
  maxWords,
  wordCount,
  lightTheme = false,
  inputStyle,
  roomy = false,
}) {
  const editorShellRef = useRef(null);
  const editorRef = useRef(null);
  const savedRangeRef = useRef(null);
  const lastCommittedValueRef = useRef(String(value ?? ''));
  const [initialEditorHtml] = useState(() => richTextToEditorHtml(value));
  const [showGuide, setShowGuide] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectionState, setSelectionState] = useState({ text: '' });
  const [floatingToolbarStyle, setFloatingToolbarStyle] = useState(null);
  const computedWordCount = useMemo(() => countRichTextWords(value), [value]);
  const visibleWordCount = Number.isFinite(wordCount) ? wordCount : computedWordCount;
  const canShowLimit = Number.isFinite(maxWords);
  const hasPreview = String(value ?? '').trim().length > 0;
  const showFloatingToolbar = Boolean(floatingToolbarStyle && selectionState.text);
  const editorMinHeight = roomy ? 260 : Math.max(116, rows * 26 + 34);

  const hideFloatingToolbar = useCallback(() => {
    setSelectionState({ text: '' });
    setFloatingToolbarStyle(null);
  }, []);

  const commitEditorChange = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const rawValue = serializeEditorRichText(editor);
    const limitedValue = trimRichTextToWordLimit(rawValue, maxWords);
    lastCommittedValueRef.current = limitedValue;
    onChange(limitedValue);

    if (limitedValue !== rawValue) {
      editor.innerHTML = richTextToEditorHtml(limitedValue);
    }
  }, [maxWords, onChange]);

  const updateSelectionFromEditor = useCallback(() => {
    const editor = editorRef.current;
    const editorShell = editorShellRef.current;
    const selection = window.getSelection();
    if (!editor || !editorShell || !selection || selection.rangeCount === 0) {
      hideFloatingToolbar();
      return;
    }

    const range = selection.getRangeAt(0);
    if (!isNodeInside(editor, range.commonAncestorContainer)) {
      hideFloatingToolbar();
      return;
    }

    savedRangeRef.current = range.cloneRange();
    const selectedText = selection.toString();
    if (!selectedText.trim()) {
      hideFloatingToolbar();
      return;
    }

    const selectionRect = getEditorSelectionRect(editor);
    if (!selectionRect) {
      hideFloatingToolbar();
      return;
    }

    const shellRect = editorShell.getBoundingClientRect();
    const relativeLeft = clampNumber(selectionRect.left + selectionRect.width / 2 - shellRect.left, 112, Math.max(112, shellRect.width - 112));
    const relativeTop = Math.max(selectionRect.top - shellRect.top, 44);

    setSelectionState({ text: selectedText });
    setFloatingToolbarStyle({
      left: `${relativeLeft}px`,
      top: `${relativeTop}px`,
      transform: 'translate(-50%, calc(-100% - 10px))',
    });
  }, [hideFloatingToolbar]);

  const scheduleSelectionUpdate = useCallback(() => {
    window.requestAnimationFrame(updateSelectionFromEditor);
  }, [updateSelectionFromEditor]);

  const focusEditor = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
  }, []);

  const placeCaretAtEditorEnd = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return null;
    const lastChild = editor.lastChild;
    const target = isBlockElement(lastChild) ? lastChild : editor;
    if (target !== editor && !target.textContent.trim()) {
      target.innerHTML = '';
    }

    const range = document.createRange();
    range.selectNodeContents(target);
    range.collapse(false);
    restoreSelectionRange(range);
    savedRangeRef.current = range.cloneRange();
    return range;
  }, []);

  const getActiveEditorRange = useCallback((fallbackText = '') => {
    const editor = editorRef.current;
    if (!editor) return null;

    focusEditor();
    let range = getEditorSelectionRange(editor);

    if (!range && savedRangeRef.current && isNodeInside(editor, savedRangeRef.current.commonAncestorContainer)) {
      range = savedRangeRef.current.cloneRange();
      restoreSelectionRange(range);
    }

    if (!range) range = placeCaretAtEditorEnd();
    if (!range) return null;

    if (range.collapsed && fallbackText) {
      const textNode = document.createTextNode(fallbackText);
      range.insertNode(textNode);
      range.selectNodeContents(textNode);
      restoreSelectionRange(range);
    }

    savedRangeRef.current = range.cloneRange();
    return range;
  }, [focusEditor, placeCaretAtEditorEnd]);

  const selectNodeContents = useCallback((node) => {
    const range = document.createRange();
    range.selectNodeContents(node);
    restoreSelectionRange(range);
    savedRangeRef.current = range.cloneRange();
  }, []);

  const runEditorCommand = useCallback((command, fallbackText = 'nội dung') => {
    const range = getActiveEditorRange(fallbackText);
    if (!range) return;
    document.execCommand(command, false, null);
    commitEditorChange();
    scheduleSelectionUpdate();
  }, [commitEditorChange, getActiveEditorRange, scheduleSelectionUpdate]);

  const wrapSelectionWithElement = useCallback((tagName, options = {}, fallbackText = 'nội dung') => {
    const range = getActiveEditorRange(fallbackText);
    if (!range) return;

    const wrapper = document.createElement(tagName);
    Object.entries(options.attrs ?? {}).forEach(([key, attrValue]) => {
      wrapper.setAttribute(key, attrValue);
    });
    Object.entries(options.dataset ?? {}).forEach(([key, dataValue]) => {
      wrapper.dataset[key] = dataValue;
    });
    Object.assign(wrapper.style, options.style ?? {});

    const fragment = range.extractContents();
    wrapper.appendChild(fragment);
    range.insertNode(wrapper);
    selectNodeContents(wrapper);
    commitEditorChange();
    scheduleSelectionUpdate();
  }, [commitEditorChange, getActiveEditorRange, scheduleSelectionUpdate, selectNodeContents]);

  const insertLink = useCallback(() => {
    const input = window.prompt('Dán link', 'https://');
    if (input === null) return;

    const normalizedInput = input.trim();
    if (!normalizedInput) return;

    const href = getSafeHref(normalizedInput) ?? getSafeHref(`https://${normalizedInput}`);
    if (!href) return;

    wrapSelectionWithElement('a', {
      attrs: {
        href,
        'data-rich-link': 'true',
        target: '_blank',
        rel: 'noreferrer',
      },
      style: {
        color: 'var(--accent, #c96442)',
        fontWeight: '650',
        textDecoration: 'underline',
        textUnderlineOffset: '4px',
      },
    }, 'tài liệu');
  }, [wrapSelectionWithElement]);

  const applyColor = useCallback((tone) => {
    wrapSelectionWithElement('span', {
      dataset: { richColor: tone.id },
      style: { color: tone.color, fontWeight: '650' },
    }, tone.label.toLowerCase());
  }, [wrapSelectionWithElement]);

  const makeChecklistControl = useCallback((checked = false) => {
    const control = document.createElement('span');
    control.dataset.richControl = 'checkbox';
    control.contentEditable = 'false';
    control.textContent = checked ? '✓' : '';
    Object.assign(control.style, {
      alignItems: 'center',
      background: checked ? 'var(--good-soft, rgba(91,122,82,0.16))' : 'transparent',
      border: `1px solid ${checked ? 'rgba(91,122,82,0.28)' : 'var(--line-2, rgba(31,30,29,0.18))'}`,
      borderRadius: '5px',
      color: 'var(--good, #5b7a52)',
      display: 'inline-flex',
      flex: '0 0 auto',
      fontSize: '10px',
      fontWeight: '700',
      height: '16px',
      justifyContent: 'center',
      lineHeight: '1',
      marginRight: '10px',
      marginTop: '0.18em',
      width: '16px',
    });
    return control;
  }, []);

  const clearBlockFormatting = useCallback((block) => {
    block.removeAttribute('data-rich-block');
    block.removeAttribute('data-checked');
    block.removeAttribute('data-level');
    block.removeAttribute('style');
    block.querySelectorAll('[data-rich-control]').forEach((node) => node.remove());
  }, []);

  const applyBlockFormat = useCallback((type) => {
    const fallback = type === 'check' ? 'việc cần làm' : 'chỉ làm task này trong phiên';
    const range = getActiveEditorRange(fallback);
    const editor = editorRef.current;
    if (!range || !editor) return;

    let blocks = Array.from(editor.children).filter((child) => {
      try {
        return range.intersectsNode(child);
      } catch {
        return false;
      }
    });

    if (!blocks.length) {
      const block = document.createElement('div');
      if (range.collapsed) {
        block.textContent = fallback;
      } else {
        block.appendChild(range.extractContents());
      }
      range.insertNode(block);
      blocks = [block];
    }

    blocks.forEach((block) => {
      clearBlockFormatting(block);

      if (!block.textContent.trim()) block.appendChild(document.createTextNode(fallback));

      if (type === 'check') {
        block.dataset.richBlock = 'check';
        block.dataset.checked = 'false';
        Object.assign(block.style, {
          alignItems: 'flex-start',
          display: 'flex',
          gap: '0',
          minHeight: '1.7em',
        });
        block.prepend(makeChecklistControl(false));
      } else if (type === 'callout') {
        block.dataset.richBlock = 'callout';
        Object.assign(block.style, {
          background: 'rgba(201, 100, 66, 0.08)',
          borderLeft: '2px solid var(--accent, #c96442)',
          borderRadius: '12px',
          color: 'var(--ink-2, #3a3936)',
          padding: '8px 12px',
        });
      }
    });

    const targetBlock = blocks[blocks.length - 1];
    const nextRange = document.createRange();
    nextRange.selectNodeContents(targetBlock);
    nextRange.collapse(false);
    restoreSelectionRange(nextRange);
    savedRangeRef.current = nextRange.cloneRange();
    commitEditorChange();
    scheduleSelectionUpdate();
  }, [clearBlockFormatting, commitEditorChange, getActiveEditorRange, makeChecklistControl, scheduleSelectionUpdate]);

  const applyFormat = useCallback((format, payload = null) => {
    if (format === 'bold') runEditorCommand('bold', 'ưu tiên');
    else if (format === 'italic') runEditorCommand('italic', 'ý phụ');
    else if (format === 'underline') runEditorCommand('underline', 'deadline');
    else if (format === 'strike') runEditorCommand('strikeThrough', 'bỏ qua');
    else if (format === 'code') {
      wrapSelectionWithElement('code', {
        style: {
          background: 'rgba(31, 30, 29, 0.06)',
          border: '1px solid var(--line, rgba(31,30,29,0.12))',
          borderRadius: '6px',
          color: 'var(--accent-ink, #8a3f24)',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSize: '0.92em',
          padding: '1px 6px',
        },
      }, 'npm test');
    } else if (format === 'link') insertLink();
    else if (format === 'mark') {
      wrapSelectionWithElement('mark', {
        style: {
          backgroundColor: 'rgba(176, 125, 59, 0.18)',
          borderRadius: '5px',
          color: 'inherit',
          padding: '0 4px',
        },
      }, 'cần chốt');
    } else if (format === 'color') applyColor(payload);
    else if (format === 'check') applyBlockFormat('check');
    else if (format === 'callout') applyBlockFormat('callout');
  }, [applyBlockFormat, applyColor, insertLink, runEditorCommand, wrapSelectionWithElement]);

  const handleKeyDown = useCallback((event) => {
    const usesModifier = event.metaKey || event.ctrlKey;
    if (!usesModifier || event.altKey) return;

    const key = event.key.toLowerCase();
    const code = event.code;
    if (!event.shiftKey && key === 'b') {
      event.preventDefault();
      applyFormat('bold');
    } else if (!event.shiftKey && key === 'i') {
      event.preventDefault();
      applyFormat('italic');
    } else if (!event.shiftKey && key === 'u') {
      event.preventDefault();
      applyFormat('underline');
    } else if (!event.shiftKey && key === 'k') {
      event.preventDefault();
      applyFormat('link');
    } else if (!event.shiftKey && key === 'e') {
      event.preventDefault();
      applyFormat('code');
    } else if (event.shiftKey && key === 'x') {
      event.preventDefault();
      applyFormat('strike');
    } else if (event.shiftKey && key === 'h') {
      event.preventDefault();
      applyFormat('mark');
    } else if (event.shiftKey && (key === '7' || code === 'Digit7')) {
      event.preventDefault();
      applyFormat('check');
    } else if (event.shiftKey && (key === '9' || code === 'Digit9')) {
      event.preventDefault();
      applyFormat('callout');
    }
  }, [applyFormat]);

  const handleEditorInput = useCallback(() => {
    commitEditorChange();
    scheduleSelectionUpdate();
  }, [commitEditorChange, scheduleSelectionUpdate]);

  const handlePaste = useCallback((event) => {
    event.preventDefault();
    const text = event.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    commitEditorChange();
  }, [commitEditorChange]);

  useEffect(() => {
    if (!showFloatingToolbar) return undefined;
    const handleResize = () => updateSelectionFromEditor();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showFloatingToolbar, updateSelectionFromEditor]);

  useEffect(() => {
    const handleSelectionChange = () => {
      const editor = editorRef.current;
      const selection = window.getSelection();
      if (!editor || !selection || selection.rangeCount === 0) return;
      if (isNodeInside(editor, selection.getRangeAt(0).commonAncestorContainer)) {
        scheduleSelectionUpdate();
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [scheduleSelectionUpdate]);

  useEffect(() => {
    const nextValue = String(value ?? '');
    if (nextValue === lastCommittedValueRef.current) return;

    const editor = editorRef.current;
    if (!editor) return;
    editor.innerHTML = richTextToEditorHtml(nextValue);
    lastCommittedValueRef.current = nextValue;
  }, [value]);

  return (
    <div ref={editorShellRef} className="relative space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <FormatButton label="In đậm" shortcut="Cmd/Ctrl+B" lightTheme={lightTheme} onClick={() => applyFormat('bold')}>
          <strong>B</strong>
        </FormatButton>
        <FormatButton label="In nghiêng" shortcut="Cmd/Ctrl+I" lightTheme={lightTheme} onClick={() => applyFormat('italic')}>
          <em>I</em>
        </FormatButton>
        <FormatButton label="Gạch chân" shortcut="Cmd/Ctrl+U" lightTheme={lightTheme} onClick={() => applyFormat('underline')}>
          <span className="underline underline-offset-2">U</span>
        </FormatButton>
        <FormatButton label="Gạch ngang" shortcut="Cmd/Ctrl+Shift+X" lightTheme={lightTheme} onClick={() => applyFormat('strike')}>
          <span className="line-through">S</span>
        </FormatButton>
        <FormatButton label="Inline code" shortcut="Cmd/Ctrl+E" lightTheme={lightTheme} onClick={() => applyFormat('code')}>
          <code className="font-mono text-[11px]">{'<'}</code>
        </FormatButton>
        <FormatButton label="Link" shortcut="Cmd/Ctrl+K" lightTheme={lightTheme} onClick={() => applyFormat('link')}>
          <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" />
            <path d="M14 11a5 5 0 0 0-7.1 0l-2 2a5 5 0 0 0 7.1 7.1l1.1-1.1" />
          </svg>
        </FormatButton>
        <FormatButton label="Checklist" shortcut="Cmd/Ctrl+Shift+7" lightTheme={lightTheme} onClick={() => applyFormat('check')}>
          <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="4" width="16" height="16" rx="3" />
            <path d="M8 12l2.4 2.4L16 9" />
          </svg>
        </FormatButton>
        <FormatButton label="Callout" shortcut="Cmd/Ctrl+Shift+9" lightTheme={lightTheme} onClick={() => applyFormat('callout')}>
          <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 5h14v10H8l-3 3z" />
          </svg>
        </FormatButton>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => applyFormat('mark')}
          aria-label="Highlight vàng"
          title="Highlight vàng (Cmd/Ctrl+Shift+H)"
          className={`flex size-8 items-center justify-center rounded-[10px] border transition-colors focus-visible:outline-none focus-visible:ring-2 ${
            lightTheme
              ? 'border-[rgba(176,125,59,0.22)] bg-[rgba(176,125,59,0.14)] focus-visible:ring-[rgba(31,30,29,0.14)]'
              : 'border-amber-300/20 bg-amber-300/10 focus-visible:ring-white/30'
          }`}
        >
          <span className="size-3 rounded-full" style={{ background: '#b07d3b' }} />
        </button>
        <div className="flex items-center gap-1.5">
          {RICH_TEXT_TONES.map((tone) => (
            <button
              key={tone.id}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => applyFormat('color', tone)}
              aria-label={`Màu ${tone.label}`}
              title={`Màu ${tone.label}`}
              className="flex size-7 items-center justify-center rounded-full border transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(31,30,29,0.14)]"
              style={{ background: tone.soft, borderColor: `${tone.color}44` }}
            >
              <span className="size-3 rounded-full" style={{ background: tone.color }} />
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowGuide((current) => !current)}
          className={`ml-auto rounded-full border px-3 py-1.5 text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 ${
            lightTheme
              ? 'border-[var(--line)] bg-white text-[var(--muted)] hover:text-[var(--ink)] focus-visible:ring-[rgba(31,30,29,0.14)]'
              : 'border-white/10 bg-white/[0.04] text-slate-400 hover:text-slate-100 focus-visible:ring-white/30'
          }`}
        >
          Cách dùng
        </button>
      </div>

      <AnimatePresence>
        {showFloatingToolbar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={floatingToolbarStyle}
            onMouseDown={(event) => event.preventDefault()}
            role="toolbar"
            aria-label="Định dạng đoạn đang chọn"
            className={`absolute z-30 flex max-w-[min(92vw,560px)] items-center gap-1 overflow-x-auto rounded-[12px] border px-1.5 py-1.5 shadow-[0_14px_40px_rgba(15,23,42,0.22)] backdrop-blur-xl ${
              lightTheme
                ? 'border-[rgba(31,30,29,0.12)] bg-[rgba(255,255,255,0.96)]'
                : 'border-white/10 bg-slate-950/90'
            }`}
          >
            <FloatingFormatButton label="In đậm" shortcut="Cmd/Ctrl+B" lightTheme={lightTheme} onClick={() => applyFormat('bold')}>
              <strong>B</strong>
            </FloatingFormatButton>
            <FloatingFormatButton label="In nghiêng" shortcut="Cmd/Ctrl+I" lightTheme={lightTheme} onClick={() => applyFormat('italic')}>
              <em>I</em>
            </FloatingFormatButton>
            <FloatingFormatButton label="Gạch chân" shortcut="Cmd/Ctrl+U" lightTheme={lightTheme} onClick={() => applyFormat('underline')}>
              <span className="underline underline-offset-2">U</span>
            </FloatingFormatButton>
            <FloatingFormatButton label="Gạch ngang" shortcut="Cmd/Ctrl+Shift+X" lightTheme={lightTheme} onClick={() => applyFormat('strike')}>
              <span className="line-through">S</span>
            </FloatingFormatButton>
            <FloatingFormatButton label="Inline code" shortcut="Cmd/Ctrl+E" lightTheme={lightTheme} onClick={() => applyFormat('code')}>
              <code className="font-mono text-[11px]">{'<'}</code>
            </FloatingFormatButton>
            <FloatingFormatButton label="Link" shortcut="Cmd/Ctrl+K" lightTheme={lightTheme} onClick={() => applyFormat('link')}>
              <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" />
                <path d="M14 11a5 5 0 0 0-7.1 0l-2 2a5 5 0 0 0 7.1 7.1l1.1-1.1" />
              </svg>
            </FloatingFormatButton>
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => applyFormat('mark')}
              aria-label="Highlight vàng"
              title="Highlight vàng (Cmd/Ctrl+Shift+H)"
              className={`flex size-8 shrink-0 items-center justify-center rounded-[8px] transition-colors focus-visible:outline-none focus-visible:ring-2 ${
                lightTheme
                  ? 'hover:bg-[rgba(176,125,59,0.13)] focus-visible:ring-[rgba(31,30,29,0.14)]'
                  : 'hover:bg-amber-300/10 focus-visible:ring-white/30'
              }`}
            >
              <span className="size-3 rounded-full" style={{ background: '#b07d3b' }} />
            </button>
            <span className={`mx-1 h-5 w-px shrink-0 ${lightTheme ? 'bg-[rgba(31,30,29,0.12)]' : 'bg-white/10'}`} />
            {RICH_TEXT_TONES.map((tone) => (
              <button
                key={`floating_${tone.id}`}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => applyFormat('color', tone)}
                aria-label={`Màu ${tone.label}`}
                title={`Màu ${tone.label}`}
                className="flex size-7 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(31,30,29,0.14)]"
                style={{ background: tone.soft }}
              >
                <span className="size-3 rounded-full" style={{ background: tone.color }} />
              </button>
            ))}
            <span className={`mx-1 h-5 w-px shrink-0 ${lightTheme ? 'bg-[rgba(31,30,29,0.12)]' : 'bg-white/10'}`} />
            <FloatingFormatButton label="Checklist" shortcut="Cmd/Ctrl+Shift+7" lightTheme={lightTheme} onClick={() => applyFormat('check')}>
              <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="4" width="16" height="16" rx="3" />
                <path d="M8 12l2.4 2.4L16 9" />
              </svg>
            </FloatingFormatButton>
            <FloatingFormatButton label="Callout" shortcut="Cmd/Ctrl+Shift+9" lightTheme={lightTheme} onClick={() => applyFormat('callout')}>
              <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 5h14v10H8l-3 3z" />
              </svg>
            </FloatingFormatButton>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          role="textbox"
          aria-multiline="true"
          aria-label="Ghi chú phiên"
          suppressContentEditableWarning
          dangerouslySetInnerHTML={{ __html: initialEditorHtml }}
          onInput={handleEditorInput}
          onKeyDown={handleKeyDown}
          onKeyUp={scheduleSelectionUpdate}
          onMouseUp={scheduleSelectionUpdate}
          onPaste={handlePaste}
          onScroll={scheduleSelectionUpdate}
          onFocus={() => {
            setIsFocused(true);
            scheduleSelectionUpdate();
          }}
          onBlur={() => {
            setIsFocused(false);
            window.setTimeout(() => {
              if (!editorShellRef.current?.contains(document.activeElement)) {
                hideFloatingToolbar();
              }
            }, 0);
          }}
          className={`rich-note-editor w-full overflow-y-auto rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm leading-relaxed shadow-none outline-none transition-all empty:before:pointer-events-none focus:border-white/[0.16] focus:bg-white/[0.07] ${
            roomy ? 'resize-y' : ''
          }`}
          style={{
            ...inputStyle,
            minHeight: editorMinHeight,
            scrollbarWidth: roomy ? 'thin' : 'none',
          }}
        />
        {!hasPreview && !isFocused && placeholder && (
          <p className={`pointer-events-none absolute left-3 right-3 top-2.5 text-sm leading-relaxed ${
            lightTheme ? 'text-[var(--muted-2)]' : 'text-slate-600'
          }`}>
            {placeholder}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {GUIDE_EXAMPLES.map((item) => (
            <button
              key={item.id}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => applyFormat(item.id)}
              className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 ${
                lightTheme
                  ? 'border-[var(--line)] bg-[rgba(244,242,236,0.82)] text-[var(--muted)] hover:bg-white focus-visible:ring-[rgba(31,30,29,0.14)]'
                  : 'border-white/10 bg-white/[0.035] text-slate-500 hover:text-slate-200 focus-visible:ring-white/30'
              }`}
            >
              {item.id === 'check' && (
                <span
                  aria-hidden="true"
                  className="mr-1 inline-flex size-3 items-center justify-center rounded-[4px] border align-[-2px]"
                  style={{ borderColor: 'var(--line-2, rgba(31,30,29,0.18))' }}
                />
              )}
              <span className={item.className} style={item.style}>{item.label}</span>
            </button>
          ))}
        </div>
        {canShowLimit && (
          <span className={`mono text-[10px] ${lightTheme ? 'text-[var(--muted-2)]' : 'text-slate-600'}`}>
            {visibleWordCount}/{maxWords} từ
          </span>
        )}
      </div>

      <AnimatePresence initial={false}>
        {showGuide && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={`grid gap-2 rounded-[18px] border px-3 py-3 text-[11px] leading-5 sm:grid-cols-2 ${
              lightTheme
                ? 'border-[var(--line)] bg-[rgba(250,249,246,0.9)] text-[var(--muted)]'
                : 'border-white/10 bg-white/[0.035] text-slate-400'
            }`}
          >
            <span><strong className={lightTheme ? 'text-[var(--ink)]' : 'text-slate-200'}>Cmd/Ctrl+B</strong> in đậm đoạn đang chọn.</span>
            <span><strong className={lightTheme ? 'text-[var(--ink)]' : 'text-slate-200'}>Cmd/Ctrl+I</strong> in nghiêng.</span>
            <span><strong className={lightTheme ? 'text-[var(--ink)]' : 'text-slate-200'}>Cmd/Ctrl+U</strong> gạch chân.</span>
            <span><strong className={lightTheme ? 'text-[var(--ink)]' : 'text-slate-200'}>Cmd/Ctrl+K</strong> chèn link.</span>
            <span><strong className={lightTheme ? 'text-[var(--ink)]' : 'text-slate-200'}>Cmd/Ctrl+E</strong> inline code.</span>
            <span><strong className={lightTheme ? 'text-[var(--ink)]' : 'text-slate-200'}>Cmd/Ctrl+Shift+X</strong> gạch ngang.</span>
            <span><strong className={lightTheme ? 'text-[var(--ink)]' : 'text-slate-200'}>Cmd/Ctrl+Shift+H</strong> highlight.</span>
            <span><strong className={lightTheme ? 'text-[var(--ink)]' : 'text-slate-200'}>Cmd/Ctrl+Shift+7/9</strong> checklist hoặc callout.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {hasPreview && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-[18px] border px-3 py-3 ${
            lightTheme
              ? 'border-[var(--line)] bg-white/70 text-[var(--ink-2)]'
              : 'border-white/10 bg-black/10 text-slate-300'
          }`}
        >
          <p className={`mono mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] ${
            lightTheme ? 'text-[var(--muted-2)]' : 'text-slate-600'
          }`}>
            Xem trước
          </p>
          <RichTextView value={value} compact={!roomy} />
        </motion.div>
      )}
    </div>
  );
}

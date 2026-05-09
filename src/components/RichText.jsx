import React, { useCallback, useMemo, useRef, useState } from 'react';
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
  { label: 'Đậm', syntax: '**ưu tiên**' },
  { label: 'Nghiêng', syntax: '*ý phụ*' },
  { label: 'Gạch chân', syntax: '<u>deadline</u>' },
  { label: 'Highlight', syntax: '==cần chốt==' },
  { label: 'Checklist', syntax: '- [ ] việc cần làm' },
];

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

function FormatButton({ children, label, onClick, lightTheme }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
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
  const textareaRef = useRef(null);
  const [showGuide, setShowGuide] = useState(false);
  const computedWordCount = useMemo(() => countRichTextWords(value), [value]);
  const visibleWordCount = Number.isFinite(wordCount) ? wordCount : computedWordCount;
  const canShowLimit = Number.isFinite(maxWords);
  const hasPreview = String(value ?? '').trim().length > 0;

  const commitChange = useCallback((nextValue, nextSelectionStart = null, nextSelectionEnd = null) => {
    const limitedValue = trimRichTextToWordLimit(nextValue, maxWords);
    onChange(limitedValue);

    if (nextSelectionStart !== null && nextSelectionEnd !== null) {
      window.requestAnimationFrame(() => {
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(nextSelectionStart, nextSelectionEnd);
      });
    }
  }, [maxWords, onChange]);

  const wrapSelection = useCallback((prefix, suffix, fallback = 'nội dung') => {
    const textarea = textareaRef.current;
    const currentValue = String(value ?? '');
    const start = textarea?.selectionStart ?? currentValue.length;
    const end = textarea?.selectionEnd ?? currentValue.length;
    const selected = currentValue.slice(start, end) || fallback;
    const nextValue = `${currentValue.slice(0, start)}${prefix}${selected}${suffix}${currentValue.slice(end)}`;
    const selectionStart = start + prefix.length;
    const selectionEnd = selectionStart + selected.length;
    commitChange(nextValue, selectionStart, selectionEnd);
  }, [commitChange, value]);

  const insertBlock = useCallback((prefix, fallback = 'việc cần làm') => {
    const textarea = textareaRef.current;
    const currentValue = String(value ?? '');
    const start = textarea?.selectionStart ?? currentValue.length;
    const end = textarea?.selectionEnd ?? currentValue.length;
    const selected = currentValue.slice(start, end);
    const lineStart = start > 0 && currentValue[start - 1] !== '\n' ? '\n' : '';
    const lineEnd = currentValue[end] && currentValue[end] !== '\n' ? '\n' : '';
    const body = selected
      ? selected.split(/\r?\n/).map((line) => (line.trim() ? `${prefix}${line.replace(/^\s*[-*]\s+\[[ xX]\]\s+/, '')}` : line)).join('\n')
      : `${prefix}${fallback}`;
    const nextValue = `${currentValue.slice(0, start)}${lineStart}${body}${lineEnd}${currentValue.slice(end)}`;
    const selectionStart = start + lineStart.length + prefix.length;
    const selectionEnd = selectionStart + (selected ? Math.max(selected.split(/\r?\n/)[0]?.length ?? 0, 0) : fallback.length);
    commitChange(nextValue, selectionStart, selectionEnd);
  }, [commitChange, value]);

  const insertLink = useCallback(() => {
    const textarea = textareaRef.current;
    const currentValue = String(value ?? '');
    const start = textarea?.selectionStart ?? currentValue.length;
    const end = textarea?.selectionEnd ?? currentValue.length;
    const selected = currentValue.slice(start, end) || 'tài liệu';
    const url = 'https://';
    const snippet = `[${selected}](${url})`;
    const nextValue = `${currentValue.slice(0, start)}${snippet}${currentValue.slice(end)}`;
    const urlStart = start + selected.length + 3;
    commitChange(nextValue, urlStart, urlStart + url.length);
  }, [commitChange, value]);

  const handleKeyDown = useCallback((event) => {
    const usesModifier = event.metaKey || event.ctrlKey;
    if (!usesModifier || event.altKey) return;

    const key = event.key.toLowerCase();
    if (key === 'b') {
      event.preventDefault();
      wrapSelection('**', '**', 'ưu tiên');
    } else if (key === 'i') {
      event.preventDefault();
      wrapSelection('*', '*', 'ý phụ');
    } else if (key === 'u') {
      event.preventDefault();
      wrapSelection('<u>', '</u>', 'deadline');
    } else if (key === 'k') {
      event.preventDefault();
      insertLink();
    }
  }, [insertLink, wrapSelection]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <FormatButton label="In đậm" lightTheme={lightTheme} onClick={() => wrapSelection('**', '**', 'ưu tiên')}>
          <strong>B</strong>
        </FormatButton>
        <FormatButton label="In nghiêng" lightTheme={lightTheme} onClick={() => wrapSelection('*', '*', 'ý phụ')}>
          <em>I</em>
        </FormatButton>
        <FormatButton label="Gạch chân" lightTheme={lightTheme} onClick={() => wrapSelection('<u>', '</u>', 'deadline')}>
          <span className="underline underline-offset-2">U</span>
        </FormatButton>
        <FormatButton label="Gạch ngang" lightTheme={lightTheme} onClick={() => wrapSelection('~~', '~~', 'bỏ qua')}>
          <span className="line-through">S</span>
        </FormatButton>
        <FormatButton label="Inline code" lightTheme={lightTheme} onClick={() => wrapSelection('`', '`', 'npm test')}>
          <code className="font-mono text-[11px]">{'<'}</code>
        </FormatButton>
        <FormatButton label="Link" lightTheme={lightTheme} onClick={insertLink}>
          <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" />
            <path d="M14 11a5 5 0 0 0-7.1 0l-2 2a5 5 0 0 0 7.1 7.1l1.1-1.1" />
          </svg>
        </FormatButton>
        <FormatButton label="Checklist" lightTheme={lightTheme} onClick={() => insertBlock('- [ ] ', 'việc cần làm')}>
          <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="4" width="16" height="16" rx="3" />
            <path d="M8 12l2.4 2.4L16 9" />
          </svg>
        </FormatButton>
        <FormatButton label="Callout" lightTheme={lightTheme} onClick={() => insertBlock('> ', 'chỉ làm task này trong phiên')}>
          <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 5h14v10H8l-3 3z" />
          </svg>
        </FormatButton>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => wrapSelection('==', '==', 'cần chốt')}
          aria-label="Highlight vàng"
          title="Highlight vàng"
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
              onClick={() => wrapSelection(`{{${tone.id}:`, '}}', tone.label.toLowerCase())}
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

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => commitChange(event.target.value)}
        onKeyDown={handleKeyDown}
        rows={rows}
        placeholder={placeholder}
        className={`w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm leading-relaxed shadow-none outline-none transition-all placeholder-slate-600 focus:border-white/[0.16] focus:bg-white/[0.07] ${
          roomy ? 'min-h-[260px] resize-y' : 'resize-none'
        }`}
        style={{ ...inputStyle, scrollbarWidth: roomy ? 'thin' : 'none' }}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {GUIDE_EXAMPLES.map((item) => (
            <button
              key={item.label}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => wrapSelection('', '', item.syntax)}
              className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 ${
                lightTheme
                  ? 'border-[var(--line)] bg-[rgba(244,242,236,0.82)] text-[var(--muted)] hover:bg-white focus-visible:ring-[rgba(31,30,29,0.14)]'
                  : 'border-white/10 bg-white/[0.035] text-slate-500 hover:text-slate-200 focus-visible:ring-white/30'
              }`}
            >
              {item.syntax}
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

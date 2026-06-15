import React from 'react';
import { SKILL_GLYPHS, BRANCH_GLYPHS, LOCK_GLYPH, BOLT_GLYPH, FLAME_GLYPH, SPARK_GLYPH, SHIELD_GLYPH } from './glyphData';

/**
 * Glyph — vẽ một pictogram SVG tự thiết kế. Dùng currentColor nên tự đổi màu
 * theo trạng thái nút và theo skin. markup = phần bên trong <svg>.
 */
export function Glyph({ markup, size = 22, strokeWidth = 1.7, style }) {
  if (!markup) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: 'block', ...style }}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}

export function SkillGlyph({ id, locked, size = 20 }) {
  return <Glyph markup={locked ? LOCK_GLYPH : SKILL_GLYPHS[id]} size={size} />;
}

export function BranchGlyph({ branch, size = 22 }) {
  return <Glyph markup={BRANCH_GLYPHS[branch]} size={size} />;
}

export function BoltGlyph({ size = 13 }) {
  return <Glyph markup={BOLT_GLYPH} size={size} />;
}

export function FlameGlyph({ size = 16 }) {
  return <Glyph markup={FLAME_GLYPH} size={size} />;
}

export function SparkGlyph({ size = 13 }) {
  return <Glyph markup={SPARK_GLYPH} size={size} />;
}

export function ShieldGlyph({ size = 16 }) {
  return <Glyph markup={SHIELD_GLYPH} size={size} />;
}

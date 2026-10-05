import type { FilmStyle, ScriptParts } from '../../frontend/shared/types/phase1';

// What the Script page saves as a draft, so the draft opens the way it was left. Like the composer's,
// it is stored in the draft's payload on the server, which keeps whatever it is given, so it is checked
// before it is trusted.

export type ScriptLength = 15 | 30 | 60;

export interface ScriptDraft {
  v: 1;
  idea: string;
  length: ScriptLength;
  style: FilmStyle;
  script: ScriptParts;
}

const LENGTHS: readonly ScriptLength[] = [15, 30, 60];
const STYLES: readonly FilmStyle[] = ['talking', 'dance', 'skit', 'text'];

const text = (v: unknown, max: number): string => (typeof v === 'string' ? v.slice(0, max) : '');

/** The script a payload describes, or null when it isn't one of ours. */
export function readScriptDraft(payload: unknown): ScriptDraft | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as Record<string, unknown>;
  if (p.v !== 1 || !p.script || typeof p.script !== 'object') return null;
  const s = p.script as Record<string, unknown>;
  const script: ScriptParts = { hook: text(s.hook, 1000), story: text(s.story, 1000), lesson: text(s.lesson, 1000), cta: text(s.cta, 1000) };
  if (!Object.values(script).some((t) => t.trim())) return null;
  return {
    v: 1,
    idea: text(p.idea, 300),
    length: (LENGTHS as readonly unknown[]).includes(p.length) ? (p.length as ScriptLength) : 30,
    style: (STYLES as readonly unknown[]).includes(p.style) ? (p.style as FilmStyle) : 'talking',
    script,
  };
}

/** A fresh id for a script draft: the same id is used every time it is saved again. */
export const newScriptDraftId = (): string => `script-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** The whole script as plain text, for notes or a teleprompter. */
export function scriptAsText(s: ScriptParts): string {
  return [
    ['HOOK', s.hook],
    ['STORY', s.story],
    ['KEY LESSON', s.lesson],
    ['ASK VIEWERS', s.cta],
  ]
    .filter(([, t]) => t.trim())
    .map(([label, t]) => `${label}:\n${t.trim()}`)
    .join('\n\n');
}

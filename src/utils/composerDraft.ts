// What the post composer saves as a draft, so the draft opens the way it was left. It is stored in the
// draft's payload on the server, which keeps whatever it is given; a draft saved by an older version
// (or by another screen) may hold anything, so it is checked before it is trusted.

export type ComposerFormat = 'short_video' | 'carousel' | 'image' | 'text' | 'long_video';
export type ComposerFilmMethod = 'native' | 'camera' | 'upload';
export type ComposerFilmStyle = 'talking' | 'dance' | 'skit' | 'text';

export interface ComposerDraft {
  v: 1;
  idea: string;
  caption: string;
  tags: string[];
  platforms: string[];
  format: ComposerFormat;
  filmMethod: ComposerFilmMethod;
  filmStyle: ComposerFilmStyle;
  overlay: string;
  /** ISO time the creator had picked, if any. */
  at: string | null;
}

const FORMATS: readonly ComposerFormat[] = ['short_video', 'carousel', 'image', 'text', 'long_video'];
const METHODS: readonly ComposerFilmMethod[] = ['native', 'camera', 'upload'];
const STYLES: readonly ComposerFilmStyle[] = ['talking', 'dance', 'skit', 'text'];

const text = (v: unknown, max: number): string => (typeof v === 'string' ? v.slice(0, max) : '');
const list = (v: unknown, max: number, each: number): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').map((x) => x.slice(0, each)).slice(0, max) : [];
const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed as readonly string[]).includes(v as string) ? (v as T) : fallback;

/** The draft a payload describes, or null when it isn't one of ours. */
export function readComposerDraft(payload: unknown): ComposerDraft | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as Record<string, unknown>;
  if (p.v !== 1) return null;
  const at = typeof p.at === 'string' && !Number.isNaN(Date.parse(p.at)) ? p.at : null;
  return {
    v: 1,
    idea: text(p.idea, 300),
    caption: text(p.caption, 5000),
    tags: list(p.tags, 30, 100),
    platforms: list(p.platforms, 10, 20),
    format: pick(p.format, FORMATS, 'short_video'),
    filmMethod: pick(p.filmMethod, METHODS, 'native'),
    filmStyle: pick(p.filmStyle, STYLES, 'talking'),
    overlay: text(p.overlay, 80),
    at,
  };
}

/** A fresh id for a draft the composer starts: the same id is used every time it is saved again. */
export const newDraftId = (): string => `post-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** The first line of a caption, to name a draft that has no idea behind it. */
export function firstLine(caption: string, max = 60): string {
  const line = caption.split('\n')[0]?.trim() ?? '';
  return line.length > max ? `${line.slice(0, max - 1).trimEnd()}…` : line;
}

// Who is signed in: the creator's name, handle and photo, read from the Supabase
// user. Pure (no Supabase import) so it is easy to unit-test.

/** The bits of a Supabase `User` we read. */
export interface ProfileUserLike {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}

export interface UserIdentity {
  /** Full display name. */
  name: string;
  /** First name only, for greetings. Empty when nothing is known. */
  firstName: string;
  /** "@something", or '' when nothing is known. */
  handle: string;
  /** Photo URL, or null (the UI then shows its normal "no photo" state). */
  avatarUrl: string | null;
  email: string;
}

export const EMPTY_IDENTITY: UserIdentity = { name: '', firstName: '', handle: '', avatarUrl: null, email: '' };

const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

/** Part of the email before '@', without a "+tag" (plus-addressing). */
export function emailLocalPart(email: string): string {
  const at = email.indexOf('@');
  const local = (at >= 0 ? email.slice(0, at) : email).trim();
  const plus = local.indexOf('+');
  return (plus > 0 ? local.slice(0, plus) : local).trim();
}

/**
 * First name for greetings. "Ada Lovelace" -> "Ada". A single token that looks
 * like an email name ("john.doe", "john_doe") -> "John".
 */
export function firstNameOf(name: string | null | undefined): string {
  const n = (name ?? '').trim();
  if (!n) return '';
  const first = n.split(/\s+/)[0];
  if (n === first && /[._-]/.test(first)) {
    const seg = first.split(/[._-]+/).find(Boolean) ?? '';
    return seg.charAt(0).toUpperCase() + seg.slice(1);
  }
  return first;
}

/** First usable http(s) / data image URL, or null. */
function imageUrl(...candidates: unknown[]): string | null {
  for (const c of candidates) {
    const s = text(c);
    if (/^(https?:\/\/|data:image\/)/i.test(s)) return s;
  }
  return null;
}

export function profileFromUser(user: ProfileUserLike | null | undefined): UserIdentity {
  if (!user) return EMPTY_IDENTITY;
  const meta = user.user_metadata ?? {};
  const email = text(user.email);
  const local = emailLocalPart(email);

  // full_name (Google), then name, then the username the email-code sign-up saves, then the email.
  const name = text(meta.full_name) || text(meta.name) || text(meta.username) || local;

  // TODO(usernames): use a real, unique username once the app has them; until then the handle is the email name.
  const handle = local ? `@${local.replace(/\s+/g, '').toLowerCase()}` : '';

  return {
    name,
    firstName: firstNameOf(name),
    handle,
    avatarUrl: imageUrl(meta.avatar_url, meta.picture),
    email,
  };
}

/**
 * Puts the first name into a sentence written as "..., {name}! ...". With no
 * name the ", {name}" part is dropped: "Ready, {name}! Go" -> "Ready! Go".
 */
export function speak(template: string, firstName: string | null | undefined): string {
  const n = (firstName ?? '').trim();
  return template.replace(/,\s*\{name\}/g, n ? `, ${n}` : '');
}

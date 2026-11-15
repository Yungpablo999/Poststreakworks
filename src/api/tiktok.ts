// Ported from poststreak-web src/lib/platforms/tiktok-options.ts and tiktok-form.ts (same rules, so the app and the site
// check a TikTok post the same way). Pure logic only; the card is src/components/composer/TikTokSettingsCard.tsx.

/**
 * What the composer sends for a TikTok post, per TikTok's Direct Post UX
 * guidelines: who can view it (no default, the creator must choose), whether
 * comments, duets and stitches are allowed (all off until switched on), and
 * the commercial content disclosure (off until switched on). Plain data and
 * pure functions only, so the composer and the server check it the same way.
 *
 * https://developers.tiktok.com/doc/content-sharing-guidelines
 */

export const TIKTOK_PRIVACY_LEVELS = ['PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS', 'FOLLOWER_OF_CREATOR', 'SELF_ONLY'] as const
export type TikTokPrivacyLevel = (typeof TIKTOK_PRIVACY_LEVELS)[number]

/** How the privacy levels are worded in the composer */
export const TIKTOK_PRIVACY_LABELS: Record<TikTokPrivacyLevel, string> = {
  PUBLIC_TO_EVERYONE: 'Everyone',
  MUTUAL_FOLLOW_FRIENDS: 'Friends',
  FOLLOWER_OF_CREATOR: 'Followers',
  SELF_ONLY: 'Only me',
}

export interface TikTokPostOptions {
  privacyLevel: TikTokPrivacyLevel
  allowComment: boolean
  allowDuet: boolean
  allowStitch: boolean
  /** "Your brand": promoting the creator's own business; labelled "Promotional content" */
  yourBrand: boolean
  /** "Branded content": promoting a third party; labelled "Paid partnership" */
  brandedContent: boolean
}

/** The creator's posting settings from TikTok's creator_info query, as the composer needs them */
export interface TikTokCreatorInfo {
  nickname: string
  avatarUrl: string | null
  privacyLevelOptions: TikTokPrivacyLevel[]
  commentDisabled: boolean
  duetDisabled: boolean
  stitchDisabled: boolean
  maxVideoPostDurationSec: number | null
}

export const TIKTOK_MUSIC_USAGE_URL = 'https://www.tiktok.com/legal/page/global/music-usage-confirmation/en'
export const TIKTOK_BRANDED_CONTENT_POLICY_URL = 'https://www.tiktok.com/legal/page/global/bc-policy/en'

export const TIKTOK_PROCESSING_NOTE =
  'After you post, it can take a few minutes for TikTok to process your video and for it to appear on your profile.'

export function isTikTokPrivacyLevel(value: unknown): value is TikTokPrivacyLevel {
  return typeof value === 'string' && (TIKTOK_PRIVACY_LEVELS as readonly string[]).includes(value)
}

/** True when a commercial content label is on (either box ticked) */
export function hasCommercialDisclosure(options: Pick<TikTokPostOptions, 'yourBrand' | 'brandedContent'>): boolean {
  return options.yourBrand || options.brandedContent
}

/**
 * The label TikTok shows on the post, for the user's own information:
 * branded content wins over your brand, as TikTok applies the stricter one.
 */
export function commercialLabel(options: Pick<TikTokPostOptions, 'yourBrand' | 'brandedContent'>): string | null {
  if (options.brandedContent) return 'Paid partnership'
  if (options.yourBrand) return 'Promotional content'
  return null
}

/** Why these options can't be posted, or null. Branded content can't be private (TikTok blocks it). */
export function tiktokOptionsProblem(options: TikTokPostOptions): string | null {
  if (options.brandedContent && options.privacyLevel === 'SELF_ONLY') {
    return "Branded content visibility can't be set to private"
  }
  return null
}

export type ParsedTikTokOptions =
  | { ok: true; options: TikTokPostOptions }
  | { ok: false; error: string }

const BOOLEAN_FIELDS = ['allowComment', 'allowDuet', 'allowStitch', 'yourBrand', 'brandedContent'] as const

/**
 * Checks untrusted JSON (a request body, or publish_options read back from
 * the database). Everything is required: there is no default privacy level,
 * and a missing switch is an error rather than "off", so a client that
 * forgets a field can't post with settings the user never saw.
 */
export function parseTikTokPostOptions(input: unknown): ParsedTikTokOptions {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { ok: false, error: 'TikTok settings are required' }
  }
  const raw = input as Record<string, unknown>

  if (!isTikTokPrivacyLevel(raw.privacyLevel)) {
    return { ok: false, error: 'Choose who can view this TikTok video' }
  }
  for (const field of BOOLEAN_FIELDS) {
    if (typeof raw[field] !== 'boolean') return { ok: false, error: `TikTok setting ${field} must be true or false` }
  }

  const options: TikTokPostOptions = {
    privacyLevel: raw.privacyLevel,
    allowComment: raw.allowComment as boolean,
    allowDuet: raw.allowDuet as boolean,
    allowStitch: raw.allowStitch as boolean,
    yourBrand: raw.yourBrand as boolean,
    brandedContent: raw.brandedContent as boolean,
  }
  const problem = tiktokOptionsProblem(options)
  return problem ? { ok: false, error: problem } : { ok: true, options }
}


// ─── The composer's form ─────────────────────────────────────────────────────


export interface TikTokForm {
  /** '' until the creator chooses: there is no default */
  privacyLevel: TikTokPrivacyLevel | ''
  allowComment: boolean
  allowDuet: boolean
  allowStitch: boolean
  /** The "Disclose video content" switch */
  commercial: boolean
  yourBrand: boolean
  brandedContent: boolean
}

export function emptyTikTokForm(): TikTokForm {
  return {
    privacyLevel: '',
    allowComment: false,
    allowDuet: false,
    allowStitch: false,
    commercial: false,
    yourBrand: false,
    brandedContent: false,
  }
}

/** Whether a privacy level can be picked right now: branded content can't be private */
export function privacyLevelDisabledReason(level: TikTokPrivacyLevel, form: TikTokForm): string | null {
  if (level === 'SELF_ONLY' && form.commercial && form.brandedContent) {
    return "Branded content visibility can't be set to private"
  }
  return null
}

/**
 * The form after the user changes it: ticking "Branded content" while the
 * privacy level is private clears the level, so they choose again rather than
 * posting with a level TikTok would refuse. Turning the disclosure off clears
 * both boxes.
 */
export function updateTikTokForm(form: TikTokForm, change: Partial<TikTokForm>): TikTokForm {
  const next = { ...form, ...change }
  if (!next.commercial) {
    next.yourBrand = false
    next.brandedContent = false
  }
  if (next.commercial && next.brandedContent && next.privacyLevel === 'SELF_ONLY') next.privacyLevel = ''
  return next
}

export interface TikTokFormContext {
  creator: TikTokCreatorInfo | null
  /** The chosen video's length, once the browser has read it */
  videoDurationSec: number | null
}

/** Why the Post button must stay disabled, or null when the form is complete */
export function tiktokFormProblem(form: TikTokForm, { creator, videoDurationSec }: TikTokFormContext): string | null {
  if (!creator) return 'Waiting for your TikTok account details'
  if (form.privacyLevel === '') return 'Choose who can view this video'
  if (!creator.privacyLevelOptions.includes(form.privacyLevel)) return "Your TikTok account can't post with this visibility"
  if (form.commercial && !form.yourBrand && !form.brandedContent) {
    return 'Choose "Your brand", "Branded content" or both'
  }
  if (form.commercial && form.brandedContent && form.privacyLevel === 'SELF_ONLY') {
    return "Branded content visibility can't be set to private"
  }
  if (creator.maxVideoPostDurationSec !== null && videoDurationSec !== null && videoDurationSec > creator.maxVideoPostDurationSec) {
    const minutes = Math.floor(creator.maxVideoPostDurationSec / 60)
    return `This video is longer than your TikTok account allows (${minutes > 0 ? `${minutes} min` : `${creator.maxVideoPostDurationSec} s`})`
  }
  return null
}

/** What goes to the server, or null while the form is incomplete. Switches the creator turned off in TikTok are sent off. */
export function toTikTokPostOptions(form: TikTokForm, context: TikTokFormContext): TikTokPostOptions | null {
  if (tiktokFormProblem(form, context) !== null || form.privacyLevel === '') return null
  const { creator } = context
  return {
    privacyLevel: form.privacyLevel,
    allowComment: form.allowComment && !creator?.commentDisabled,
    allowDuet: form.allowDuet && !creator?.duetDisabled,
    allowStitch: form.allowStitch && !creator?.stitchDisabled,
    yourBrand: form.commercial && form.yourBrand,
    brandedContent: form.commercial && form.brandedContent,
  }
}

export interface TikTokConsent {
  /** "By posting, you agree to TikTok's ..." split around the links */
  policy: 'music' | 'branded-and-music'
  links: Array<{ label: string; href: string }>
}

/** The consent line shown above the Post button: the Branded Content Policy joins it when branded content is ticked */
export function tiktokConsent(form: Pick<TikTokForm, 'commercial' | 'brandedContent'>): TikTokConsent {
  if (form.commercial && form.brandedContent) {
    return {
      policy: 'branded-and-music',
      links: [
        { label: 'Branded Content Policy', href: TIKTOK_BRANDED_CONTENT_POLICY_URL },
        { label: 'Music Usage Confirmation', href: TIKTOK_MUSIC_USAGE_URL },
      ],
    }
  }
  return { policy: 'music', links: [{ label: 'Music Usage Confirmation', href: TIKTOK_MUSIC_USAGE_URL }] }
}

/** The line explaining the label the video will carry, or null when nothing is disclosed */
export function tiktokDisclosureNote(form: Pick<TikTokForm, 'commercial' | 'yourBrand' | 'brandedContent'>): string | null {
  const label = form.commercial ? commercialLabel(form) : null
  if (!label) return null
  return `Your video will be labeled "${label}". This cannot be changed once your video is posted.`
}

/** Reads GET /api/tiktok/creator-info; null when the body isn't the expected shape */
export function parseCreatorInfo(body: unknown): TikTokCreatorInfo | null {
  const data = (body as { success?: unknown; data?: unknown } | null)?.data
  if ((body as { success?: unknown } | null)?.success !== true || typeof data !== 'object' || data === null) return null
  const d = data as Record<string, unknown>
  if (typeof d.nickname !== 'string' || !d.nickname.trim()) return null
  const levels = Array.isArray(d.privacyLevelOptions) ? d.privacyLevelOptions.filter(isTikTokPrivacyLevel) : []
  return {
    nickname: d.nickname,
    avatarUrl: typeof d.avatarUrl === 'string' && d.avatarUrl ? d.avatarUrl : null,
    privacyLevelOptions: levels,
    commentDisabled: d.commentDisabled === true,
    duetDisabled: d.duetDisabled === true,
    stitchDisabled: d.stitchDisabled === true,
    maxVideoPostDurationSec:
      typeof d.maxVideoPostDurationSec === 'number' && Number.isFinite(d.maxVideoPostDurationSec) ? d.maxVideoPostDurationSec : null,
  }
}

export const TIKTOK_CREATOR_INFO_ERROR = "Couldn't load your TikTok account. Reconnect TikTok or try again."

/** Initials for the avatar fallback: "@yourhandle" -> "YH"-style, at most two letters */
export function nicknameInitials(nickname: string): string {
  const words = nickname.replace(/^@/, '').split(/[\s._-]+/).filter(Boolean)
  const letters = words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? '?').slice(0, 2)
  return letters.toUpperCase()
}

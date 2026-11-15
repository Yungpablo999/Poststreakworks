import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api/authFetch';
import {
  TIKTOK_CREATOR_INFO_ERROR,
  emptyTikTokForm,
  creatorInfoErrorMessage,
  parseCreatorInfo,
  tiktokFormProblem,
  toTikTokPostOptions,
  updateTikTokForm,
  type TikTokCreatorInfo,
  type TikTokForm,
  type TikTokPostOptions,
} from '../api/tiktok';

// The TikTok card's state, shared by both composers.
//
//   const tiktok = useTikTokSettings({ active, videoDurationSec });
//   tiktok.problem   -> why Post must stay blocked (null when complete)
//   tiktok.options   -> what to send (null while incomplete)
//
// `active` is true when TikTok is selected AND a video is attached. The creator info
// (GET /api/tiktok/creator-info) is fetched once, the first time the card shows.

export type CreatorInfoState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; creator: TikTokCreatorInfo }
  | { status: 'error'; message: string };

export function useTikTokSettings({ active, videoDurationSec }: { active: boolean; videoDurationSec: number | null }) {
  const [creatorInfo, setCreatorInfo] = useState<CreatorInfoState>({ status: 'idle' });
  const [form, setForm] = useState<TikTokForm>(emptyTikTokForm);
  const requested = useRef(false);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    setCreatorInfo({ status: 'loading' });
    try {
      const body = await api.get<unknown>('/api/tiktok/creator-info');
      const creator = parseCreatorInfo(body);
      if (!alive.current) return;
      setCreatorInfo(creator ? { status: 'ready', creator } : { status: 'error', message: TIKTOK_CREATOR_INFO_ERROR });
    } catch (e) {
      if (alive.current) setCreatorInfo({ status: 'error', message: creatorInfoErrorMessage(e) });
    }
  }, []);

  useEffect(() => {
    if (!active || requested.current) return;
    requested.current = true;
    void load();
  }, [active, load]);

  const change = useCallback((c: Partial<TikTokForm>) => setForm((f) => updateTikTokForm(f, c)), []);
  const retry = useCallback(() => void load(), [load]);

  const creator = creatorInfo.status === 'ready' ? creatorInfo.creator : null;
  const { problem, options } = useMemo<{ problem: string | null; options: TikTokPostOptions | null }>(() => {
    if (creatorInfo.status === 'error') return { problem: creatorInfo.message, options: null };
    const context = { creator, videoDurationSec };
    return { problem: tiktokFormProblem(form, context), options: toTikTokPostOptions(form, context) };
  }, [creatorInfo, creator, form, videoDurationSec]);

  return { creatorInfo, form, change, retry, problem, options };
}

export type TikTokSettings = ReturnType<typeof useTikTokSettings>;

import { API_ROUTES } from '../../frontend/shared/constants/apiRoutes';
import type { CheckInSummary, MarkPostedResult, NewPostBody, Post, PostPatchBody } from '../../frontend/shared/types/phase1';
import { hydrateCheckIn, markCheckInDay } from '../data';
import { api, type ApiResult } from './api';
import { refreshCalendar } from './calendar';
import { loadHome } from './home';
import { loadQuestBoard } from './quests';
import { createStore } from './store';
import { refreshAccount } from './sync';

// The creator's posts: planned, ready to post, posted. The server is the only one that writes them
// (the app asks, the server checks), and the server decides when a post is ready (its cron) and what
// counts as posted (the creator says so, one platform at a time).
//
// After any change the places that show posts are read again, so the calendar, Home and the Schedule
// page agree with the server instead of with what this device remembers.

/** Goes up each time a post is planned, changed, posted or removed: lists that show posts read themselves again. */
export const postsVersion = createStore(0);
export const usePostsVersion = postsVersion.use;

/** Posts whose time has come and are waiting for the creator to post them. null = couldn't be loaded. */
export async function loadReadyPosts(): Promise<Post[] | null> {
  const res = await api.get<{ posts: Post[] }>(`${API_ROUTES.POSTS.LIST}?state=ready`);
  return res.ok ? res.data.posts : null;
}

export async function loadPost(id: string): Promise<ApiResult<Post>> {
  return api.get<Post>(API_ROUTES.POSTS.ITEM(id));
}

async function changed(): Promise<void> {
  postsVersion.set(postsVersion.get() + 1);
  await Promise.all([refreshCalendar(), loadHome()]);
}

/** Plans a post for a time, or makes it ready right now. */
export async function planPost(body: NewPostBody): Promise<ApiResult<Post>> {
  const res = await api.post<Post>(API_ROUTES.POSTS.LIST, body);
  if (res.ok) void changed();
  return res;
}

export async function editPost(id: string, patch: PostPatchBody): Promise<ApiResult<Post>> {
  const res = await api.patch<Post>(API_ROUTES.POSTS.ITEM(id), patch);
  if (res.ok) void changed();
  return res;
}

export async function removePost(id: string): Promise<ApiResult<{ removed: true }>> {
  const res = await api.delete<{ removed: true }>(API_ROUTES.POSTS.ITEM(id));
  if (res.ok) void changed();
  return res;
}

/** "I posted it", for one platform. The link is optional. */
export async function markPosted(id: string, platform: string, url?: string): Promise<ApiResult<MarkPostedResult>> {
  const res = await api.post<MarkPostedResult>(API_ROUTES.POSTS.POSTED(id), { platform, ...(url?.trim() ? { url: url.trim() } : {}) });
  if (!res.ok) return res;
  void changed();
  // A post counts towards today's streak and can finish a quest or the weekly challenge, and a
  // creator's first post makes them a returning creator: read all of that again from the server.
  void afterPosted();
  return res;
}

async function afterPosted(): Promise<void> {
  const streak = await api.get<CheckInSummary>(API_ROUTES.CHECK_INS.SUMMARY);
  if (streak.ok) {
    markCheckInDay(streak.data.localDate);
    hydrateCheckIn({
      currentDays: streak.data.currentDays,
      week: streak.data.week,
      todayIndex: streak.data.todayIndex,
      checkedInToday: streak.data.checkedInToday,
    });
  }
  await Promise.all([refreshAccount(), loadQuestBoard()]);
}

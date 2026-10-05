import { API_ROUTES } from '../../frontend/shared/constants/apiRoutes';
import type { FeedIdea, IdeaList } from '../../frontend/shared/types/phase1';
import { api, publicGet } from './api';

// Post ideas. They are written on the server (the idea library, and Jarvis when an AI key is
// set); the app only asks for them.

export type IdeaGoal = 'followers' | 'saves' | 'comments' | 'often';

export const IDEA_GOALS: { id: IdeaGoal; label: string }[] = [
  { id: 'followers', label: 'Grow followers' },
  { id: 'saves', label: 'Get saves' },
  { id: 'comments', label: 'Get comments' },
  { id: 'often', label: 'Post more often' },
];

const query = (params: Record<string, string | number | undefined>) =>
  Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');

/** Before sign-up: ideas for the topics and platforms picked so far. null = couldn't be loaded. */
export async function loadStarterIdeas(niches: string[], platforms: string[]): Promise<FeedIdea[] | null> {
  const res = await publicGet<IdeaList>(`${API_ROUTES.IDEAS.STARTER}?${query({ niches: niches.join(','), platforms: platforms.join(',') })}`);
  return res.ok ? res.data.ideas : null;
}

/** Ideas for the signed-in creator's own topics, shaped by their goal, and who wrote them. null = couldn't be loaded. */
export async function loadIdeaList(goal: IdeaGoal = 'followers'): Promise<IdeaList | null> {
  const res = await api.get<IdeaList>(`${API_ROUTES.IDEAS.FEED}?${query({ goal })}`);
  return res.ok ? res.data : null;
}

/** Ideas for the signed-in creator's own topics, shaped by their goal. null = couldn't be loaded. */
export async function loadIdeaFeed(goal: IdeaGoal = 'followers'): Promise<FeedIdea[] | null> {
  return (await loadIdeaList(goal))?.ideas ?? null;
}

/** Three ideas about a topic the creator typed. `round` asks for the next three. */
export async function loadTopicIdeas(topic: string, goal: IdeaGoal, format?: string, round = 0): Promise<FeedIdea[] | null> {
  const res = await api.get<IdeaList>(`${API_ROUTES.IDEAS.TOPIC}?${query({ topic, goal, format, round })}`);
  return res.ok ? res.data.ideas : null;
}

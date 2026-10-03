// The two facts about a signed-in creator that decide what each screen shows.
// Both come from the server (GET /me/bootstrap); no screen can change them.
export type { Persona as UserPersona, Tier as UserTier } from '../../frontend/shared/types/phase1';

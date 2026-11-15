// Reads what Supabase put on the sign-in redirect URL
// (poststreak://auth/callback?code=… or …?error=…&error_description=…).
// Supabase may put errors in the query or the #fragment, so both are read.

export type AuthCallback = { code: string } | { error: string } | null;

export function parseAuthCallback(url: string): AuthCallback {
  const hashAt = url.indexOf('#');
  const beforeHash = hashAt === -1 ? url : url.slice(0, hashAt);
  const queryAt = beforeHash.indexOf('?');
  const query = new URLSearchParams(queryAt === -1 ? '' : beforeHash.slice(queryAt + 1));
  const fragment = new URLSearchParams(hashAt === -1 ? '' : url.slice(hashAt + 1));
  const get = (k: string) => query.get(k) ?? fragment.get(k);

  const error = get('error_description') ?? get('error');
  if (error) return { error };
  const code = get('code');
  return code ? { code } : null;
}

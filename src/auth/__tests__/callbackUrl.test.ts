import { parseAuthCallback } from '../callbackUrl';

describe('parseAuthCallback', () => {
  it('reads the PKCE code from the query', () => {
    expect(parseAuthCallback('poststreak://auth/callback?code=abc123')).toEqual({ code: 'abc123' });
  });
  it('reads errors from the query or the fragment, preferring the description', () => {
    expect(parseAuthCallback('poststreak://auth/callback?error=access_denied&error_description=User+cancelled')).toEqual({
      error: 'User cancelled',
    });
    expect(parseAuthCallback('poststreak://auth/callback#error=server_error')).toEqual({ error: 'server_error' });
  });
  it('returns null when there is neither', () => {
    expect(parseAuthCallback('poststreak://auth/callback')).toBeNull();
  });
});

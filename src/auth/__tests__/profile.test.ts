import { emailLocalPart, firstNameOf, profileFromUser, speak } from '../profile';

describe('profileFromUser', () => {
  it('reads a Google user', () => {
    const p = profileFromUser({
      email: 'Ada.Lovelace@Gmail.com',
      user_metadata: { full_name: 'Ada Lovelace', name: 'Other', picture: 'https://x/p.jpg', avatar_url: 'https://x/a.jpg' },
    });
    expect(p).toEqual({
      name: 'Ada Lovelace',
      firstName: 'Ada',
      handle: '@ada.lovelace',
      avatarUrl: 'https://x/a.jpg',
      email: 'Ada.Lovelace@Gmail.com',
    });
  });
  it('falls back to picture, then name', () => {
    const p = profileFromUser({ email: 'a@b.co', user_metadata: { name: 'Bo Peep', picture: 'https://x/p.jpg' } });
    expect(p.name).toBe('Bo Peep');
    expect(p.avatarUrl).toBe('https://x/p.jpg');
  });
  it('uses the email-code username', () => {
    const p = profileFromUser({ email: 'sam@x.io', user_metadata: { username: 'samcreates' } });
    expect(p.name).toBe('samcreates');
    expect(p.firstName).toBe('samcreates');
    expect(p.handle).toBe('@sam');
    expect(p.avatarUrl).toBeNull();
  });
  it('uses only the email', () => {
    const p = profileFromUser({ email: 'john.doe@x.io' });
    expect(p).toMatchObject({ name: 'john.doe', firstName: 'John', handle: '@john.doe', avatarUrl: null });
  });
  it('handles plus-addressing and uppercase', () => {
    const p = profileFromUser({ email: 'Mary+news@X.io', user_metadata: {} });
    expect(p.handle).toBe('@mary');
    expect(p.name).toBe('Mary');
  });
  it('ignores empty strings, non-strings and bad URLs', () => {
    const p = profileFromUser({
      email: 'z@z.com',
      user_metadata: { full_name: '  ', name: 5, username: '', avatar_url: '', picture: 'javascript:alert(1)' },
    });
    expect(p.name).toBe('z');
    expect(p.avatarUrl).toBeNull();
  });
  it('handles missing metadata, missing email and null user', () => {
    expect(profileFromUser({ email: 'a@b.c', user_metadata: null }).name).toBe('a');
    expect(profileFromUser({ user_metadata: { full_name: 'Zed Q' } })).toMatchObject({ name: 'Zed Q', handle: '', email: '' });
    expect(profileFromUser(null)).toMatchObject({ name: '', firstName: '', handle: '', avatarUrl: null });
    expect(profileFromUser({ email: '' })).toMatchObject({ name: '', handle: '' });
  });
});

describe('helpers', () => {
  it('emailLocalPart', () => {
    expect(emailLocalPart('a+b@c.d')).toBe('a');
    expect(emailLocalPart('+x@c.d')).toBe('+x');
    expect(emailLocalPart('noat')).toBe('noat');
  });
  it('firstNameOf', () => {
    expect(firstNameOf('  Ada   Lovelace ')).toBe('Ada');
    expect(firstNameOf('')).toBe('');
    expect(firstNameOf(null)).toBe('');
    expect(firstNameOf('__')).toBe('');
  });
  it('speak', () => {
    expect(speak('Ready, {name}! Go', 'Ada')).toBe('Ready, Ada! Go');
    expect(speak('Ready, {name}! Go', '')).toBe('Ready! Go');
    expect(speak('Hot, {name}! 🔥', undefined)).toBe('Hot! 🔥');
  });
});

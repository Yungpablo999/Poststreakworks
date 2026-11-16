import { deleteMyAccount, isDeleteConfirmed } from '../account';

describe('isDeleteConfirmed', () => {
  it('accepts the word in any case with spaces, and nothing else', () => {
    expect(isDeleteConfirmed('DELETE')).toBe(true);
    expect(isDeleteConfirmed(' delete ')).toBe(true);
    for (const v of ['', 'del', 'delete my account', 'DELET']) expect(isDeleteConfirmed(v)).toBe(false);
  });
});

describe('deleteMyAccount', () => {
  it('does not call the backend until the word is typed', async () => {
    const post = jest.fn();
    const res = await deleteMyAccount('nope', { post });
    expect(res.ok).toBe(false);
    expect(post).not.toHaveBeenCalled();
  });

  it('sends the confirm word to the delete route and reports success', async () => {
    const post = jest.fn(async () => ({ success: true, statusCode: 200 }));
    expect(await deleteMyAccount('delete', { post })).toEqual({ ok: true });
    expect(post).toHaveBeenCalledWith('/api/account/delete', { confirm: 'DELETE' });
  });

  it('reports a failure without throwing', async () => {
    const fail = await deleteMyAccount('DELETE', { post: async () => ({ success: false, statusCode: 500 }) });
    expect(fail.ok).toBe(false);
    const rate = await deleteMyAccount('DELETE', { post: async () => ({ success: false, statusCode: 429 }) });
    expect(rate.ok && 'x').toBe(false);
    const thrown = await deleteMyAccount('DELETE', { post: async () => { throw new Error('offline'); } });
    expect(thrown.ok).toBe(false);
  });
});

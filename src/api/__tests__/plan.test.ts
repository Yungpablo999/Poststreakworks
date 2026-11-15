import { fetchPlan, normalisePlan, type PlanClient } from '../plan';

function client(result: { data: { plan?: unknown } | null; error: { message: string } | null } | Error) {
  const calls: Array<[string, string, string]> = [];
  const c: PlanClient = {
    from: (table) => ({
      select: (cols) => ({
        eq: (col, val) => {
          calls.push([table, cols, `${col}=${val}`]);
          return { maybeSingle: async () => { if (result instanceof Error) throw result; return result; } };
        },
      }),
    }),
  };
  return { c, calls };
}

describe('normalisePlan', () => {
  it('only the exact string "pro" is pro', () => {
    expect(normalisePlan('pro')).toBe('pro');
    for (const v of ['free', 'PRO', 'founding', '', null, undefined, 1, {}]) expect(normalisePlan(v)).toBe('free');
  });
});

describe('fetchPlan', () => {
  it('reads the plan from user_plans for that user (select only)', async () => {
    const { c, calls } = client({ data: { plan: 'pro' }, error: null });
    expect(await fetchPlan('u1', c)).toBe('pro');
    expect(calls).toEqual([['user_plans', 'plan', 'user_id=u1']]);
  });
  it('a user with no row yet is free', async () => {
    expect(await fetchPlan('u1', client({ data: null, error: null }).c)).toBe('free');
  });
  it('returns null on an error so the caller keeps what it had', async () => {
    expect(await fetchPlan('u1', client({ data: null, error: { message: 'x' } }).c)).toBeNull();
    expect(await fetchPlan('u1', client(new Error('offline')).c)).toBeNull();
  });
});

import data from "./dev-accounts.json";

// The local test accounts (created by backend/scripts/seed-test-users.mjs). One list, read by the
// seed script, by the sign-in route and, through that route, by the app's sign-in screen, so the
// app never ships with them.

export type DevAccount = {
  email: string;
  label: string;
  plan: "free" | "pro";
  stage: "new" | "existing";
  displayName: string;
  handle: string;
  niches: string[];
  blurb: string;
};

export const DEV_ACCOUNTS: readonly DevAccount[] = data.accounts as DevAccount[];

export const isDevAccount = (email: string): boolean => DEV_ACCOUNTS.some((a) => a.email === email.toLowerCase());

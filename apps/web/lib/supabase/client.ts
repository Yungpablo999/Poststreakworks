import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// createBrowserClient (not plain createClient from @supabase/supabase-js) —
// this is what makes the browser session share the same cookie-based store
// server.ts's createServerClient reads. Plain createClient would keep its
// session in localStorage instead, so the server would see the user as
// logged out even while the browser thinks it's logged in.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

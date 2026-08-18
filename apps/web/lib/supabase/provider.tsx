"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { User } from "@poststreak/api/context";

type SupabaseContext = {
  supabase: ReturnType<typeof createBrowserClient>;
  user: User | null;
  loading: boolean;
};

const SupabaseContext = createContext<SupabaseContext>({
  supabase: null!,
  user: null,
  loading: true,
});

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    ),
  );
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        const { data: psUser } = await supabase
          .from("users")
          .select("role, account_status")
          .eq("id", authUser.id)
          .single();

        setUser({
          id: authUser.id,
          email: authUser.email!,
          role: (psUser?.role as "creator" | "staff_admin") ?? "creator",
          accountStatus: psUser?.account_status ?? "active",
        });
      }
      setLoading(false);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: psUser } = await supabase
          .from("users")
          .select("role, account_status")
          .eq("id", session.user.id)
          .single();

        setUser({
          id: session.user.id,
          email: session.user.email!,
          role: (psUser?.role as "creator" | "staff_admin") ?? "creator",
          accountStatus: psUser?.account_status ?? "active",
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return (
    <SupabaseContext.Provider value={{ supabase, user, loading }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export const useSupabase = () => useContext(SupabaseContext);

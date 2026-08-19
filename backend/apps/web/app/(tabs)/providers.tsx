"use client";

import { TRPCProvider } from "@/lib/trpc/provider";
import { SupabaseProvider } from "@/lib/supabase/provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SupabaseProvider>
      <TRPCProvider>{children}</TRPCProvider>
    </SupabaseProvider>
  );
}

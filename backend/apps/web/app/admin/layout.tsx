import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@poststreak/api/context";

// Staff-gated route group (staff_admin role, accounts_and_identity.sql) —
// integrated into apps/web rather than a separate app (founder-confirmed,
// Stage 6). The actual gate: every /admin/* page is a server component
// rendered through this layout, so the role check below runs before any
// admin page's markup — or data — ever reaches the response. This is the
// real security boundary for the whole admin surface, not a UI-only guard
// that a client could bypass by hitting the route directly.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Build the Cookie header explicitly from getAll() rather than relying on
  // any stringification the cookies() object might offer — that's not a
  // documented, guaranteed-correct "name1=value1; name2=value2" format.
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  const supabase = createSupabaseServerClient(
    new Headers({ cookie: cookieHeader }),
    new Headers(),
  );

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    // Not "/auth/callback" — that page only handles the post-OAuth
    // redirect-and-listen step, it doesn't accept a return-to param or
    // start a sign-in flow itself. Building a real admin sign-in redirect
    // is a separate concern from gating this layout.
    redirect("/");
  }

  const { data: psUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", authUser.id)
    .single();

  if (psUser?.role !== "staff_admin") {
    redirect("/");
  }

  return <>{children}</>;
}

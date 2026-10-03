import { TRPCError } from "@trpc/server";
import { PROVIDER_NAMES, createProviderAdapter, type ProviderId } from "@poststreak/integrations";
import { createSupabaseSocialStore, envTokenVault, getServiceClient, notify, type SocialDeps } from "@poststreak/workflows";
import { providerSetup } from "./provider-setup";

/**
 * Everything the connect / sync / disconnect flow needs for one platform, or a clear "not
 * available" if this server isn't set up for it (missing keys on a fresh staging environment,
 * say). That is an operator problem, so the creator just sees that it isn't available — and
 * the nightly job skips quietly instead of failing every run.
 */
export function socialDeps(id: ProviderId): SocialDeps {
  const config = providerSetup(id, process.env, (message) => console.error(message));
  if (!config) {
    throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: `Connecting ${PROVIDER_NAMES[id]} isn't available right now. Please try again later.` });
  }
  const name = PROVIDER_NAMES[id];
  return {
    store: createSupabaseSocialStore(getServiceClient(), id),
    adapter: createProviderAdapter(id, config),
    vault: envTokenVault,
    // Once a month at most, per platform: enough to be seen, never a daily nag.
    onNeedsReauth: (userId) =>
      notify(userId, {
        key: `reauth:${id}:${new Date().toISOString().slice(0, 7)}`,
        type: "system",
        kind: "link",
        title: `Reconnect your ${name}`,
        body: `${name} needs you to approve PostStreak again so your numbers stay up to date.`,
        action: { label: "Reconnect", target: "accounts" },
      }),
  };
}

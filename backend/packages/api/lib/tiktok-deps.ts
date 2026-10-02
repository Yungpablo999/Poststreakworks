import { TRPCError } from "@trpc/server";
import { TikTokConfigError, tiktokConfigFromEnv } from "@poststreak/integrations";
import { createSupabaseTikTokStore, createTikTokApi, envTokenVault, getServiceClient, type TikTokDeps } from "@poststreak/workflows";

/**
 * The dependencies for TikTok, or a clear "not available" if this server isn't
 * set up for it yet (missing keys on a fresh staging environment, say). That is
 * an operator problem, so the creator just sees that it isn't available — and
 * the nightly job skips quietly instead of failing every run.
 */
export function tiktokDeps(): TikTokDeps {
  let config;
  try {
    config = tiktokConfigFromEnv();
  } catch (err) {
    if (err instanceof TikTokConfigError) console.error(`TikTok is misconfigured: ${err.message}`);
    config = null;
  }
  if (config) {
    try {
      envTokenVault.seal("probe", "probe"); // TOKEN_ENCRYPTION_KEY present and valid
    } catch {
      console.error("TikTok connection disabled: TOKEN_ENCRYPTION_KEY is missing or invalid");
      config = null;
    }
  }
  if (!config) {
    throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Connecting TikTok isn't available right now. Please try again later." });
  }
  return { store: createSupabaseTikTokStore(getServiceClient()), api: createTikTokApi(config), vault: envTokenVault, config };
}

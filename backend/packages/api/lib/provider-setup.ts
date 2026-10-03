import {
  PROVIDER_IDS,
  PROVIDER_NAMES,
  ProviderConfigError,
  providerConfigFromEnv,
  sealToken,
  type ProviderConfig,
  type ProviderId,
} from "@poststreak/integrations";

type Env = Record<string, string | undefined>;

/**
 * This server's settings for one platform, or null when it isn't set up for it (keys or redirect
 * address missing, or the token key absent or invalid). A platform that is set up wrongly counts
 * as not set up: the creator is told it isn't available, and the reason goes to the server log.
 */
export function providerSetup(id: ProviderId, env: Env = process.env, report?: (message: string) => void): ProviderConfig | null {
  let config: ProviderConfig | null;
  try {
    config = providerConfigFromEnv(id, env);
  } catch (err) {
    if (err instanceof ProviderConfigError) report?.(`${PROVIDER_NAMES[id]} is misconfigured: ${err.message}`);
    return null;
  }
  if (!config) return null;
  try {
    sealToken("probe", "probe", env); // TOKEN_ENCRYPTION_KEY present and valid
  } catch {
    report?.(`${PROVIDER_NAMES[id]} connection disabled: TOKEN_ENCRYPTION_KEY is missing or invalid`);
    return null;
  }
  return config;
}

/** The platforms this server can connect right now. */
export function readyProviders(env: Env = process.env): ProviderId[] {
  return PROVIDER_IDS.filter((id) => providerSetup(id, env) !== null);
}

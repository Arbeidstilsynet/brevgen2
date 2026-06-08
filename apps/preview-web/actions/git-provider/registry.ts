import type { ProviderId } from "@/utils/types";
import type { AllReposResult, GitProvider, ProviderRegistry } from "./types";

/** Select the adapter for a provider from the registry. */
export function selectProvider(registry: ProviderRegistry, providerId: ProviderId): GitProvider {
  const provider = registry[providerId];
  if (!provider) {
    throw new Error(`Unknown git provider: ${providerId}`);
  }
  return provider;
}

/**
 * Aggregate repositories across all providers in the registry. Each provider is
 * queried independently; a failure in one provider is captured as an error and
 * never prevents the others from returning. This function never throws.
 */
export async function aggregateRepos(registry: ProviderRegistry): Promise<AllReposResult> {
  const entries = await Promise.all(
    (Object.keys(registry) as (keyof ProviderRegistry)[]).map(async (providerId) => {
      try {
        const repos = await registry[providerId].listRepos();
        return [providerId, { repos, error: null }] as const;
      } catch (error) {
        return [providerId, { repos: [], error: String(error) }] as const;
      }
    }),
  );

  return Object.fromEntries(entries) as AllReposResult;
}

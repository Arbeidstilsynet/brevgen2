"use server";

import { realRegistry } from "./git-provider/adapters";
import { aggregateRepos } from "./git-provider/registry";
import type { AllReposResult } from "./git-provider/types";

export async function fetchAllRepos(): Promise<AllReposResult> {
  return aggregateRepos(realRegistry);
}

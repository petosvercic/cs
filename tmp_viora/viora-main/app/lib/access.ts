import { modulesBySlug, type ModuleSlug } from "./modules";
import type { VioraStateV1 } from "./vioraState";

export type ModuleStatus = "free" | "included" | "purchased" | "locked";

export const getModuleStatus = (slug: ModuleSlug, state: VioraStateV1): ModuleStatus => {
  const moduleDef = modulesBySlug[slug];
  if (moduleDef.isFree) return "free";

  const addons = state.unlocks.addons ?? [];
  const included = state.unlocks.included ?? [];

  if (addons.includes(slug)) return "purchased";
  if (state.unlocks.full && included.includes(slug)) return "included";
  return "locked";
};

export const canAccessModule = (slug: ModuleSlug, state: VioraStateV1): boolean => {
  const status = getModuleStatus(slug, state);
  return status === "free" || status === "included" || status === "purchased";
};

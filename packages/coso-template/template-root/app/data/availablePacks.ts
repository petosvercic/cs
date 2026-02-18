import productConfig from "../../product.config.json";

const DEFAULT_AVAILABLE_PACK_IDS = ["default"] as const;

export function getAvailablePackIds(): string[] {
  const configuredPackIds = productConfig.engine?.availablePackIds;

  if (!Array.isArray(configuredPackIds)) {
    return [...DEFAULT_AVAILABLE_PACK_IDS];
  }

  const normalizedPackIds = configuredPackIds
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);

  return normalizedPackIds.length > 0 ? normalizedPackIds : [...DEFAULT_AVAILABLE_PACK_IDS];
}

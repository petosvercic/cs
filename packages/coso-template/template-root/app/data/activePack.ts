import productConfig from "../../product.config.json";

const DEFAULT_PACK_ID = "default";

export function getActivePackId(): string {
  const configuredPackId = productConfig.engine?.activePackId?.trim();
  return configuredPackId || DEFAULT_PACK_ID;
}

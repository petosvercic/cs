export type ProductRegistryItem = {
  id: string;
  title: string;
  baseUrl?: string;
};

export const PRODUCT_REGISTRY: ProductRegistryItem[] = [
  { id: "nevedelE", title: "COSO nevedelE", baseUrl: "https://coso-system-nevedel-e.vercel.app" },
];

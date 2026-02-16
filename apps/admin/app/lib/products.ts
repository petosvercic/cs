export type Product = {
  id: "nevedelE" | string;
  name: string;
  baseUrl: string;
  capabilities: string[];
};

export const PRODUCTS: Product[] = [
  {
    id: "nevedelE",
    name: "COSO · NevedelE",
    baseUrl: process.env.NEVEDELE_BASE_URL ?? "https://coso-system-nevedel-e.vercel.app",
    capabilities: ["editions", "factory-bridge"],
  },
];

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find(p => p.id === id);
}

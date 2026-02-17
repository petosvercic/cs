export type ProductRegistryItem = {
  id: string;
  title: string;
  baseUrl: string;
  description: string;
};

function normalizeBaseUrl(value: string | undefined, fallback: string) {
  const raw = (value || fallback).trim();
  return raw.replace(/\/+$/, "");
}

export const products: ProductRegistryItem[] = [
  {
    id: "nevedelE",
    title: "nevedelE",
    baseUrl: normalizeBaseUrl(process.env.NEVEDEL_BASE_URL, "http://localhost:3000"),
    description: "Production app bridge",
  },
];

export function getProduct(id: string) {
  return products.find((p) => p.id === id);
}


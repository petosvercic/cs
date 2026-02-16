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
    description: "Production app bridge"
  }
];

export function getProduct(id: string): ProductRegistryItem | undefined {
  return products.find((item) => item.id === id);
export type AdminProduct = {
  id: string;
  name: string;
  description: string;
  appUrl: string;
  vercelProjectUrl: string;
};

export const adminProducts: AdminProduct[] = [
  {
    id: "nevedelE",
    name: "nevedelE",
    description: "Main product app with content packs and builder flows.",
    appUrl: "/",
    vercelProjectUrl: "https://vercel.com/<team>/nevedele"
  }
];

export function getProductById(id: string): AdminProduct | undefined {
  return adminProducts.find((product) => product.id === id);
}

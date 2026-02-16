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

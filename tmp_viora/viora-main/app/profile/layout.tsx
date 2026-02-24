import type { Metadata } from "next";

import { getEnvBaseUrl } from "../lib/siteUrl";

export const metadata: Metadata = {
  metadataBase: new URL(getEnvBaseUrl()),
  title: "Profile",
  description: "Viora: Personal Analysis. Rozhodovanie v 1 vete + plán na 7 dní.",
  openGraph: {
    title: "Viora: Personal Analysis | Profile",
    description: "Rozhodovací podpis, hlboká analýza a 7-dňový plán zmeny.",
    images: ["/brand/bg.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Viora: Personal Analysis | Profile",
    description: "Rozhodovací podpis, hlboká analýza a 7-dňový plán zmeny.",
    images: ["/brand/bg.png"],
  },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}

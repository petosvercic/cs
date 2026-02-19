import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "nevedelE",
  description: "Deterministický runtime produkt",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sk">
      <body className="bg-neutral-950 text-neutral-100" style={{ fontFamily: "Inter, system-ui, Arial, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}

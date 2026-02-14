import type { Metadata } from "next";
import { assertServerEnv } from "../lib/env";
import "./globals.css";

assertServerEnv();

export const metadata: Metadata = {
  title: "nevedelE",
  description: "Modern UI pre coso-system",
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

import type { Metadata } from "next";
import { ReactNode } from "react";
import { NavLink } from "./ui/nav-link";
import { products } from "@/lib/products";
import "./globals.css";

export const metadata: Metadata = {
  title: "Coso Admin",
  description: "Admin V1"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const factoryProduct = products.find((item) => item.capabilities?.includes("factory"));

  return (
    <html lang="en">
      <body>
        <div className="admin-shell">
          <aside className="sidebar">
            <h1>Coso Admin</h1>
            <ul className="nav-list">
              <li><NavLink href="/">Dashboard</NavLink></li>
              <li><NavLink href="/products">Products</NavLink></li>
              {factoryProduct ? <li><NavLink href={`/products/${factoryProduct.id}/factory`}>Factory</NavLink></li> : null}
              <li><NavLink href="/editions">Editions</NavLink></li>
              <li><NavLink href="/deploy">Deploy</NavLink></li>
              <li><NavLink href="/settings">Settings</NavLink></li>
              <li><NavLink href="/publish">Publish</NavLink></li>
            </ul>
          </aside>
          <div className="main-pane">
            <header className="topbar">
              <strong>Production Tools</strong>
              <span>read-only admin v1</span>
            </header>
            <main className="content">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}

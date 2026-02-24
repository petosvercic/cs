import type { Metadata } from "next";
import { ReactNode } from "react";
import { NavLink } from "./ui/nav-link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Coso Admin",
  description: "Admin V1",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="admin-shell">
          <aside className="sidebar">
            <h1>Coso Admin</h1>
            <ul className="nav-list">
              <li>
                <NavLink href="/dashboard">Dashboard</NavLink>
              </li>
              <li>
                <NavLink href="/products">Products</NavLink>
              </li>
            </ul>
          </aside>

          <div className="main-pane">
            <header className="topbar">
              <strong>Admin = dohľad</strong>
              <span>NevedelE = autonómny systém</span>
            </header>
            <main className="content">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}

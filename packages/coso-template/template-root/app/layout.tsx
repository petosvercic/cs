import "./globals.css";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="sk">
      <body className="min-h-screen bg-[url('/brand/bg.png')] bg-cover bg-center bg-no-repeat">
        {/* jemny overlay, aby text bol citatelny */}
        <div className="fixed inset-0 bg-black/35" aria-hidden="true" />

        {/* obsah posunuty mimo stred, polopriehladny, s blur */}
        <div className="relative z-10 min-h-screen">
          <div className="mx-auto w-full max-w-6xl px-4 py-10">
            <div className="w-full max-w-3xl translate-y-10 lg:translate-x-28 rounded-2xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur-md">
              {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

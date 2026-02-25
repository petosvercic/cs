import type { Metadata } from "next";
import "./globals.css";


import { getEnvBaseUrl } from "./lib/siteUrl";

export const metadata: Metadata = {
  metadataBase: new URL(getEnvBaseUrl()),
  title: {
    default: "Viora: Personal Analysis",
    template: "%s | Viora: Personal Analysis",
  },
  description: "Behaviorálny profil a praktické odporúčania z tvojich odpovedí. VIP Pilot odomyká bonusy cez zdieľanie a pozvánky.",
  openGraph: {
    title: "Viora: Personal Analysis",
    description: "VIP Pilot: zdieľaj a odomykaj bonusy. Pozvi 5 = všetky dodatky. Pozvi 20 = VIP Pilot.",
    type: "website",
    images: ["/brand/bg.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Viora: Personal Analysis",
    description: "VIP Pilot: zdieľaj a odomykaj bonusy. Pozvi 5 = všetky dodatky. Pozvi 20 = VIP Pilot.",
    images: ["/brand/bg.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sk">
      <body className="relative min-h-screen bg-slate-50 text-slate-900">
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-20 bg-cover bg-center opacity-[0.14]"
          style={{ backgroundImage: "url('/brand/bg.png')" }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-slate-950/18 via-white/88 to-slate-100/94"
        />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}

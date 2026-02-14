import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="relative min-h-screen bg-[url('/brand/bg.png')] bg-cover bg-center bg-no-repeat">
        <div className="pointer-events-none fixed inset-0 bg-black/35" aria-hidden="true" />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}

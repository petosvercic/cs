import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="bg-overlay" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}

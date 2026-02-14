import "./globals.css";

export const metadata = {
  title: "coso-template"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sk">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}

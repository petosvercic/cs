import Link from "next/link";

export const dynamic = "force-dynamic";

export default function ProductPage({ params }: { params: { id: string } }) {
  const id = params.id;

  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 900 }}>
      <h1>Product: {id}</h1>
      <p style={{ opacity: 0.7 }}>Admin = dohľad. Otváraj tools priamo v produkte.</p>

      <ul>
        <li><Link href="/products">Back to products</Link></li>
      </ul>

      <h2>Open product tools</h2>
      <ul>
        <li><a href={`https://cs-coso-system-main.vercel.app/builder`}>Open /builder</a></li>
        <li><a href={`https://cs-coso-system-main.vercel.app/deploy`}>Open /deploy</a></li>
        <li><a href={`https://cs-coso-system-main.vercel.app/settings`}>Open /settings</a></li>
        <li><a href={`https://cs-coso-system-main.vercel.app/publish`}>Open /publish</a></li>
        <li><a href={`https://cs-coso-system-main.vercel.app/editions`}>Open /editions</a></li>
      </ul>
    </main>
  );
}

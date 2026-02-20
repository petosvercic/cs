import { notFound } from "next/navigation";

type Ctx = { params: Promise<{slug:string}> };

export default async function EditionPage({params}:Ctx){
  const {slug}=await params;
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const r = await fetch(`${base}/api/editions/${encodeURIComponent(slug)}`, { cache: "no-store" }).catch(()=>null as any);
  if(!r || !r.ok) notFound();
  const j = await r.json();
  const title = j?.edition?.title || slug;
  return <main className="p-8"><h1 className="text-3xl font-bold">{title}</h1><pre className="mt-4 text-xs whitespace-pre-wrap">{JSON.stringify(j.edition,null,2)}</pre></main>;
}

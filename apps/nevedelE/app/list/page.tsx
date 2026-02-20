import Link from "next/link";

async function load() {
  const r = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/editions`, { cache: "no-store" }).catch(() => null as any);
  const j = r ? await r.json().catch(()=>({slugs:[]})) : {slugs:[]};
  return Array.isArray(j?.slugs) ? j.slugs : [];
}

export default async function Page(){
  const slugs = await load();
  return <main className="p-8"><h1>List</h1><ul>{slugs.map((s:string)=><li key={s}><Link href={`/e/${s}`}>{s}</Link></li>)}</ul></main>;
}

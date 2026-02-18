import { headers } from "next/headers";

export async function getBaseUrl() {
  const headersStore = await headers();
  const host = headersStore.get("host") ?? "localhost:3000";
  const proto = headersStore.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export async function adminFetch<T>(path: string): Promise<T> {
  const baseUrl = await getBaseUrl();
  const response = await fetch(`${baseUrl}${path}`, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Request failed for ${path}: ${response.status}`);
  }

  return (await response.json()) as T;
}

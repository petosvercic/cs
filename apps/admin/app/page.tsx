import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { adminFetch } from "@/lib/api-client";
import { EditionsResponse, ProductListResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [productsResponse, editionsResponse] = await Promise.all([
    adminFetch<ProductListResponse>("/api/products"),
    adminFetch<EditionsResponse>("/api/editions?product=nevedelE")
  ]);

  return (
    <div className="stack">
      <h2 className="page-title">Dashboard</h2>
      <div className="card-grid">
        <Card title="Products" value={String(productsResponse.items.length)} />
        <Card title="Editions" value={String(editionsResponse.items.length)} />
        <Card title="Last build">
          <p>placeholder</p>
        </Card>
        <Card title="System status">
          <Badge tone="success">healthy</Badge>
        </Card>
      </div>
    </div>
  );
﻿import { redirect } from "next/navigation";

export default function Home() {
  redirect("/products");
}

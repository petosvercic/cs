import { FactoryBuilder } from "@coso/coso-factory-ui";

export default function Page() {
  return (
    <main style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui" }}>
      <h1 style={{ fontSize: 24, marginBottom: 12 }}>nevedelE · Factory</h1>
      <FactoryBuilder />
    </main>
  );
}

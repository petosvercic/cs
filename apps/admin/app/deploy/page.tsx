import { Card } from "../ui/card";
import { getRootBuildCommands } from "@/lib/repo-data";

export const dynamic = "force-dynamic";

export default async function DeployPage() {
  const commands = await getRootBuildCommands();

  return (
    <div className="stack">
      <h2 className="page-title">Deploy</h2>
      <Card title="Vercel">
        <p>Integration not enabled in admin v1. This section is read-only placeholder.</p>
      </Card>
      <Card title="Build commands">
        <div className="code-block">{commands.join("\n") || "No scripts found."}</div>
      </Card>
    </div>
  );
}

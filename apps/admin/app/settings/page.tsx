import { Card } from "../ui/card";
import { Badge } from "../ui/badge";

const requiredEnvNames = [
  "BUILDER_TOKEN",
  "GITHUB_TOKEN",
  "GITHUB_OWNER",
  "GITHUB_REPO",
  "GITHUB_BASE_BRANCH",
  "BUILDER_GIT_COMMITTER_NAME",
  "BUILDER_GIT_COMMITTER_EMAIL"
];

export default function SettingsPage() {
  return (
    <div className="stack">
      <h2 className="page-title">Settings</h2>
      <Card title="Required environment variable names">
        <ul>
          {requiredEnvNames.map((name) => (
            <li key={name}>
              <code>{name}</code> <Badge tone="warning">value hidden</Badge>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

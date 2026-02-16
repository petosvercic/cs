import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";

export default function PublishPage() {
  return (
    <div className="stack">
      <h2 className="page-title">Publish pack</h2>
      <Card>
        <div className="stack">
          <label htmlFor="packId">Pack ID</label>
          <Input id="packId" name="packId" placeholder="my-pack" />

          <label htmlFor="payload">Payload (JSON)</label>
          <textarea
            id="payload"
            name="payload"
            className="input"
            style={{ maxWidth: "100%", minHeight: 180 }}
            placeholder='{"unknownList":[],"notes":{},"paywallCopy":{}}'
          />

          <div>
            <Button
              type="button"
              variant="secondary"
              disabled
              title="backend TBD"
              aria-disabled="true"
            >
              Publish (disabled)
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

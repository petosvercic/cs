import BuilderUI from "@coso/coso-factory-ui";

export default function BuilderUi({ initialEditions }: { initialEditions: any }) {
  return <BuilderUI editions={initialEditions} />;
}

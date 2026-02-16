import { FactoryBuilder } from "@coso/coso-factory-ui";

type Props = {
  initialEditions: unknown;
};

export default function BuilderUi({ initialEditions }: Props) {
  // FactoryBuilder chce "editions" (EditionIndexEntry[]).
  // page.tsx už posiela listEditions(), takže to je správny tvar.
  return <FactoryBuilder editions={initialEditions as any} />;
}

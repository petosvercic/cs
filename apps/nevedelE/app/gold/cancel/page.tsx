import { createTranslator, detectLanguage } from "../../one-day/localization";

export default function GoldCancelPage() {
  const t = createTranslator(detectLanguage());

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-xl text-center text-neutral-800">
        <p className="text-base">{t("gold.cancel.text")}</p>
      </div>
    </main>
  );
}

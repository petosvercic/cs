"use client";

import { useMemo, useState } from "react";

type Props = {
  refUrl: string;
  fullContinueUrl: string;
};

export default function ShareActions({ refUrl, fullContinueUrl }: Props) {
  const [toast, setToast] = useState<string | null>(null);

  const absolute = useMemo(() => {
    if (typeof window === "undefined") return refUrl;
    return `${window.location.origin}${refUrl}`;
  }, [refUrl]);

  const copy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(absolute);
      } else {
        const ta = document.createElement("textarea");
        ta.value = absolute;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setToast("Link skopírovaný ✅");
    } catch {
      setToast("Kopírovanie zlyhalo.");
    }
    window.setTimeout(() => setToast(null), 2200);
  };

  const open = () => {
    window.location.href = fullContinueUrl;
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => void copy()}
        className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
        title="Skopíruje zdieľací link"
      >
        Skopírovať link
      </button>
      <button
        type="button"
        onClick={open}
        className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
        title="Pokračovať v aplikácii"
      >
        Otvoriť profil
      </button>
      {toast ? <span className="text-xs font-medium text-slate-600">{toast}</span> : null}
    </div>
  );
}

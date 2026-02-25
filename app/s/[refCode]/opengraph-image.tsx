import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  // IMPORTANT: Do NOT render the refCode into the image (privacy + avoids doxxing in public shares).
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background:
            "radial-gradient(1200px 700px at 18% 8%, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.92) 35%, rgba(2,6,23,0.98) 70%), radial-gradient(900px 500px at 80% 20%, rgba(99,102,241,0.35) 0%, rgba(2,6,23,0) 60%), radial-gradient(700px 400px at 70% 80%, rgba(16,185,129,0.25) 0%, rgba(2,6,23,0) 60%)",
          color: "#ffffff",
          fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: "rgba(255,255,255,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              V
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 18, opacity: 0.86, letterSpacing: 2, textTransform: "uppercase" }}>Viora: Personal Analysis</div>
              <div style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.05 }}>VIP Pilot</div>
            </div>
            <div
              style={{
                marginLeft: "auto",
                padding: "10px 16px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.08)",
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              Odomkni bonusy ✨
            </div>
          </div>

          <div style={{ fontSize: 26, opacity: 0.92, maxWidth: 920 }}>
            Zdieľaj a odomykaj obsah. Pozvi ľudí a získaš ďalšie balíky (pilotný režim).
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 18,
          }}
        >
          {[
            { title: "Zdieľaj", sub: "1 bonus balík" },
            { title: "Pozvi 5", sub: "všetky dodatky" },
            { title: "Pozvi 20", sub: "VIP Pilot (premium look)" },
          ].map((card) => (
            <div
              key={card.title}
              style={{
                flex: 1,
                borderRadius: 26,
                padding: 26,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.16)",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 800 }}>{card.title}</div>
              <div style={{ fontSize: 20, opacity: 0.9 }}>{card.sub}</div>
              <div style={{ marginTop: 10, fontSize: 16, opacity: 0.78 }}>
                Aktivácia po registrácii, overení e-mailu a prvej akcii.
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", opacity: 0.82 }}>
          <div style={{ fontSize: 18 }}>Bez citlivých dát. Zdieľaš len link.</div>
          <div style={{ fontSize: 18, letterSpacing: 1.6, textTransform: "uppercase" }}>Viora</div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

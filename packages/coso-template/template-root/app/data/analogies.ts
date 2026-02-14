// app/data/analogies.ts
export type AnalogyTemplate = {
  id: string;
  text: string; // použije {days}
};

export const analogies: AnalogyTemplate[] = [
  // pôvodné
  { id: "avg-hens", text: "{days} dní. Približne priemerný život ~6000 nosníc. Áno, aj toto je štatistika." },
  { id: "netflix", text: "{days} dní. Dosť času na prežutie celého Netflixu... a aj tak by si nenašiel nič na večer." },
  { id: "walk-5km", text: "{days} dní. Keby si každý deň prešiel 5 km, bol by si už niekde medzi ‚urobil som to raz‘ a ‚nikdy viac‘." },
  { id: "calendar", text: "{days} dní. Tolkokrát si zaspal s tým, že zajtra budeš iný človek." },
  { id: "habits", text: "{days} dní. Väčšinu z nich si prežil na autopilote. Neber to osobne, tak funguje mozog." },
  { id: "messages", text: "{days} dní. Keby si každý deň poslal jednu správu človeku, čo ti chýba, dnes by si mal menej otázok." },
  { id: "photos", text: "{days} dní. Toľko dní, koľko fotiek máš v mobile… a stále sa bojíš vymazať rozmazané." },
  { id: "decisions", text: "{days} dní. Tolkokrát si si myslel, že máš plán. A potom prišiel život a zasmial sa." },
  { id: "time", text: "{days} dní. Dosť na to, aby sa z ‚raz‘ stalo ‚nikdy‘ a z ‚nikdy‘ zas ‚raz‘." },
  { id: "quiet", text: "{days} dní. A aj tak nevieš, kedy si naposledy sedel potichu bez potreby niečo riešiť." },

  // nové
  { id: "heartbeats", text: "{days} dní. Pri ~100 000 úderoch srdca denne je to absurdné množstvo práce, ktorú robíš bez vďaky." },
  { id: "breaths", text: "{days} dní. To sú milióny nádychov. A aj tak sa občas zabudneš nadýchnuť poriadne." },
  { id: "sleep", text: "{days} dní. Približne tretinu z toho si prespal. Zvyšok si prežil a nazýval to plán." },
  { id: "memories", text: "{days} dní. Väčšina zmizla. Pár ostalo. A presne tie pár ti občas riadi celý deň." },
  { id: "restarts", text: "{days} dní. Tolko pokusov začať odznova. Reštart je ľudská super-schopnosť aj výhovorka." },
  { id: "songs", text: "{days} dní. Keby si denne počul 3 minúty hudby, už by to boli mesiace čistého soundtracku." },
  { id: "waiting", text: "{days} dní. Časť z toho si strávil čakaním, že sa niečo zmení. Časť tým, že si to konečne zmenil ty." },
  { id: "thinking", text: "{days} dní. Väčšinu problémov si prežil v hlave dvakrát. Realita bola často kratšia." },
  { id: "small-talk", text: "{days} dní. Tolko príležitostí na small talk. A aj tak sa pamätajú tie dve vety, čo boli úprimné." },
  { id: "choices", text: "{days} dní. Denne robíš stovky mikro-rozhodnutí. Potom ťa prekvapí, že máš mikro-život." },
  { id: "attention", text: "{days} dní. Najdrahšia mena bola vždy pozornosť. A tá sa míňa rýchlejšie než peniaze." },
  { id: "habits2", text: "{days} dní. Z opakovaných vecí sa stane charakter. Z charakteru sa stane osud. A potom to nazveme náhoda." },
];

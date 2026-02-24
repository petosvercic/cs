// app/data/factTitles.ts

export type FactSectionKey =
  | "mind"
  | "body"
  | "social"
  | "time"
  | "name"
  | "meta"
  | "weird";

export type FactTitle = {
  id: string;
  title: string;
};

export const factTitles: Record<FactSectionKey, readonly FactTitle[]> = {
  mind: [
    { id: "mind-overthink", title: "Koľkokrát si si niečo premyslel viac, než to situácia potrebovala." },
    { id: "mind-decisions-in-head", title: "Koľko rozhodnutí si urobil v hlave, ktoré sa nikdy nestali." },
    { id: "mind-wrong-answer", title: "Koľkokrát si vedel správnu odpoveď, ale povedal si inú." },
    { id: "mind-scenarios", title: "Koľko energie si minul na scenáre, ktoré sa nikdy nenaplnili." },
    { id: "mind-too-late", title: "Koľkokrát si pochopil veci až neskoro. Ale stále včas." },
    { id: "mind-double-lived", title: "Koľko problémov si prežil dvakrát. Najprv v hlave, potom v realite." },
    { id: "mind-its-fine", title: "Koľkokrát si si povedal „to je jedno“, keď to jedno nebolo." },
    { id: "mind-felt-first", title: "Koľko krát si niečo cítil skôr, než si to vedel pomenovať." },
    { id: "mind-silence", title: "Koľkokrát si sa rozhodol mlčať, hoci si mal čo povedať." },
    { id: "mind-unsaid", title: "Koľko myšlienok si nikdy nikomu nepovedal. A prečo to tak ostalo." },
  ],

  body: [
    { id: "body-react-first", title: "Koľko krát tvoje telo zareagovalo skôr, než hlava." },
    { id: "body-no-energy", title: "Koľko dní si fungoval aj vtedy, keď si nemal energiu." },
    { id: "body-ignore-signal", title: "Koľko krát si ignoroval signál, že potrebuješ spomaliť." },
    { id: "body-walking", title: "Koľko hodín si strávil len tým, že si niekam šiel." },
    { id: "body-touch", title: "Koľko krát si sa dotkol iného človeka bez toho, aby si si to uvedomil." },
    { id: "body-tension", title: "Koľko dní si prežil s napätím v tele, ktoré si už bral ako normálne." },
    { id: "body-kept-going", title: "Koľko krát si si povedal, že si unavený, ale šiel si ďalej." },
    { id: "body-shallow-breath", title: "Koľko krát si dýchal plytko, lebo si na to ani nemyslel." },
    { id: "body-held-pace", title: "Koľko dní tvoje telo držalo tempo, ktoré si mu nenastavil ty." },
    { id: "body-ok-but-not", title: "Koľko krát si sa cítil fyzicky v pohode, ale mentálne nie." },
  ],

  social: [
    { id: "soc-influence", title: "Koľko ľudí si ovplyvnil bez toho, aby si si to uvedomil." },
    { id: "soc-changed-day", title: "Koľkokrát si niekomu zmenil deň. Aj neúmyselne." },
    { id: "soc-let-close", title: "Koľko ľudí si nechal bližšie, než si plánoval." },
    { id: "soc-relations-patience", title: "Koľko vzťahov prežilo len vďaka tvojej trpezlivosti." },
    { id: "soc-disappointed", title: "Koľko ľudí si sklamal bez zlého úmyslu." },
    { id: "soc-held-by-silence", title: "Koľko krát si niekoho podržal len tým, že si bol ticho." },
    { id: "soc-seen-different", title: "Koľko ľudí ťa pozná inak, než sa vnímaš ty sám." },
    { id: "soc-more-important", title: "Koľko krát si bol pre niekoho dôležitejší, než si tušil." },
    { id: "soc-ended-quiet", title: "Koľko vzťahov skončilo bez hádky. Len tichom." },
    { id: "soc-body-not-mind", title: "Koľko ľudí si si pustil k telu, ale nie k hlave." },
  ],

  time: [
    { id: "time-not-it", title: "Koľko dní si prežil v pocite, že „toto ešte nie je ono“." },
    { id: "time-ordinary-to-important", title: "Koľko dní sa začalo obyčajne a skončilo dôležito." },
    { id: "time-remember-bad", title: "Koľko dní si si pamätal len preto, že sa niečo pokazilo." },
    { id: "time-waiting", title: "Koľko dní si strávil čakaním na správny moment." },
    { id: "time-later", title: "Koľko dní si fungoval v režime „potom to vyriešim“." },
    { id: "time-routine", title: "Koľko dní sa stratilo v rutine bez jasnej stopy." },
    { id: "time-quiet-turn", title: "Koľko dní zmenilo smer tvojho života bez veľkého hluku." },
    { id: "time-forgot", title: "Koľko dní si prežil bez toho, aby si si večer spomenul, čo bolo ráno." },
    { id: "time-closer", title: "Koľko dní si bol bližšie k niečomu, aj keď si to necítil." },
    { id: "time-thought-time", title: "Koľko dní si si myslel, že máš čas." },
  ],

  name: [
    { id: "name-first-impression", title: "Koľko krát tvoje meno vytvorilo prvý dojem skôr než ty." },
    { id: "name-remembered-by-name", title: "Koľko ľudí si ťa zapamätalo len podľa mena, nie správania." },
    { id: "name-spoken-unknown", title: "Koľko krát tvoje meno niekto vyslovil bez toho, aby vedel, kto si." },
    { id: "name-versions", title: "Koľko verzií teba existuje v hlavách iných ľudí." },
    { id: "name-reintroduced", title: "Koľko krát si sa musel predstaviť znova. Aj keď si tam už bol." },
    { id: "name-associations", title: "Koľko ľudí spája tvoje meno s niečím, čo by ťa nenapadlo." },
    { id: "name-own-life", title: "Koľko krát si mal pocit, že meno, ktoré nosíš, má vlastný život." },
    { id: "name-context", title: "Koľko krát tvoje meno zaznelo v kontexte, ktorý si nemohol ovplyvniť." },
    { id: "name-self-vs-called", title: "Koľko krát si sa sám vnímal inak, než ako ťa volali ostatní." },
    { id: "name-layers", title: "Koľko významov si si na svoje meno časom navrstvil." },
  ],

  meta: [
    { id: "meta-same-mistake", title: "Koľko krát si zopakoval rovnaký typ chyby v inom obale." },
    { id: "meta-changed-mind", title: "Koľko krát si zmenil názor bez toho, aby si si to priznal." },
    { id: "meta-no-argue", title: "Koľko rozhodnutí vzniklo len preto, že bolo pohodlnejšie neodporovať." },
    { id: "meta-adapted", title: "Koľko krát si sa prispôsobil, aj keď to nebolo nutné." },
    { id: "meta-for-peace", title: "Koľko vecí si urobil „pre pokoj“, nie pre pravdu." },
    { id: "meta-stopped-before-change", title: "Koľko krát si sa zastavil tesne pred tým, než by sa niečo zmenilo." },
    { id: "meta-compromises", title: "Koľko kompromisov si urobil bez toho, aby si ich tak nazval." },
    { id: "meta-postponed", title: "Koľko krát si niečo odložil a už sa k tomu nevrátil." },
    { id: "meta-closer-than-thought", title: "Koľko krát si bol bližšie k riešeniu, než si si myslel." },
    { id: "meta-did-it-anyway", title: "Koľko vecí si zvládol len preto, že nebola iná možnosť." },
  ],

  weird: [
    { id: "weird-same-structure", title: "Koľko situácií si prežil, ktoré mali rovnakú štruktúru, len iné mená." },
    { id: "weird-broke-before-end", title: "Koľko krát sa ti veci pokazili tesne pred koncom." },
    { id: "weird-circle-floor", title: "Koľko krát si mal pocit, že sa točíš v kruhu, ale v inom poschodí." },
    { id: "weird-did-what-criticized", title: "Koľko krát si urobil presne to, čo si kedysi kritizoval." },
    { id: "weird-moved-when-let-go", title: "Koľko krát sa ti veci pohli až vtedy, keď si ich pustil." },
    { id: "weird-same-place-new-mind", title: "Koľko krát si sa ocitol na rovnakom mieste v inom stave mysle." },
    { id: "weird-decisions-forced", title: "Koľko krát sa rozhodnutia vynútili samy." },
    { id: "weird-right-time", title: "Koľko krát si mal pocit, že niečo „prišlo v správny čas“." },
    { id: "weird-later-why", title: "Koľko krát si spätne pochopil, prečo to inak nešlo." },
    { id: "weird-pattern-repeat", title: "Koľko krát sa v tvojom živote opakoval rovnaký vzorec v inom čase." },
  ],
} as const;

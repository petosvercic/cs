export const notes = {
  // Druhá veta po: "Narodil si sa v znamení X."
  // Preto sem NEPÍŠ "{zodiac}:" ani názov znamenia.
  westernZodiac: [
    "[DEMO] Keď chceš, vieš byť nenápadný. Keď nie, vieš byť nezabudnuteľný.",
    "Navonok pokoj. Vnútri presný radar na blbosť.",
    "Vieš pôsobiť vyrovnane. Až kým niekto nezačne tlačiť na miesta, ktoré si nechcel vysvetľovať.",
    "Máš talent tváriť sa, že je to v pohode. A potom to potichu spracovať po svojom.",
    "Vieš držať veci pokope. Aj keď len silou vôle a zvyku.",
    "Ľudia si často myslia, že ťa majú prečítaného. To je milé.",
    "Si z tých, čo sa dokážu prispôsobiť. Otázka je, kedy sa pritom stratíš.",
    "Všimneš si detaily, ktoré iní preskočia. A potom sa čuduješ, prečo ti niektoré veci vadia viac.",
    "Vieš byť trpezlivý. A potom príde moment, keď už nie.",
    "Nie si chaotik. Len máš vlastnú logiku, ktorá sa neobťažuje vysvetľovať.",
    "Vieš byť láskavý. Aj keď nie vždy mäkký.",
    "Niekedy pôsobíš vzdialene. V skutočnosti len triediš, čo má zmysel a čo je šum.",
    "Dokážeš byť verný. Keď cítiš, že to má cenu.",
    "Máš silný vnútorný kompas. Občas ukazuje sever tam, kde ho iní nevidia.",
    "Vieš sa smiať. Aj keď je to občas obranný mechanizmus.",
    "Keď sa rozhodneš, že niečo nechceš, zrazu je to veľmi jednoduché.",
    "Keby si mal robiť veci len podľa nálady, svet by bol chaotickejší. Preto to nerobíš.",
    "Máločo ťa prekvapí. Ale veľa vecí ťa dokáže sklamať.",
    "Vieš byť intenzívny. Len to nenechávaš na povrchu.",
    "Nie si ľahko ovplyvniteľný. A niekedy je to výhoda.",
  ] as const,

  // legacy
  chineseZodiac: [
    "{cz}: ročný build osobnosti, ktorý sa tvári ako osud.",
    "{cz}: legenda hovorí, že si tvrdohlavý. Realita: občas áno.",
    "{cz}: nie si problém. Si funkcia, ktorú nikto netestoval.",
    "{cz}: znie to ako horoskop. Funguje to skôr ako metafora.",
    "{cz}: ľudia tomu neveria, kým sa v tom nespoznajú.",
  ] as const,

  // Používané vo vete: "V čínskom znamení si sa narodil v roku {cz} ({year}). {base}"
  chineseZodiacByAnimal: {
    Potkan: [
      "Rýchlo chápeš a prispôsobíš sa. Niekedy až tak, že si spätne nevieš určiť, kde si sa vlastne rozhodol.",
      "Vieš sa zorientovať v chaose. Horšie je, keď si chaos začneš pestovať.",
      "Máš cit na príležitosti. Aj na to, kedy odísť skôr, než to začne byť trápne.",
    ],
    Byvol: [
      "Vydržíš viac než ostatní. Otázka je, či to vždy stojí za to.",
      "Keď niečo robíš, robíš to poriadne. Aj keď to nikto neocení.",
      "Máš výkon v krvi. Niekedy by sa zišlo dať mu voľno.",
    ],
    Tiger: [
      "Máš silu ísť proti prúdu. Problém je, keď ideš proti všetkému.",
      "Vieš byť odvážny. Aj vtedy, keď sa ostatní tvária rozumne.",
      "Keď sa rozhodneš, ideš naplno. A potom ťa prekvapí, že svet to nerobí s tebou.",
    ],
    Zajac: [
      "Vieš sa vyhnúť konfliktom. Aj tým, ktoré by stálo za to podstúpiť.",
      "Máš cit na atmosféru. Niekedy ťa to zachráni, inokedy vyčerpá.",
      "Pôsobíš jemne. Lenže jemnosť nie je slabosť.",
    ],
    Drak: [
      "Ľudia ťa vnímajú výraznejšie, než si myslíš. Ty sám často netušíš prečo.",
      "Vieš zapáliť iskru. Otázka je, kto potom hasí.",
      "Keď si v dobrej forme, ťaháš veci dopredu. Keď nie, aj ticho má váhu.",
    ],
    Had: [
      "Premýšľaš hlbšie než dávaš najavo. Nie vždy je to pre teba výhoda.",
      "Vieš čítať medzi riadkami. Občas tam nájdeš aj to, čo tam nikto nepísal.",
      "Si trpezlivý pozorovateľ. A potom urobíš jeden krok, ktorý všetko zmení.",
    ],
    "Kôň": [
      "Potrebuješ pohyb, zmenu, impulz. Zotrvanie ťa unavuje rýchlejšie než ostatných.",
      "Keď máš slobodu, funguješ. Keď máš klietku, začneš hľadať dvere.",
      "Máš tempo. Niekedy by si ho mal prestať brať ako povinnosť.",
    ],
    Koza: [
      "Si citlivejší, než pôsobíš. A tvrdší, než by si si priznal.",
      "Ľudia v tebe vidia mäkkosť. Nevidia, koľko energie stojí byť takýto človek.",
      "Vieš byť empatický. Lenže empatia nie je nekonečná batéria.",
    ],
    Opica: [
      "Vieš veci otočiť vo svoj prospech. Niekedy aj vtedy, keď by si nemal.",
      "Si rýchly v hlave. Občas až príliš rýchly pre vlastný pokoj.",
      "Vieš improvizovať. Otázka je, kedy to prestane byť zručnosť a začne byť únik.",
    ],
    Kohút: [
      "Záleží ti na poriadku a pravde. Hlavne na tej svojej.",
      "Vieš pomenovať veci nahlas. Aj keď by ich iní radšej nechali v hmle.",
      "Máš štandardy. Niekedy ich dáváš aj ľuďom, ktorí o to neprosili.",
    ],
    Pes: [
      "Vieš byť lojálny. Keď sa sklamanie nazbiera, pamätáš si ho dlho.",
      "Keď niekomu veríš, držíš. Keď nie, zrazu je ticho veľmi jasné.",
      "Máš silný zmysel pre férovosť. Aj preto ťa niektoré veci bolia viac než iných.",
    ],
    Prasa: [
      "Vieš si užívať prítomnosť. Občas až na úkor budúcnosti.",
      "Vieš byť veľkorysý. Len si dávaj pozor, aby to nebolo na tvoj účet.",
      "Keď je dobre, vieš sa uvoľniť. Keď nie, držíš sa drobností, ktoré ešte fungujú.",
    ],
  } as const,

  daysAlive: [
    "{days} dní na svete. Dosť času na pár omylov aj pár pekných náhod.",
    "{days} dní existencie. To je už celkom slušná séria epizód.",
    "{days} dní. A stále sa tvárime, že máme čas.",
    "{days} dní. Niektoré si pamätáš, niektoré ťa formovali aj bez pamäti.",
    "{days} dní. Znie to ako číslo. V praxi je to zmes náhod, zvykov a pár rozhodnutí.",
    "{days} dní. Väčšinu z nich si prežil na autopilote. Neber to osobne, tak funguje mozog.",
  ] as const,

  famous: [
    "V tento deň sa svet tváril normálne. A práve preto sa tam zmestilo veľa osudu.",
    "Niečo dôležité v tento deň začalo nenápadne. Ako väčšina vecí, čo neskôr veľa znamenajú.",
    "Nie všetko, čo sa začína ticho, skončí ticho.",
    "Niektoré dni sú slávne až spätne. Tento má na to talent.",
  ] as const,

  blurredIntro: [
    "Čo ďalej určite nevieš:",
    "A teraz to príde:",
    "Ďalšie veci, ktoré si o sebe neplánoval zistiť:",
    "Veci, ktoré zistíš až vtedy, keď je neskoro robiť sa prekvapene:",
  ] as const,
} as const;

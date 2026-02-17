# Architecture Freeze (Skupina 0)

1) Admin app (apps/admin) je portfólio shell: spravuje zoznam produkčných systémov a poskytuje prístup k ich interným modulom.
2) Produkčný systém je nasadený end-user web: je to výsledný produkt, ktorý používa šablónu + engine + paywall.
3) Builder je interný modul produkčného systému: jeho úloha je vytvoriť nový produktový balík (content pack + konfigurácia) a publikovať ho.
4) Content pack je jednotka variability: menia sa iba dáta (texty, pooly, parametre), nie UI ani engine logika.
5) Nový produkt = nový deploy target tej istej šablóny s iným content packom.

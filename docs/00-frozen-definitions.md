# Zmrazovacie definície (Skupina 0)

1) Admin je portfóliové prostredie, ktoré spravuje produkty a iba hostuje ich interné moduly.

2) Každý produkčný nástroj má svoj vlastný interný Builder modul.

3) Builder je zodpovedný za tvorbu, validáciu a publikovanie edícií (balíkov) pre svoj produktový typ.

4) Produkčný web (end-user) edície iba číta a volá spoločný engine s kontextom svojej edície; edície sa nevyrábajú v end-user webe.

5) Nový produktový deploy vzniká použitím rovnakého Template + Engine, ale inej edície, pričom existujúce deploye zostávajú nedotknuté.

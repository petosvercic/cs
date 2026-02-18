# Skupina 0 — Zmrazené definície a hranice (platí navždy)

1) **Portfólio Admin** je samostatná appka v monorepe (napr. pps/admin) a slúži ako riadiace centrum portfólia produkčných systémov.  
2) **Produkčný systém** (napr. pps/nevedelE) je samostatný end-user web; portfólio admin nie je súčasť jeho UI.  
3) **Builder** je interný nástroj konkrétneho produkčného systému (ako modul v portfólio admingu), ktorý vyrába a publikuje **Content Packy** pre šablónu daného produktu.  
4) **Šablóna produktu** (UI/flow/paywall) je stabilná; variabilita ide výhradne cez **Content Packy** (texty + parametre pre engine), nie kopírovaním webov.  
5) Produkčný web v runtime **len číta aktívny Content Pack a volá spoločný engine**; Builder rieši tvorbu/publikovanie packov a prehľad dostupných packov.

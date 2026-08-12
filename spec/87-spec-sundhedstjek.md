# QuistLine.ai — Addendum: Spec-sundhedstjek (pkt. 30.5 i praksis)

*Tilføjet: 12. august 2026*
*Status: **BESLUTTET/RETTET** — dette er det første kørte spec-
sundhedstjek, jf. pkt. 30.5. Udløst af en ekstern gennemgang af repo +
spec samme dag.*
*Tags: `#governance #sundhedstjek #rettelse`*

---

## 87. Hvorfor dette addendum findes

En gennemgang af repoet og specen fandt fire reelle problemer i selve
dokumentationslaget — ikke i produktet, men i den proces, der skal styre
produktet. Det er præcis den slags, pkt. 30.5 findes for at fange, og det
er værd at rette nu, mens der er 15 filer, ikke 50.

---

## 88. Rettelse 1: Nummerhullet i åbne spørgsmål (#8)

**Fundet:** addendum "model-provider-claude" springer fra specens
oprindelige 7 åbne punkter direkte til "9." — punkt 8 blev aldrig
defineret. En simpel forfatterfejl fra den session.

**Rettelse:** #8 erklæres formelt **retired/tomt** — det skal ikke
udfyldes retroaktivt, og ingen fremtidig session skal tildele det et
spørgsmål. Grunden til at lade nummeret stå tomt frem for at omnummerere
alt fra 9 og opefter: `INDEX.md`s egen regel siger punktnumre er globale
og stabile — en reference til "pkt. 56.1" skal altid pege ét sted. At
omnummerere ville bryde det princip for at rette et rent kosmetisk hul.

`INDEX.md` er allerede rettet til at vise dette (den viste "*(ledig)*" for
#8 fra sundhedstjekket blev indført) — dette addendum er den formelle
begrundelse for hvorfor, så en fremtidig session ikke undrer sig.

---

## 89. Rettelse 2: Status-oversigten i addendum 83 var ufuldstændig

**Fundet:** pkt. 86's to lister ("blokeringer fjernet" / "stadig åbne")
udelod #6, #7 og #15. #15 var korrekt udeladt (den var allerede lukket
længe før, og hører til i ingen af de to lister). #6 og #7 var derimod en
reel forglemmelse — begge har uklar status efter at #13 blev lukket i det
samme addendum.

**Rettelse — opdaterede statusser:**

| # | Spørgsmål | Opdateret status |
|---|---|---|
| 6 | Permissions-listens omfang | **Delvist lukket.** Platform-agenter: uændret statisk model (pkt. 3.5, nu markeret). Projekt-workers: lukket af pkt. 66.3 (dynamisk tillid). Ingen resterende uklarhed |
| 7 | Data-arkitektur mod eksisterende stack | **Lukket**, som en direkte konsekvens af at #13 blev lukket (pkt. 83). Spørgsmålet var "hvordan mappes mappekrav til Postgres/MongoDB/Railway" — svaret er nu: Postgres, jf. pkt. 83 |

`INDEX.md` opdateres til at afspejle dette (se pkt. 93 nedenfor).

---

## 90. Rettelse 3: Den påståede modsigelse mellem pkt. 54.1 og pkt. 66.2

**Den påståede modsigelse:** pkt. 54.1 begrunder "Chief pr. business" med
at undgå at bære andre projekters historik. Pkt. 66.2 kræver samtidig, at
Chief slår stamtavlen op på tværs af projekter, før den foreslår et team.

**Hvorfor det ikke reelt er en modsigelse — men var utydeligt skrevet:**
De to punkter taler om to forskellige ting, som ligner hinanden på
overfladen:

- **Pkt. 54.1's bekymring** er *fuld samtale-kontekst*: at Chief for
  projekt A skal holde hele historikken (beslutninger, tanker, rapporter)
  fra projekt B i sit arbejdshukommelse. Det er dyrt og unødvendigt
- **Pkt. 66.2's krav** er et *smalt, struktureret databaseopslag*: "find
  komponenter i `artifacts`-tabellen, filtreret på type, med målte
  resultater." Det er en SQL-forespørgsel, ikke en genindlæsning af
  projekt B's fulde Chief-samtale

**Rettelse (tilføjes som en note direkte i pkt. 66.2):** stamtavle-opslag
er et scoped opslag i `artifacts`-tabellen — aldrig en indlæsning af en
anden businessʼ fulde event-log eller Chief-kontekst. Det er forskellen
mellem at spørge "hvilke skruer virkede i sidste projekt?" og at læse hele
byggejournalen for det andet hus igennem.

---

## 91. Rettelse 4: Hash-kædens beviskraft — et ærligt forbehold, ikke en fejl

**Fundet, og værd at tage seriøst:** en hash-kæde, der kun lever i din
egen Postgres-database, beviser *intern konsistens* (ingen historik blev
ændret uden at det ses i kæden af en, der ikke også kontrollerer
databasen) — men den beviser **ikke** noget over for en køber, der ved,
at du (Owner) har fuld adgang til den samme database. En ejer med
databaseadgang kunne i princippet omskrive historikken og genberegne hele
kæden konsistent forfra.

**Dette svækker ikke idéen (pkt. 66.1), men det betyder, at "beviseligt
uændret" er en overdrivelse, indtil der er ekstern forankring.**

**Tilføjes som forbehold til pkt. 66.1, ikke en tilbagerulning:**
- Hash-kæden er stadig værdifuld: den fanger utilsigtet korruption, og
  den fanger en agent eller worker, der forsøger at redigere historik
  uden Owners vidende
- Den beviser **ikke** noget over for en skeptisk køber uden **ekstern
  forankring** — dvs. at kædens aktuelle "tip-hash" periodisk offentliggøres
  et sted, du ikke selv kontrollerer (fx en offentlig GitHub-commit, en
  timestamping-tjeneste, eller simpelthen en e-mail til dig selv på en
  ekstern udbyder). Uden det kan en køber ikke vide, at hash'en fandtes
  *før* salget
- **Ekstern forankring er ikke et krav for trin 1** — det er en tilføjelse
  til Marketplace (trin 10), hvor proveniens reelt bliver en vare. At
  bygge hash-kæden nu er stadig korrekt (billig at etablere, umulig at
  eftermontere troværdigt) — det er kun *salgs-påstanden* om den, der skal
  vente og formuleres ærligt

**Nyt åbent punkt, se pkt. 92.**

---

## 92. Nyt åbent punkt (tilføjes til spec pkt. 14)

23. Hvilken ekstern forankrings-metode for hash-kæden er enkel nok til
    reelt at blive brugt løbende (fx månedligt), uden at det bliver endnu
    en opgave, der glemmes? Skal afklares før Marketplace (trin 10), ikke
    før trin 1

---

## 93. Rettelse 5: Trin 1 splittes for at undgå den scope creep, pkt. 39/71 advarer om

**Fundet — reel bekymring, ikke fejl:** trin 1 skal nu bære datamodel +
event-log + hash-kæde + stamtavle + trust-tabeller, før *noget* virker.
Det er netop den risiko, pkt. 39 og 71 selv navngiver, men uden en konkret
løsning. Her er løsningen:

**Trin 1 deles i to del-trin:**

| Del-trin | Indhold | Kan testes ved |
|---|---|---|
| **1a** | `business`, `task`, `event` (med `prev_event_hash` + `event_hash` fra start), grundlæggende migration | En task kan oprettes, og hændelser kan skrives/læses i kæde |
| **1b** | `lineage_parent_id`, `artifacts`, `agent_trust`, `provenance` | Kan tilføjes uden at bryde 1a — ingen af felterne fra 1b er en forudsætning for at 1a virker |

**Hvorfor denne opdeling er sikker:** hash-feltet skal med fra 1a, fordi
det er det ene felt, der er reelt umuligt at eftermontere troværdigt
(pkt. 66.1). Stamtavle, artifacts og trust kan derimod tilføjes som en ren
udvidelse bagefter — de kræver ikke, at historikken allerede findes for
at give mening, i modsætning til hash-kæden.

**Konsekvens:** trin 2 (orchestrator + Vagtpost) kan påbegyndes, når 1a er
færdig. Man behøver ikke vente på 1b.

---

## 94. Status efter dette sundhedstjek

- Nummerhul (#8): forklaret og lukket som "retired", ikke rettet ved
  omnummerering
- #6 og #7: statusser opdateret (pkt. 89)
- Pkt. 54.1 / 66.2: præciseret, ikke en reel modsigelse (pkt. 90)
- Pkt. 3.5 og pkt. 7 i master-specen: nu markeret *overskrevet af* direkte
  i originalen, jf. governance-reglen (pkt. 30.15) — første gang reglen
  reelt er anvendt på sig selv
- Hash-kædens beviskraft: forbehold tilføjet, nyt åbent punkt #23
- Trin 1: delt i 1a/1b for at undgå at blokere hele byggeriet på fem
  datamodeller samtidig

**Ingen af disse rettelser ændrer nogen tidligere beslutning.** De
retter, hvordan beslutningerne er skrevet ned og sekventeret — hvilket er
selve pointen med et sundhedstjek (pkt. 30.5): det er vedligeholdelse af
kortet, ikke af terrænet.

---
*Tilføjet til projektets vidensbase. Udvider pkt. 30.5, 54.1, 66.1, 66.2,
83, og markerer master-spec pkt. 3.5 og pkt. 7 direkte i originalen.*

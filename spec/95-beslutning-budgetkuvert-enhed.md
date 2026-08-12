# QuistLine.ai — Addendum: Budgetkuvert og token-værn måles i tokens

*Tilføjet: 12. august 2026*
*Status: **BESLUTTET** af Owner 12. august 2026.*
*Tags: `#beslutning #budget #vagtpost`*

*Lukker åbent spørgsmål 17. Delvist overskriver pkt. 84's budget-værn-række
(spec addendum "beslutninger-database-taerskler"), jf. governance pkt. 30.15.*

---

## 95. Beslutning: tokens, ikke kroner

**Besluttet:** alle budget-relaterede tærskler i platformen — budgetkuverten
(pkt. 56.3) og Vagtpostens budget-værn (pkt. 60.1/84) — måles i **tokens**,
ikke kroner.

### 95.1 Konsekvens for pkt. 84's budget-værn
Den oprindelige tærskel var "2× tørkørslens estimat. Uden estimat: 25 kr
pr. task." Multiplikatoren (2×) er uændret — kun enheden og
fallback-tallet ændres:

| Værn | Tærskel (rettet) |
|---|---|
| **Budget-værn** | 2× tørkørslens estimat (i tokens). Uden estimat: **20.000 tokens pr. task** |

**Begrundelse for 20.000 som fallback:** en normal opgave i den nuværende
synkrone flow (Engineer-kald + Chief-svar) bruger typisk et par tusind
tokens sammenlagt. 20.000 er rummeligt nok til ikke at ramme normal brug,
men stadig et reelt loft mod en opgave, der løber løbsk — samme ånd som
den oprindelige 25 kr-grænse: en grænse, der sjældent skal ramme ved
normal drift.

### 95.2 Hvorfor tokens frem for kroner
- Kroner kræver løbende opdaterede provider-priser for at omregne korrekt
  (forskellige modeller/providere har forskellige pris pr. token)
- Tokens er den enhed, provideren selv rapporterer (`tokens_in`/`tokens_out`
  på hver `event`, jf. pkt. 40) — ingen omregning, ingen risiko for at
  regne forkert, hvis en pris ændrer sig
- Prisen kan altid *afledes* af tokens + en pristabel senere (til Finance,
  pkt. 10) — men selve vagtpost-tærsklen har ikke brug for kroner for at
  fungere

### 95.3 Status på `checkBudgetGuard`
Funktionen i `src/guards.js` er stadig **ikke koblet til en live call-site**
(uændret fra pkt. 93/side 2.1's afgrænsning) — der findes intet
tool-kalds-loop endnu, der akkumulerer forbrug pr. task at vogte. Denne
beslutning fastlægger enheden og fallback-tallet, så funktionen er klar,
når den kobles til, ikke en aktivering af den nu.

---

## 96. Status efter denne beslutning

**Lukker åbent spørgsmål 17.** Ingen andre åbne spørgsmål påvirket.
`spec/83`'s pkt. 84-tabel markeres *delvist overskrevet af pkt. 95* i
originalen, jf. governance pkt. 30.15.

---
*Vedtaget af Owner. Overskriver delvist pkt. 84 (kun budget-værn-rækken,
resten af pkt. 84 er uændret) og udvider pkt. 56.3.*

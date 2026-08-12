# QuistLine.ai — Addendum: Dokumentations-, log- og tool-disciplin

*Tilføjet: 12. august 2026*
*Kontekst: Flere addendummer (pkt. 15–22) er hidtil skrevet ad hoc, efter
behov. Denne addendum samler det til et fast system, så intet afhænger af
at nogen "kommer i tanke om" at skrive det ned eller overveje et tool.*

---

## 23. Tre lag af dokumentation — hvad hører hvor

| Lag | Hvad det dækker | Hvor det bor | Besluttet i |
|---|---|---|---|
| **Spec-lag** | Beslutninger om HVORDAN platformen skal bygges, inden kode skrives | Dette projekts docs (master spec + addendummer) | pkt. 0 |
| **Produkt-lag** | Dokumentation af HVAD der faktisk er bygget, i selve det byggede projekt | `/memory`, `/docs`, `/reports` pr. business | pkt. 4 |
| **Drifts-log** | HVAD der skete — tasks, fejl, nødstop, tidsstemplet | Global log/backlog-visning | pkt. 9 |

Disse tre lag er hver for sig allerede besluttet, men aldrig samlet som ét
system. Resten af denne addendum lukker hullerne mellem dem.

## 24. Session-protokol for spec-laget

**Regel:** Enhver session hvor en reel beslutning træffes (arkitektur,
UI-krav, prioritering, provider-valg osv.) skal ende med et skriftligt
addendum — ikke kun stå mundtligt i chatten.

**Tjekliste ved afslutning af en beslutningssession:**
1. Er beslutningen skrevet ned i et nyt/eksisterende addendum-dokument?
2. Er evt. nye åbne spørgsmål tilføjet til punkt 14's liste?
3. Er evt. modstridende tidligere beslutninger markeret som *overskrevet*
   (ikke slettet — historik bevares, jf. Git-filosofien i pkt. 8)?

**Ansvar:** Owner kan bede om et addendum, men Claude bør også selv
foreslå det proaktivt, når en session indeholder en reel beslutning — ikke
kun en afklarende snak uden konklusion.

## 25. Synlige antagelser og alternativer — krav om at "gennemtænke"

Før Chief foreslår eller godkender en opgave, skal Chief eksplicit angive:
1. **Antagelser** — hvad regnes for givet, som ikke står i selve
   opgaveteksten?
2. **Alternativer overvejet** — var der en anden løsning, og hvorfor blev
   den ikke valgt?
3. **Risici** — hvad kan gå galt, og hvad er konsekvensen hvis det gør?

Dette udvides ind i rapport-skabelonen (pkt. 27), så det ikke kun sker i
hovedet på Chief, men bliver en del af den skriftlige efterprøvning.

## 26. Tool-overvejelse som fast trin (nyt permissions-lag)

**Problem lige nu:** Permissions-modellen (pkt. 3.5) dækker *handlinger*
(hyre, fyre, godkende, delegere osv.), men ikke *tool-adgang* — altså
hvilke eksterne integrationer/MCP'er/API'er en agent rent faktisk må
kalde.

**Ny regel (tilføjes som pkt. 3.5.1):** Før Chief godkender en task, skal
Chief eksplicit besvare:
- Kræver opgaven et tool/integration, som **ikke allerede er forbundet**
  (fx browser, GitHub, Stripe, en bestemt MCP-server)?
- **Hvis ja:** opgaven må ikke startes før Owner har godkendt *tool'et*
  specifikt — en selvstændig godkendelse, adskilt fra opgave-godkendelsen
  (samme "intet sker stiltiende"-princip som deploy-adskillelsen i pkt. 7).
- **Hvis nej** (kun eksisterende tools bruges): angiv hvilke, direkte i
  task-rapporten.

**Datamodel-konsekvens:** Tasks-skemaet (jf. `src/tasks.json` og
MongoDB-schema i `src/server.js`) udvides med:
```json
{
  "toolsRequired": [],
  "toolsApprovalStatus": "not_applicable | pending | approved"
}
```

## 27. Udvidet rapport-skabelon (retroaktiv rettelse til pkt. 9)

Nuværende felter: status / metode / resultat / anbefaling.

**Tilføjes:**
- **Antagelser & alternativer** (jf. pkt. 25)
- **Tools brugt** — hvilke tools/API'er/integrationer blev faktisk kaldt
- **Tools overvejet, men ikke brugt** — og hvorfor, så samme overvejelse
  ikke skal gentages unødigt senere
- **Nye åbne spørgsmål** — hvis opgaven afslørede et hul i specen, skal
  det stå i rapporten direkte, ikke kun huskes af Chief

## 28. Konsekvens for Bibliotekar-agenten

Bibliotekar-agenten (pkt. 4, håndhæver mappestruktur) udvides til også at
validere: er rapport-skabelonen (pkt. 27) fuldt udfyldt — herunder at
`toolsRequired`-feltet ikke bare er udeladt — før en task må markeres
DONE. En task med tomt tools-felt uden begrundelse ("N/A — ingen
eksterne tools relevante") skal afvises af Bibliotekaren, ikke stilfærdigt
accepteres.

## 29. Nyt åbent punkt (tilføjes til spec pkt. 14)

10. Skal tool-godkendelse (pkt. 26) være pr. task, eller kan Owner give en
    generel "godkend permanent" for et tool efter første gang (fx GitHub,
    når det først er forbundet)? Uden dette bliver selv trivielle,
    allerede-godkendte integrationer en ny godkendelsesrunde hver gang.

---
*Tilføjet til projektets vidensbase. Udvider pkt. 3.5 (permissions), pkt. 7
(godkendelses-adskillelse) og pkt. 9 (rapportering) — erstatter ikke disse,
men lukker hullet mellem dem.*

# QuistLine.ai — Addendum: 15 forbedringer til log-, dokumentations- og
projektdisciplin (mål: bedre end cto.new på proces, ikke kun UI)

*Tilføjet: 12. august 2026*
*Kontekst: Udvider addendum pkt. 23–29 (dokumentations-, log- og
tool-disciplin). De første 5 punkter er tidligere fremlagt i samtale —
formaliseret her sammen med 10 nye. cto.new konkurrerer på UI og
forretningsmodel; denne addendum er bevidst fokuseret på det, de ikke kan
give dig — en revideret, sporbar proces omkring dit eget projekt.*

---

## 30. De 15 forbedringer

### 30.1 Idé-parkeringsplads, separat fra beslutninger
Løse idéer, der dukker op midt i en samtale uden at blive besluttet der og
da, har i dag ingen hjem — de forsvinder. Opret `ideas.md` hvor uafklarede
idéer logges med status (`idé` / `overvejes` / `afvist — hvorfor` /
`flyttet til beslutning`). Adskilt fra pkt. 14's åbne spørgsmål, som kræver
et reelt svar for at lukkes.

### 30.2 Ét levende indeks-dokument
Ved denne addendum er der 7+ dokumenter. Ingen genlæser dem alle for at
finde modstrid. Opret `INDEX.md`: én linje pr. spec-punkt med nuværende
status + hvilket addendum, der sidst rørte det. Gør specen navigerbar i
stedet for en stak, man skal huske udenad.

### 30.3 Rapport-tjek som kode, ikke kun politik
Pkt. 27/28 kræver at Bibliotekaren validerer rapport-skabelonen — men det
er stadig kun en regel i et dokument. Reel styrke kommer, når task-loopet
**teknisk ikke kan** sætte status DONE, hvis `toolsRequired` eller
antagelser-feltet er tomt. Dokumentation der kan omgås er ikke
dokumentation.

### 30.4 Traceability — kode tilbage til beslutning
Hver gang en agent bygger noget, der stammer fra en specifik beslutning,
skal kode/commit-besked referere punktet (fx `// jf. spec 3.5.1`). Giver
et revisionsspor: du kan altid se *hvorfor* noget ser ud som det gør, og
opdage drift mellem besluttet og bygget.

### 30.5 Fast spec-sundhedstjek
Addendummer hober sig op uden at nogen tvinger dem sammen. Indfør en
tilbagevendende gennemgang (fx hver X tasks, eller ugentligt) hvor pkt.
14's åbne liste + eventuelle modstridende addendummer aktivt gennemgås og
lukkes — i stedet for at dokumentationen kun vokser (write-only).

### 30.6 Tags/metadata pr. addendum
Når antallet af addendummer vokser, bliver søgning umulig uden struktur.
Hvert addendum får en tag-linje i toppen (fx `#ui #governance #model`), så
et fremtidigt "find alt om Chief-chattens design" ikke kræver at læse alt.

### 30.7 Versionsnummerering af selve specen
I stedet for kun enkelte addendummer, indfør `v1.0`, `v1.1` osv. med et
kort samlet "hvad ændrede sig i denne version"-resumé. Adskiller *løbende*
tilføjelser fra *milepæle*, man kan referere til (fx "byg efter v1.2").

### 30.8 Decision owner-felt pr. beslutning
Hver beslutning i `decisions.md` mærkes med hvem foreslog den (Claude/
Chief/Owner) og hvem godkendte den endeligt. Giver ansvarsspor — vigtigt
når flere Claude-sessioner og senere måske Kenneth er involveret i
forskellige dele.

### 30.9 Reversibilitets-mærkning pr. beslutning
Mærk hver beslutning `let at ændre senere` eller `strukturel/dyr at ændre`
(fx datamodel, agent-arkitektur). Hjælper med at prioritere, hvilke
beslutninger der kræver mest omtanke *før* de tages, i stedet for at
opdage prisen bagefter.

### 30.10 Automatisk sammenkøring af "nye åbne spørgsmål"
Rapport-skabelonen (pkt. 27) kræver allerede et "nye åbne spørgsmål"-felt
pr. task. Byg et simpelt script, der samler dette felt fra alle rapporter
og foreslår tilføjelser til pkt. 14's liste — i stedet for manuel
gennemlæsning af hver rapport for at fange det.

### 30.11 Adskilt internt vs. præsentabelt lag
Hvis QuistLine.ai en dag skal vises til andre (investor, Kenneth,
fremtidig medstifter), skal der findes et præsentabelt lag, der ikke
blander rå interne beslutningsnoter (fulde addendummer) med en ren
oversigt. Undgår at skulle omskrive alt i sidste øjeblik.

### 30.12 Audit-log for tool-/API-kald
Separat fra task-rapporten: log hvert faktisk tool/API-kald med
tidsstempel, agent, model, formål. Ikke kun *at* et tool blev brugt (jf.
pkt. 27), men et fuldt, uredigerbart spor — vigtigt for sikkerheds- og
cost-revision senere, og for at kunne besvare "hvornår og hvorfor kaldte
en agent GitHub sidste gang".

### 30.13 Periodisk backup/export af hele vidensbasen
Hele denne vidensbase lever i dag kun i ét Claude Team-projekt. Indfør en
tilbagevendende eksport (fx til Drive eller et privat GitHub-repo), så
intet er afhængigt af én platforms tilgængelighed.

### 30.14 "Definition of Done" pr. modul, ikke kun pr. task
Et modul (fx Finance eller Marketplace) skal have en synlig, skriftlig
facit-liste for hvornår det anses som færdigbygget — ikke kun en subjektiv
vurdering fra sag til sag. Forhindrer at moduler forbliver "80% færdige"
uden at nogen lægger mærke til det.

### 30.15 Konflikt-flag ved ny addendum
Når et nyt addendum tilføjes, og det ændrer eller indskrænker et tidligere
punkt, skal det gamle punkt markeres synligt som *overskrevet af pkt. X*
direkte i sit oprindelige dokument — ikke kun nævnt i det nye. Undgår at
en fremtidig session læser et forældet punkt som stadig gældende.

---

## 31. Prioritering (forslag, ikke besluttet)

Hvis alle 15 ikke skal i gang samtidig, foreslås denne rækkefølge efter
lavest indsats/højest værdi:
1. **Med det samme, ingen kode:** 30.1, 30.2, 30.6, 30.8, 30.9, 30.15 —
   rene dokument-vaner, kan starte i dag
2. **Kræver lidt struktur:** 30.5, 30.7, 30.11, 30.14
3. **Kræver faktisk kode/automation (efter spec er godkendt, jf. pkt. 0):**
   30.3, 30.4, 30.10, 30.12, 30.13

---
*Tilføjet til projektets vidensbase. Udvider addendum pkt. 23–29 —
erstatter ikke disse, men konkretiserer dem til 15 handlingspunkter.*

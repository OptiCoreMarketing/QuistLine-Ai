# QuistLine.ai — Byggevejledning

*Tilføjet: 12. august 2026*
*Status: **ARBEJDSDOKUMENT** — dette er den vejledning, enhver
byggesession (dig, Claude Code, Cowork eller en agent) skal følge.*
*Tags: `#byggemetode #proces #gates #definition-of-done`*

*Formål: gøre byggerækkefølgen fra pkt. 70 udførbar. Rækkefølgen siger
HVAD der bygges hvornår. Dette dokument siger HVORDAN hvert trin bygges,
verificeres og godkendes, før det næste påbegyndes.*

---

## 73. Forudsætning: specen skal ind i repoet

Chat-hukommelse kan ikke læses af et kodeværktøj. Før noget bygges,
kopieres hele vidensbasen ind i repoet:

```
/spec
  00-master-spec.md            ← handoff, pkt. 0–14
  15-repo-status-gap.md
  17-model-provider-claude.md
  20-chat-laesbarhed.md
  23-governance-dokumentation.md
  30-15-forbedringer.md
  32-agent-arkitektur.md
  37-team-model.md
  39-teknisk-arkitektur.md
  52-flaskehalse-foundry.md
  65-idebank-vedtaget.md
  73-byggevejledning.md        ← dette dokument
  INDEX.md                     ← jf. pkt. 30.2
```

**Regel:** specen er versionsstyret sammen med koden. Ændres en beslutning,
ændres filen i samme commit som koden, der følger af den.

---

## 74. Grundmetoden: én side ad gangen, syv gates

Ingen side påbegyndes, før den foregående har passeret alle syv gates.
Ingen to sider bygges parallelt.

| Gate | Navn | Passeret når |
|---|---|---|
| **A** | Struktur & branding | Mappekrav (pkt. 4) opfyldt, QuistLine.ai-badge til stede (pkt. 5), intet cto.new-restmateriale (pkt. 15) |
| **B** | Datamodel | Alle nødvendige tabeller/felter findes og er migreret. Ingen "det tilføjer vi senere"-felter fra grad 1 (pkt. 66) |
| **C** | Backend | Endpoints virker isoleret og er testet med rigtige kald — ikke mock |
| **D** | Frontend ↔ backend | Hver knap kalder et rigtigt endpoint. Nul attrap-interaktion (den fejl Gemini-skitsen begik) |
| **E** | Godkendelsesflow | Alle gates i denne side er tilstande i databasen, ikke instruktioner i en prompt (pkt. 41.3) |
| **F** | Dokumentation & rapport | Rapport-skabelonen (pkt. 27 + 37.4) udfyldt, CHANGELOG opdateret, beslutninger logget |
| **G** | Owner-godkendelse | Du har set den køre og sagt "godkendt, næste side" |

**Gate G er ikke en formalitet.** Du skal have *brugt* siden, ikke set et
skærmbillede af den.

---

## 75. Definition of Done — hvad "færdig" betyder pr. gate

### Gate A — Struktur & branding
- [ ] `/branding`, `/memory`, `/docs`, `/reports`, `/src`, `/tests` findes
- [ ] Ingen løse filer i roden ud over konfiguration
- [ ] Badge nederst venstre viser **kun** "QuistLine.ai" (pkt. 5)
- [ ] Søkort-paletten og de to læsemiljøer fulgt (pkt. 67.3–67.4)
- [ ] Rederi-sproget brugt i UI-tekst og i kode-navngivning (pkt. 67.1)
- [ ] Ingen låse-ikoner, FREE-badge, upgrade-boks eller sponsorater

### Gate B — Datamodel
- [ ] Migration kørt og versionsstyret (ikke håndlavede ændringer i prod)
- [ ] Grad 1-felter til stede: `prev_event_hash`, `event_hash`,
      `transferable`, `lineage_parent_id`, `agent_trust` (pkt. 69)
- [ ] Rollback-sti findes og er afprøvet
- [ ] Ingen data skrives uden om event-loggen

### Gate C — Backend
- [ ] Endpoint testet med rigtige kald mod rigtig database
- [ ] Fejltilfælde håndteret: provider nede, timeout, ugyldigt input
- [ ] Hvert modelkald går gennem model-routeren (pkt. 46) — ingen agent
      taler direkte med en provider-SDK
- [ ] Cost-event skrives ved hvert kald (ellers er Finance ubrugelig)

### Gate D — Frontend ↔ backend
- [ ] Hver interaktiv komponent kalder et rigtigt endpoint
- [ ] Loading-, tomme- og fejltilstande findes og er formuleret som
      retning, ikke som undskyldning
- [ ] Læsbarhedskravene (pkt. 21): min. 13px, linjeafstand 1.5–1.65,
      12–16px mellem blokke, 60–75 tegn pr. linje
- [ ] Kontrast består WCAG AA på al brødtekst (pkt. 57.7)
- [ ] Tastaturfokus synligt, `prefers-reduced-motion` respekteret
- [ ] Testet på mobil, hvis siden indeholder røde gates (pkt. 57.7)

### Gate E — Godkendelsesflow
- [ ] Hver gate er en tilstand i tilstandsmaskinen (pkt. 41.3)
- [ ] Risikoklasse sat korrekt: grøn/gul/rød (pkt. 56.1)
- [ ] **Rød klasse kan ikke auto-godkendes** — verificeret ved forsøg
- [ ] Ingen tokens brænder, mens en task venter i `AWAITING_*`
- [ ] Vagtpost-reglerne (pkt. 60.1) gælder på denne sides handlinger

### Gate F — Dokumentation & rapport
- [ ] Rapport med: status, metode, resultat, anbefaling, **antagelser &
      alternativer, tools brugt, tools overvejet men fravalgt, nye åbne
      spørgsmål, afhængigheder** (pkt. 27 + 37.4)
- [ ] `docs/CHANGELOG.md` opdateret
- [ ] `memory/decisions.md` opdateret med hvem foreslog/godkendte (pkt. 30.8)
      og reversibilitets-mærkning (pkt. 30.9)
- [ ] Commit-beskeder refererer spec-punkt (pkt. 30.4)
- [ ] `INDEX.md` opdateret med sidens nye status

### Gate G — Owner-godkendelse
- [ ] Du har kørt siden selv
- [ ] Du har set diffen for alle filændringer (pkt. 58.4)
- [ ] Separat spørgsmål besvaret: "Deploye til GitHub?" (pkt. 7)

---

## 76. Testniveauer — fem, ikke tre

Udvider pkt. 7's tre niveauer med kvalitets-gatene fra pkt. 53.
Retry-loft: **3 forsøg pr. niveau**, derefter rapporteres blokeret.

| # | Niveau | Hvad det beviser | Hvem kører det |
|---|---|---|---|
| 1 | Build | Kompilerer/starter uden fejl | Engineer |
| 2 | Funktionel + regression | Virker som specificeret, og intet eksisterende er brudt | Engineer |
| 3 | Selv-review af diff | Ingen uforklarlige fjernelser (pkt. 8) | Engineer |
| 4 | **Modstander-review** | Forsøger at få opgaven underkendt mod acceptkriterierne | Anden model/provider end den, der byggede (pkt. 53.2) |
| 5 | **Visuel verifikation** | Screenshot mod branding- og læsbarhedskrav | Vision-model (pkt. 53.3) |

Niveau 4 og 5 kører på billig model (Groq/Gemini) — de er ikke dyre, og
de fanger den klasse af fejl, hvor koden kører perfekt og produktet
alligevel er forkert.

---

## 77. Acceptkriterier — skrives før, låses ved godkendelse

Ingen task startes uden 3–7 konkrete, efterprøvbare kriterier (pkt. 53.1).

**Gode kriterier:** "Chief-chatten kan besvare en godkendelse uden at
scrolle", "streamen renderer 5.000 hændelser uden mærkbar forsinkelse",
"en rød gate kan besvares på en telefon".

**Ubrugelige kriterier:** "siden ser god ud", "koden er ren", "det virker".

Kriterierne **låses**, når du godkender opgaven. En agent, der ikke kan nå
målet, skal rapportere blokeret — ikke omformulere målet.

---

## 78. Sådan starter og slutter en byggesession

### Ved start — obligatorisk læserækkefølge (pkt. 4, udvidet)
1. `spec/INDEX.md` — hvad er status lige nu
2. `spec/00-master-spec.md` — grundreglerne
3. Det addendum, der dækker denne side
4. `memory/context.md` + `memory/decisions.md`
5. Seneste `CHANGELOG`-indgange
6. Seneste rapport fra forrige side
7. **Stamtavlen** — er noget lignende bygget før? (pkt. 66.2)

Først derefter må skrive-værktøjer bruges.

### Ved slut
1. Rapport skrevet (pkt. 75, gate F)
2. Nye åbne spørgsmål tilføjet til pkt. 14's liste
3. Modstridende tidligere punkter markeret *overskrevet af pkt. X* i deres
   oprindelige dokument (pkt. 30.15)
4. Addendum skrevet, hvis sessionen indeholdt en reel beslutning (pkt. 24)

---

## 79. Startprompt til en byggesession (kopiér og udfyld)

```
Du bygger på QuistLine.ai. Følg spec/73-byggevejledning.md.

FØR du skriver eller ændrer noget, læs i denne rækkefølge:
spec/INDEX.md → spec/00-master-spec.md → [relevant addendum] →
memory/context.md → memory/decisions.md → docs/CHANGELOG.md →
seneste fil i reports/

OPGAVE: [trin nr. + sidenavn fra byggerækkefølgen, pkt. 70]

ACCEPTKRITERIER (låst, må ikke omformuleres):
1. ...
2. ...
3. ...

REGLER:
- Ingen kode uden for det, opgaven dækker
- Målrettede ændringer, ikke fuld filomskrivning (pkt. 8)
- Hvert modelkald gennem model-routeren (pkt. 46)
- Kræver opgaven et tool, der ikke allerede er godkendt? Stop og spørg
  (pkt. 26)
- Commit-beskeder refererer spec-punkt (pkt. 30.4)

AFSLUT MED:
- Rapport efter skabelonen i pkt. 27 + 37.4
- Opdateret CHANGELOG, decisions.md og INDEX.md
- Kør testniveau 1–5 (pkt. 76) og vis resultatet
- Spørg mig separat: "Færdig — godkender du?" og derefter "Deploye?"

Byg ikke videre til næste side. Stop her.
```

---

## 80. Hårde regler under hele byggefasen

Disse gælder, uanset hvem eller hvad der bygger:

1. **Ingen hemmeligheder i kode.** API-nøgler kun i miljøvariabler. En
   nøgle på vej ind i en fil eller et commit er en blokerende fejl
2. **Agent-genereret kode kører aldrig lokalt hos dig** og aldrig i
   platformens egen proces (pkt. 47)
3. **Rød klasse auto-godkendes aldrig** — uanset tillidsniveau (pkt. 66.3)
4. **Ingen fuld filomskrivning**, hvor en målrettet ændring rækker
5. **Ingen sletning af historik.** Overskrevne beslutninger markeres, ikke
   fjernes (pkt. 30.15)
6. **Ingen ny side påbegyndt, før gate G er passeret** på den forrige
7. **Stop ved tvivl.** Et spørgsmål er billigere end en forkert antagelse,
   der bygges ovenpå i tre uger

---

## 81. Valg af værktøj

Vejledningen er skrevet, så den virker uanset værktøj — gates,
acceptkriterier og rapportkrav er de samme, om det er dig eller et
AI-værktøj, der bygger.

**Grundprincippet ved valg:** kravene i pkt. 75–80 skal kunne følges. Det
betyder i praksis, at værktøjet skal kunne (a) læse hele `/spec`-mappen som
kontekst, (b) stoppe og spørge frem for at fortsætte selv, og (c) arbejde
i repoet med commits, så traceability-kravet (pkt. 30.4) kan opfyldes.

**Anbefaling:** afprøv ét trin — fx trin 0, oprydningen i repoet — med det
værktøj, du overvejer, og se om vejledningen her reelt kan følges. Det er
en billigere måde at vælge på end at læse funktionslister. Tjek desuden
den aktuelle situation på support.claude.com og docs.claude.com, da
værktøjerne på dette område ændrer sig hurtigt.

---

## 82. Trin 0 — den første opgave, konkret

Rækkefølgens trin 0 (pkt. 70) er oprydningen. Den er lille nok til at være
en god første afprøvning af hele metoden:

**Opgave:** fjern alt cto.new-materiale fra `src/public/index.html`.

**Acceptkriterier:**
1. Ingen forekomst af "cto", "ctonew.app", "AI BUSINESS" eller Discord-knap
2. Ingen låse-ikoner, "FREE"-badge, upgrade-boks eller SPONSORED-blokke
3. Sidetitel og logo viser QuistLine.ai
4. Badge nederst venstre viser kun "QuistLine.ai" (pkt. 5), renderet fra
   `branding/badge.json`
5. Model-dropdown fjernet eller tom — ingen hardcodede modelnavne (pkt. 18.3)
6. Siden loader uden JS-fejl i konsollen

**Bemærk:** dette er oprydning, ikke ombygning. Layoutet (split-screen med
Chief-chat) bevares som udgangspunkt; den rigtige opbygning sker først i
trin 3, hvor designretningen fra pkt. 67 tages i brug.

---
*Dette dokument er byggefasens arbejdsregel. Ændres metoden, ændres dette
dokument — og ændringen logges som addendum, jf. pkt. 24.*

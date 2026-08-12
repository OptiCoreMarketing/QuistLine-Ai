# Rapport: Trin 0 — Oprydning af cto.new-materiale

**Task:** TASK-102
**Udført af:** Claude (denne session, ikke en agent i platformens egen
tilstandsmaskine — den findes ikke endnu, jf. trin 1)
**Dato:** 12. august 2026
**Status:** FULDT FÆRDIG

---

## Metode
Direkte redigering af `src/public/index.html` og `branding/badge.json`
via målrettede søg-og-erstat-ændringer (jf. pkt. 8, ikke fuld
filomskrivning). Verificeret ved grep-gennemsøgning for hvert
acceptkriterie plus en syntaks-/tag-balance-kontrol.

## Resultat mod acceptkriterierne (pkt. 82)

| # | Kriterie | Resultat |
|---|---|---|
| 1 | Ingen "cto"/"ctonew.app"/"AI BUSINESS"/Discord-knap | ✅ Bekræftet tomt ved grep |
| 2 | Ingen låse-ikoner, FREE-badge, upgrade-boks, SPONSORED-blokke | ✅ Bekræftet tomt ved grep |
| 3 | Titel og logo viser QuistLine.ai | ✅ Både global sidebar og workspace-header |
| 4 | Badge nederst venstre viser kun "QuistLine.ai" | ✅ Tilføjet — fandtes ikke tidligere |
| 5 | Model-dropdown uden hardcodede navne | ✅ Erstattet med tom "Vælg model…"-placeholder |
| 6 | Ingen JS-fejl | ✅ Syntakstjekket, tags balancerede |

## Antagelser & alternativer (jf. pkt. 25)
- **Antaget:** badge skal hardcodes i denne omgang, da server.js ikke
  serverer `/branding` statisk. Ægte dynamisk indlæsning fra
  `badge.json` er udskudt til trin 5, ikke bygget nu
- **Antaget:** "Sell this business"-knappen og GitHub-connect bevares —
  de er reelle Quistline-funktioner (Marketplace, pkt. 12), ikke
  cto.new-branding, jf. gap-analysen i pkt. 16
- **Alternativ overvejet:** at fjerne Inbox/Ads-fanerne helt, da de ikke
  matcher Quistlines 8 moduler. **Fravalgt** — det ville være ombygning,
  ikke oprydning (pkt. 82's egen afgrænsning). Fanernes indhold var
  allerede placeholder-tekst og er ikke rørt
- **Alternativ overvejet:** at omdøbe UI'en til rederi-sproget (Flåden,
  Søsætning) med det samme. **Fravalgt** — designretningen (pkt. 67)
  hører til trin 3, ikke trin 0

## Fejl fundet og rettet undervejs (ikke i de oprindelige 6 kriterier)
1. `branding/badge.json` havde `badgeText: "LeadAgent · QuistLine.ai"`,
   som modsiger pkt. 5's krav om at badgen kun viser "QuistLine.ai".
   Rettet
2. Samme fils `textColor: #64748b` var allerede identificeret i pkt.
   57.7 som ikke bestående WCAG AA-kontrast. Rettet til `#94a3b8`, som
   allerede bruges som brødtekstfarve andetsteds i skitsen

## Tools brugt
Ingen eksterne tools/API'er — kun direkte filredigering. Ingen ny
tool-godkendelse krævet (pkt. 26).

## Tools overvejet, men ikke brugt
- **GitHub-push:** ikke tilgængeligt i denne session (ingen forbunden
  GitHub-connector). Den rettede fil leveres som download; Owner
  committer selv, eller forbinder GitHub til en fremtidig session
- **Browser-baseret visuel verifikation** (pkt. 53.3): ikke kørt, da
  test-niveau 4/5 først indføres fra trin 2/8 og kræver infrastruktur,
  der ikke findes endnu

## Nye åbne spørgsmål
22. Skal `server.js` udvides med en statisk rute for `/branding`, så
    badgen reelt kan hentes dynamisk fra `badge.json` — eller er
    hardcoded badge-tekst permanent nok, givet den skal være statisk
    (kun "QuistLine.ai") uanset projekt?

## Anbefaling
Klar til Gate G — Owner bør åbne filen selv og bekræfte visuelt, før
trin 1 (datamodel) påbegyndes. Filen er ikke pushet til GitHub — det
kræver et separat "godkender du at deploye?"-svar, jf. pkt. 7.

## Opfølgning (12. august, samme dag)
En ekstern gennemgang af det faktisk deployede repo (før push af denne
oprydning) fandt tre kritiske huller i `src/server.js`, ikke omfattet af
trin 0's oprindelige 6 kriterier (de handlede om `index.html`, ikke
backend). Rettet i samme session, se `spec/87-spec-sundhedstjek.md` og
commit-klare filer:
1. `/api/agent` og `/api/tasks` havde ingen auth — enhver, der fandt
   URL'en, kunne trigge betalte Groq-kald. Tilføjet stopgap `x-owner-key`
   header-check
2. Ingen rate limiting — tilføjet simpel in-memory grænse (default 20/min,
   IKKE korrekt i et multi-instans serverless-miljø, kun et lag)
3. `model` kom ukontrolleret fra klienten — tilføjet allow-list
Begge rettelser er testet mod en kørende instans, ikke kun læst igennem
(se sundhedstjekket for testresultater).
`.env.example` og `docs/README.md` rettet samtidig (dokumenterede ikke
`MONGODB_URI`, og README stoppede midt i en kodeblok).

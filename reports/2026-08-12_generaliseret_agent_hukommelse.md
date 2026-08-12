# Task Rapport: Generaliseret agent-hukommelse (klar til flere end Chief)

**Task:** TASK-113
**Udført af:** Claude (denne session)
**Dato:** 12. august 2026
**Status:** FÆRDIG, verificeret mod rigtig Postgres.

---

## Status

Owner bad om, at "hver eneste fastboende AI (Warden, Chief mm.) skal have
sin egen hukommelse." Warden findes endnu ikke som en kørende agent i
koden overhovedet (placeret til trin 9, sammen med Foundry) — at bygge
"hukommelse" til en agent, intet kalder, ville være en tom skal. Owner
valgte derfor (blandt tre foreslåede løsninger) at **generalisere
mekanismen nu, uden at bygge Warden-logik**.

## Ændringer

**Ny fil `src/agentMemory.js`:**
- `getAgentConversationHistory(agentId, businessId)` — generaliseret
  udgave af den tidligere `getChiefConversationHistory`, nu med et
  eksplicit `agentId`-parameter, så enhver fremtidig **pr.-business**-
  agent kan bruge samme funktion
- Filens kommentarer forklarer eksplicit, hvorfor **globalt** scopede
  agenter (Warden, pkt. 54.4: "Warden forbliver global") **ikke** kan
  bruge denne funktion som den er: `event.business_id` er `NOT NULL`
  (migrations/001_init.sql), så der findes intet naturligt sted at gemme
  en samtale, der ikke hører til én bestemt business. Det kræver en anden
  løsning (formentlig en dedikeret tabel), når Warden rent faktisk bygges
  — bevidst ikke gættet på her

**`src/server.js`:** begge kaldsteder opdateret til
`getAgentConversationHistory("chief", business.id)` i stedet for den
Chief-specifikke funktion. Ingen adfærdsændring for Chief selv.

**`tests/agentMemory.test.js`** (ny, DB-gated): verificerer korrekt
rolle/indhold-formatering, isolation mellem to businesses, og at
ikke-`message`-hændelser ikke indgår i historikken. Tilføjet til
`npm test`.

## Antagelser, alternativer og risici (jf. pkt. 25)

**Antaget — kun mekanismen generaliseres, ingen ny agent bygges.** Direkte
valg fra Owner blandt tre tilbudte niveauer (kun generalisér / byg en
simpel Warden nu / lad stå som det er). Skriftligt begrundet af Owner
selv: en tom Warden-hukommelse uden nogen, der kalder den, er spildt
arbejde.

**Alternativ overvejet — udvide `event`-skemaet nu, så `business_id`
kunne være valgfri (til globale agenter).** Fravalgt bevidst: det ville
være at gætte på Wardens datamodel, før dens faktiske behov er kendt (pkt.
39's advarsel mod overengineering). Bedre at lade det være en åben,
dokumenteret beslutning, når trin 9 rent faktisk planlægges.

## Tests

**Automatiseret:** `npm test` udvidet med `tests/agentMemory.test.js` (3
nye tests, alle DB-gatede). 20 tests i alt, alle grønne mod rigtig Postgres.

**Manuel:** genkørte det tidligere kodeord-eksperiment efter
refaktoreringen — samme korrekte adfærd (Chief husker stadig inden for
projektet). Bekræfter refaktoreringen ikke ændrede funktionalitet.

## Nyt åbent spørgsmål

28. Når Warden (eller en anden global platform-agent) rent faktisk bygges
    (trin 9): skal dens samtale-/hukommelsesdata leve i en helt separat
    tabel (fx `platform_agent_message`, uden `business_id`), eller skal
    `event.business_id` gøres nullable specifikt for globale agent-typer?
    Ingen af delene er besluttet — bevidst efterladt åbent, til Warden
    faktisk skal bygges.

## Anbefaling

Ingen umiddelbar handling påkrævet. Spørgsmål 28 behøver først et svar,
når trin 9 (Warden/Foundry) faktisk påbegyndes.

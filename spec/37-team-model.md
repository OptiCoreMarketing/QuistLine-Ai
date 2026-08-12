# QuistLine.ai — Addendum: Fra enkelt-worker til helt projekt-team

*Tilføjet: 12. august 2026*
*Kontekst: Udvider addendum pkt. 34 (projekt-workers). Pkt. 34 beskrev
hiring af én worker ad gangen. For større projekter skal Chief kunne
sammensætte og hyre et helt team samtidig, hvor rollerne aktivt bygger på
hinandens arbejde — ikke bare arbejder i isolerede siloer efter hinanden.*

**Overskriver/udvider:** pkt. 34.3 (livscyklus) er skrevet med én worker i
tankerne — generaliseres her til at gælde et helt team. Pkt. 34.1, 34.2,
34.4 og 34.5 forbliver gældende uændret og gælder nu pr. worker i teamet.

---

## 37. Team-model for projekt-workers

### 37.1 Team-hiring i én samlet godkendelse
Chief foreslår en fuld team-sammensætning til Owner i ét spørgsmål — ikke
5 separate godkendelser:

> "Til dette projekt foreslår jeg et team: Researcher, Designer, Engineer,
> Copywriter, SEO-ekspert. Godkender du teamet?"

Behov for en rolle *midt i* projektet (fx en 6. rolle opstår senere) kræver
stadig en ny, separat godkendelse — teamet er ikke frit udvideligt uden om
Owner.

### 37.2 Fase-model — hvem starter hvornår

Ikke alle roller starter samtidig. Forslag til standardrækkefølge (Chief
kan justere pr. projekt, men skal altid gøre rækkefølgen explicit i
team-forslaget til Owner):

| Fase | Rolle(r) | Forudsætning |
|---|---|---|
| 1. Research (blokerende gate) | Researcher | Ingen — starter først |
| 2. Parallel | Designer, Engineer (skelet), SEO-ekspert | Researchers findings skrevet og klar |
| 3. Copywriter | Copywriter | Research **+** Designerens stil/pladsforbrug **+** SEO's søgeordsdata — Copywriter har flest afhængigheder, derfor sidst i parallel-fasen |
| 4. Integration | Engineer | Design, tekst og SEO-metadata samlet i det færdige produkt, 3 test-niveauer (pkt. 7) |

**Model-strategi pr. rolle (jf. pkt. 3.6, uændret princip):** Researcher
er oplagt Gemini-brug (store kontekst-opgaver), Engineer/Copywriter oplagt
Claude (kritisk kode/kundetekst), SEO/klassificering kan sagtens køre på
Groq.

### 37.3 Hvordan "samarbejde" reelt fungerer teknisk

Workers taler ikke direkte med Owner (pkt. 3.3, uændret) — og af samme
logik bør de heller ikke have en fri, uovervåget chat-kanal direkte til
hinanden. Samarbejde foregår gennem **delte, skrevne artefakter** i
projektets egen `/memory` og `/docs`, ikke mundtlig/synkron dialog mellem
agenter:

- Researcher skriver struktureret til `docs/research.md` — ikke rå tanker
- Designer, Engineer, SEO, Copywriter er forpligtet til at læse relevante
  dele af `research.md` **før** de starter — håndhæves af Bibliotekar-
  agenten, samme mekanisme som "læs før du bygger"-reglen (pkt. 4)
- Har en rolle brug for noget specifikt fra en anden midt i arbejdet (fx
  Copywriter spørger SEO om et bestemt søgeord), går forespørgslen via
  **Chief** — ikke direkte agent-til-agent. Chief er stadig
  koordinationslaget (pkt. 32), også internt i et team
- Alt sådant "spørg en anden rolle"-behov logges i rapporten (se 37.4)

### 37.4 Rapport-skabelon, udvidet igen (endnu et felt til pkt. 27)

Fordi flere roller nu arbejder på samme projekt samtidig, tilføjes:
- **Afhængigheder** — hvilke andre workers/roller leverede input til denne
  opgave, og hvilke filer/rapporter blev læst
- **Input indhentet fra** (jf. 37.3) — ad-hoc-forespørgsler til andre
  roller undervejs, og hvad svaret var

### 37.5 Individuel frigivelse, ikke hele teamet på én gang

Roller frigives, når deres del er færdig — ikke når hele projektet er
færdigt. Researcher kan fx frigives, når `research.md` er godkendt af
Chief, mens Designer/Engineer/Copywriter/SEO stadig arbejder. Reducerer
unødigt "hyret, men ikke længere i brug"-overhead.

---

## 38. Nyt åbent punkt (tilføjes til spec pkt. 14)

12. Skal fase-rækkefølgen (pkt. 37.2) håndhæves **teknisk** i task-loopet
    (fx kan en Copywriter-task ikke startes, før Researcher-task er
    DONE), eller er det kun en anbefalet arbejdsgang, Chief følger efter
    eget skøn fra projekt til projekt? Teknisk håndhævelse forhindrer
    genveje, men gør systemet mindre flexibelt ved simple/små projekter,
    hvor et fuldt team måske er overkill.

---
*Tilføjet til projektets vidensbase. Udvider addendum pkt. 34 — pkt.
34.3's livscyklus-beskrivelse gælder nu som særtilfælde (team af 1) af
denne mere generelle team-model, ikke som en modstridende regel.*

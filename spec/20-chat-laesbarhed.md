# QuistLine.ai — Addendum: Læsbarhedskrav til Chief/agent-chat

*Tilføjet: 12. august 2026*
*Kontekst: Chat-panelet (Chief Lead Chat, jf. Gemini-logbog pkt. 2B) skal
kunne bruges kontinuerligt i flere dage uden at føles trængt eller
utilfredsstillende at kigge på. Dette er et arbejdsredskab, ikke en demo —
læsbarhed er en funktionel krav, ikke kun æstetik.*

---

## 20. Problem med nuværende skitse

Chief-chat-panelet i Gemini-klonen (`#subtab-hq` højre panel) er en smal
380px-kolonne med lille tekst (`text-[11px]`) proppet direkte i en
scroll-boks uden luft mellem beskeder. Fungerer til en visuel skitse, men
ikke som noget man arbejder i dagligt.

## 21. Krav til Chief/agent-chattens visuelle udformning

### 21.1 Luft mellem elementer (det konkrete problem lige nu)
- Minimum **12–16px lodret afstand** mellem hver besked/tanke-blok — aldrig
  beskeder der rører hinanden
- **Indre padding** i hver besked-boks min. 12px, ikke tekst der sidder
  klods op af boks-kanten
- Linjeafstand (`line-height`) på løbende tekst: **1.5–1.65**, ikke default
  browser-værdi — tæt linjeafstand er den primære kilde til "mast sammen"-
  følelsen

### 21.2 Typografisk hierarki — adskil tanker fra svar fra handlinger
Chief/agenter har flere "stemmer" i samme feed (tænker, svarer, udfører
handling, rapporterer). Disse skal visuelt skelnes tydeligt, fx:
- **Tanke/ræsonnement** (evt. collapsible): dæmpet farve, evt. monospace
  eller let kursiv, mindre visuel vægt
- **Direkte svar til Owner**: fuld kontrast, primær tekststørrelse
- **Handling/tool-kald** (fx "Engineer bygger...", "Gemte rapport"): eget
  visuelt mønster (badge/ikon + label), ikke blandet ind i løbende prosa
- **Fejl/nødstop** (jf. spec pkt. 3.4): tydelig farvekode (rød/amber), aldrig
  til at overse ved en hurtig scroll

### 21.3 Skriftstørrelse og bredde
- Brødtekst i chat: **mindst 13px**, ikke `text-[11px]` som i skitsen —
  11px er ikke holdbart ved flere timers/dages brug
- Maks. linjebredde for løbende tekst: **60–75 tegn** — hvis chat-panelet
  gøres bredere end det, skal teksten begrænses internt med max-width,
  ikke løbe ud i fuld panelbredde
- Bruger skal kunne justere panelets bredde (træk-håndtag), da 320–380px er
  smalt til lange Chief-svar med kode eller lister

### 21.4 Kode og strukturerede blokke i chatten
Når Chief/Engineer refererer kode, filstier eller lister, skal disse have
egen visuel behandling (monospace-blok med baggrund, ikke inline i
brødteksten) — matcher i øvrigt cto.new's "LIVE ACTIVITY"-terminal-log-idé
(Gemini-logbog nævner denne), men gjort læsbar i stedet for kun
statuslinjer.

### 21.5 Test-kriterium (subjektivt, men skal kunne besvares "ja")
> Kan du sidde med dette chat-panel åbent i baggrunden i to arbejdsdage i
> træk, konstant refererende til det, uden at tænke "det her kunne se
> bedre ud"?

Dette er den reelle succes-metrik for denne del af UI'en — ikke om den ser
imponerende ud ved første øjekast, men om den er behagelig ved gentagen,
længerevarende brug. Praktisk betyder det: prioriter luft, linjeafstand og
tydelig adskillelse af besked-typer højere end visuelle effekter/animation.

## 22. Placering i byggerækkefølgen

Dette er en del af **fokusområde A (Branding/struktur)** og **D
(Frontend↔backend)** i den side-for-side byggemetode (jf. seneste
addendum-diskussion) — ikke en efterfølgende finish-pass. Chat-panelets
læsbarhed bør godkendes samtidig med at Tasks/Chief-loopet (side 4 i
rækkefølgen) bygges, da det er her Owner reelt vil sidde i lang tid.

---
*Tilføjet til projektets vidensbase. Erstatter ikke spec pkt. 5
(branding-badge) eller pkt. 9 (rapportering) — er et supplerende
læsbarhedskrav specifikt til det interaktive chat-UI.*

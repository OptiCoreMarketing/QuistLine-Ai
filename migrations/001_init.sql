-- Trin 1a: business, task, event (append-only, hash-kædet).
-- Scope jf. spec/87-spec-sundhedstjek.md pkt. 93 — 1b (lineage, artifacts,
-- agent_trust, provenance) tilføjes i en senere migration uden at ændre
-- disse tabeller.

CREATE TABLE business (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE task (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES business(id),
  title text NOT NULL,
  assigned_to text NOT NULL,
  status text NOT NULL DEFAULT 'RUNNING',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX task_business_id_idx ON task(business_id);

-- Append-only event-log, jf. spec/39-teknisk-arkitektur.md pkt. 40.
--
-- Hash-kæden er bevidst scoped PR. BUSINESS, ikke global på tværs af hele
-- platformen. Begrundelse (se reports/2026-08-12_trin1a_datamodel.md og
-- memory/decisions.md for den fulde antagelse/risiko-note, jf. governance
-- pkt. 23-29): proveniens skal kunne udskilles og hash-verificeres pr.
-- projekt ved salg (pkt. 66.1). En global kæde ville gøre det umuligt at
-- verificere ét projekts historik isoleret uden resten af platformens data.
CREATE TABLE event (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES business(id),
  task_id uuid REFERENCES task(id),
  agent_id text NOT NULL,
  parent_event_id uuid REFERENCES event(id),
  type text NOT NULL CHECK (type IN (
    'message', 'thought', 'tool_call', 'tool_result',
    'approval_request', 'approval_granted', 'report',
    'kill_switch', 'cost', 'file_change'
  )),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  model text,
  provider text,
  tokens_in integer,
  tokens_out integer,
  cost_usd numeric(12,6),
  transferable boolean NOT NULL DEFAULT true,
  -- NULL for den første event i en business (genesis) — se GENESIS_MARKER
  -- i src/eventLog.js, som stadig indregner et fast mærke i selve hashen,
  -- så en tom kæde ikke kan forveksles med en manglende værdi.
  prev_event_hash text,
  event_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX event_business_id_created_at_idx ON event(business_id, created_at, id);
CREATE INDEX event_task_id_idx ON event(task_id);

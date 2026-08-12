-- Trin 2, side 2.1: tilstandsmaskine for task (spec pkt. 41.3) + de
-- event-typer, Vagtposten lag 1 kræver (pkt. 40, 60.1, 63).

ALTER TABLE task ALTER COLUMN status DROP DEFAULT;
ALTER TABLE task ALTER COLUMN status SET DEFAULT 'DRAFT';

-- Ingen rigtige tasks findes endnu i produktion (jf. pkt. 83.4-argumentet:
-- billigt at rette nu, dyrt om et år) — derfor ingen datamigrering af
-- eksisterende rækker ud over selve constraint-tilføjelsen.
ALTER TABLE task ADD CONSTRAINT task_status_check CHECK (status IN (
  'DRAFT',
  'AWAITING_TOOL_APPROVAL',
  'AWAITING_HIRE_APPROVAL',
  'RUNNING',
  'BLOCKED_ON_DEPENDENCY',
  'AWAITING_OWNER_REVIEW',
  'APPROVED',
  'AWAITING_DEPLOY_APPROVAL',
  'DONE',
  'KILLED'
));

-- `state_transition`: hver ændring af task.status, jf. pkt. 40's princip
-- "alt hvad der sker skrives som hændelse" anvendt på tilstandsmaskinen.
-- `guard_violation`: Vagtpostens output (pkt. 60.1, 63).
ALTER TABLE event DROP CONSTRAINT event_type_check;
ALTER TABLE event ADD CONSTRAINT event_type_check CHECK (type IN (
  'message', 'thought', 'tool_call', 'tool_result',
  'approval_request', 'approval_granted', 'report',
  'kill_switch', 'cost', 'file_change',
  'state_transition', 'guard_violation'
));

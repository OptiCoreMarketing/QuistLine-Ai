-- Giver et allerede eksisterende, ubrugt felt (business.status) en
-- håndhævet, endelig værdimængde, i samme stil som task.status
-- (migrations/002). Kun to tilstande indtil videre: "active" (drift) og
-- "paused" (midlertidigt stoppet af Owner). Ophugget/kirkegård (C3,
-- pkt. 59.3/68) er en senere, større udvidelse — ikke gættet på her.
ALTER TABLE business ALTER COLUMN status SET DEFAULT 'active';
ALTER TABLE business ADD CONSTRAINT business_status_check CHECK (status IN (
  'active',
  'paused'
));

CREATE TABLE IF NOT EXISTS simulation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id text NOT NULL,
  scenario_version text NOT NULL DEFAULT '0.1.0',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','completed','abandoned')),
  accessibility jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS simulation_events (
  id bigserial PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES simulation_sessions(id) ON DELETE CASCADE,
  sequence_no integer NOT NULL,
  sim_seconds integer NOT NULL DEFAULT 0 CHECK (sim_seconds >= 0),
  event_type text NOT NULL,
  actor text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, sequence_no)
);

CREATE TABLE IF NOT EXISTS simulation_snapshots (
  id bigserial PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES simulation_sessions(id) ON DELETE CASCADE,
  sequence_no integer NOT NULL,
  world_state jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, sequence_no)
);

CREATE TABLE IF NOT EXISTS rights_audits (
  id bigserial PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES simulation_sessions(id) ON DELETE CASCADE,
  sequence_no integer NOT NULL,
  rights_status text NOT NULL CHECK (rights_status IN ('protected','at_risk','breached','unresolved')),
  decision text NOT NULL CHECK (decision IN ('STOP','CONTINUE')),
  hard_stop_codes text[] NOT NULL DEFAULT ARRAY[]::text[],
  audit jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, sequence_no)
);

CREATE INDEX IF NOT EXISTS simulation_events_session_created_idx ON simulation_events (session_id, created_at);
CREATE INDEX IF NOT EXISTS simulation_snapshots_session_created_idx ON simulation_snapshots (session_id, created_at);
CREATE INDEX IF NOT EXISTS rights_audits_session_created_idx ON rights_audits (session_id, created_at);

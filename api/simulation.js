import { neon } from "@neondatabase/serverless";

function json(res, status, body) {
  res.status(status).json(body);
}

function database() {
  if (process.env.ENABLE_SIM_PERSISTENCE !== "true") return null;
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  return neon(process.env.DATABASE_URL);
}

function safeText(value, max = 200) {
  if (typeof value !== "string") return null;
  return value.slice(0, max);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "method_not_allowed" });
  }

  const sql = database();
  if (!sql) return json(res, 503, { error: "persistence_disabled" });

  try {
    const body = req.body ?? {};
    const op = body.op;

    if (op === "start") {
      const scenarioId = safeText(body.scenarioId, 120);
      if (!scenarioId) return json(res, 400, { error: "scenario_id_required" });

      const accessibility = body.accessibility && typeof body.accessibility === "object"
        ? body.accessibility
        : {};

      const rows = await sql`
        INSERT INTO simulation_sessions (scenario_id, accessibility, metadata)
        VALUES (${scenarioId}, ${JSON.stringify(accessibility)}::jsonb, ${JSON.stringify({ source: "web-gui" })}::jsonb)
        RETURNING id, started_at
      `;

      return json(res, 201, { sessionId: rows[0].id, startedAt: rows[0].started_at });
    }

    if (op === "events") {
      const sessionId = safeText(body.sessionId, 80);
      const events = Array.isArray(body.events) ? body.events.slice(0, 100) : [];
      if (!sessionId || events.length === 0) return json(res, 400, { error: "session_and_events_required" });

      for (const event of events) {
        const sequenceNo = Number(event.sequenceNo);
        const simSeconds = Math.max(0, Number(event.simSeconds) || 0);
        const eventType = safeText(event.eventType, 120);
        const actor = safeText(event.actor, 120);
        if (!Number.isInteger(sequenceNo) || sequenceNo < 1 || !eventType) continue;

        await sql`
          INSERT INTO simulation_events (session_id, sequence_no, sim_seconds, event_type, actor, payload)
          VALUES (${sessionId}::uuid, ${sequenceNo}, ${simSeconds}, ${eventType}, ${actor}, ${JSON.stringify(event.payload ?? {})}::jsonb)
          ON CONFLICT (session_id, sequence_no) DO NOTHING
        `;
      }

      return json(res, 200, { ok: true });
    }

    if (op === "snapshot") {
      const sessionId = safeText(body.sessionId, 80);
      const sequenceNo = Number(body.sequenceNo);
      const worldState = body.worldState;
      if (!sessionId || !Number.isInteger(sequenceNo) || sequenceNo < 0 || !worldState || typeof worldState !== "object") {
        return json(res, 400, { error: "invalid_snapshot" });
      }

      await sql`
        INSERT INTO simulation_snapshots (session_id, sequence_no, world_state)
        VALUES (${sessionId}::uuid, ${sequenceNo}, ${JSON.stringify(worldState)}::jsonb)
        ON CONFLICT (session_id, sequence_no)
        DO UPDATE SET world_state = EXCLUDED.world_state, created_at = now()
      `;

      return json(res, 200, { ok: true });
    }

    if (op === "complete") {
      const sessionId = safeText(body.sessionId, 80);
      if (!sessionId) return json(res, 400, { error: "session_id_required" });

      await sql`
        UPDATE simulation_sessions
        SET status = 'completed', ended_at = now()
        WHERE id = ${sessionId}::uuid
      `;

      return json(res, 200, { ok: true });
    }

    return json(res, 400, { error: "unknown_operation" });
  } catch (error) {
    console.error("simulation persistence error", error);
    return json(res, 500, { error: "persistence_failed" });
  }
}

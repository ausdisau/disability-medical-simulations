import { getModelConfig } from "../src/virgal/ai/model-config.js";
import { requestAstraProposal } from "../src/virgal/ai/astra-client.js";

function json(res, status, body) {
  res.status(status).json(body);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "method_not_allowed" });
  }

  if (process.env.ENABLE_AI_SIMULATION !== "true") {
    return json(res, 503, { error: "ai_simulation_disabled" });
  }

  const instruction = typeof req.body?.instruction === "string"
    ? req.body.instruction.slice(0, 4000)
    : "";
  const storylineEnvelope = req.body?.storylineEnvelope;

  if (!instruction || !storylineEnvelope?.scenarioId || !("headEventHash" in storylineEnvelope)) {
    return json(res, 400, { error: "invalid_simulation_request" });
  }

  try {
    const config = getModelConfig();
    const rawProposal = await requestAstraProposal({
      envelope: storylineEnvelope,
      instruction,
      config
    });
    return json(res, 200, {
      status: "PROPOSED",
      rawProposal,
      model: config.model,
      basedOnHead: storylineEnvelope.headEventHash
    });
  } catch (error) {
    console.error("AI simulation proposal error", error);
    return json(res, 502, { error: "model_unavailable" });
  }
}

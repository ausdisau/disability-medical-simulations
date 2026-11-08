import { createStorylineEnvelope } from "./storyline-envelope.js";
import { validateModelProposal } from "./proposal-schema.js";

export async function generateModelProposal({ world, instruction, requestModel }) {
  const envelope = createStorylineEnvelope(world);
  try {
    const rawText = await requestModel(envelope, instruction);
    const raw = JSON.parse(rawText);
    const checked = validateModelProposal(raw, world.headEventHash);
    if (!checked.ok) {
      return {
        status: "HELD",
        error: checked.error,
        modelRuntime: { basedOnHead: envelope.headEventHash }
      };
    }
    return {
      status: "PROPOSED",
      proposal: checked.proposal,
      modelRuntime: { basedOnHead: envelope.headEventHash }
    };
  } catch (error) {
    return {
      status: "HELD",
      error: "model_unavailable",
      modelRuntime: {
        basedOnHead: envelope.headEventHash,
        detail: String(error?.message ?? error)
      }
    };
  }
}

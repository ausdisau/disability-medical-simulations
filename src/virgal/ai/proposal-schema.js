const PROTECTED_DOMAINS = new Set(["CLINICAL", "MEDICATION", "RIGHTS", "CAPACITY", "AUTHORITY"]);
const PROTECTED_KEYS = new Set([
  "physiology",
  "diagnosis",
  "medication",
  "dose",
  "ventilatorSetting",
  "deviceSettings",
  "consent",
  "refusal",
  "capacity",
  "substituteAuthority",
  "treatmentCeiling",
  "patientAuthoredSpeech"
]);

const TOP_LEVEL_KEYS = new Set([
  "proposalId",
  "expectedHeadEventHash",
  "kind",
  "actorRefs",
  "targetRefs",
  "locationRef",
  "candidateDialogue",
  "candidateEvents",
  "uncertainty",
  "sourceRefs"
]);

const DIALOGUE_KEYS = new Set(["speakerRef", "recipientRefs", "text", "factState"]);
const EVENT_KEYS = new Set([
  "candidateId",
  "category",
  "summary",
  "type",
  "domain",
  "actorRefs",
  "targetRefs",
  "locationRef",
  "factState",
  "payload"
]);
const SAFE_PAYLOAD_KEYS = new Set([
  "summary",
  "text",
  "message",
  "channelRef",
  "recipientRefs",
  "destinationRef",
  "relationshipSignal",
  "factState"
]);
const EVENT_CATEGORIES = new Set(["DIALOGUE", "MOVEMENT", "MESSAGE", "ROUTINE", "RELATIONSHIP", "ENVIRONMENT"]);
const SAFE_EVENT_DOMAINS = new Set(["SOCIAL", "WORLD", "INFORMATION", "RELATIONAL"]);

function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function hasOnlyKeys(value, allowed) {
  return value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).every((key) => allowed.has(key));
}

function containsProtectedKey(value) {
  if (!value || typeof value !== "object") return false;
  for (const [key, nested] of Object.entries(value)) {
    if (PROTECTED_KEYS.has(key)) return true;
    if (containsProtectedKey(nested)) return true;
  }
  return false;
}

function validDialogue(item) {
  return hasOnlyKeys(item, DIALOGUE_KEYS)
    && typeof item.text === "string"
    && (item.speakerRef == null || typeof item.speakerRef === "string")
    && (item.recipientRefs == null || isStringArray(item.recipientRefs))
    && (item.factState == null || item.factState === "GENERATED_CANDIDATE");
}

function validPayload(payload) {
  if (payload == null) return true;
  if (!hasOnlyKeys(payload, SAFE_PAYLOAD_KEYS)) return false;
  if (containsProtectedKey(payload)) return false;
  for (const [key, value] of Object.entries(payload)) {
    if (key === "recipientRefs" && !isStringArray(value)) return false;
    if (key !== "recipientRefs" && value != null && typeof value !== "string") return false;
  }
  return true;
}

function validCandidateEvent(event) {
  if (!hasOnlyKeys(event, EVENT_KEYS)) return false;
  if (event.domain != null && (!SAFE_EVENT_DOMAINS.has(event.domain) || PROTECTED_DOMAINS.has(event.domain))) return false;
  if (event.category != null && !EVENT_CATEGORIES.has(event.category)) return false;
  if (event.candidateId != null && typeof event.candidateId !== "string") return false;
  if (event.summary != null && typeof event.summary !== "string") return false;
  if (event.type != null && typeof event.type !== "string") return false;
  if (event.actorRefs != null && !isStringArray(event.actorRefs)) return false;
  if (event.targetRefs != null && !isStringArray(event.targetRefs)) return false;
  if (event.locationRef != null && typeof event.locationRef !== "string") return false;
  if (event.factState != null && event.factState !== "GENERATED_CANDIDATE") return false;
  return validPayload(event.payload);
}

export const MODEL_PROPOSAL_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "proposalId",
    "expectedHeadEventHash",
    "kind",
    "actorRefs",
    "targetRefs",
    "locationRef",
    "candidateDialogue",
    "candidateEvents",
    "uncertainty",
    "sourceRefs"
  ],
  properties: {
    proposalId: { type: "string" },
    expectedHeadEventHash: { type: ["string", "null"] },
    kind: { type: "string" },
    actorRefs: { type: "array", items: { type: "string" } },
    targetRefs: { type: "array", items: { type: "string" } },
    locationRef: { type: ["string", "null"] },
    candidateDialogue: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["speakerRef", "recipientRefs", "text", "factState"],
        properties: {
          speakerRef: { type: ["string", "null"] },
          recipientRefs: { type: "array", items: { type: "string" } },
          text: { type: "string" },
          factState: { type: "string", enum: ["GENERATED_CANDIDATE"] }
        }
      }
    },
    candidateEvents: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          candidateId: { type: "string" },
          category: { type: "string", enum: [...EVENT_CATEGORIES] },
          summary: { type: "string" },
          type: { type: "string" },
          domain: { type: "string", enum: [...SAFE_EVENT_DOMAINS] },
          actorRefs: { type: "array", items: { type: "string" } },
          targetRefs: { type: "array", items: { type: "string" } },
          locationRef: { type: ["string", "null"] },
          factState: { type: "string", enum: ["GENERATED_CANDIDATE"] },
          payload: {
            type: "object",
            additionalProperties: false,
            properties: {
              summary: { type: "string" },
              text: { type: "string" },
              message: { type: "string" },
              channelRef: { type: "string" },
              recipientRefs: { type: "array", items: { type: "string" } },
              destinationRef: { type: "string" },
              relationshipSignal: { type: "string" },
              factState: { type: "string", enum: ["GENERATED_CANDIDATE"] }
            }
          }
        }
      }
    },
    uncertainty: { type: ["string", "null"] },
    sourceRefs: { type: "array", items: { type: "string" } }
  }
};

export function validateModelProposal(raw, expectedHeadEventHash) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ok: false, error: "invalid_proposal" };
  if (!hasOnlyKeys(raw, TOP_LEVEL_KEYS)) return { ok: false, error: "invalid_proposal_shape" };
  if (!raw.proposalId || raw.expectedHeadEventHash !== expectedHeadEventHash) {
    return { ok: false, error: "stale_storyline_head" };
  }
  if (typeof raw.kind !== "string") return { ok: false, error: "invalid_proposal_shape" };
  if (raw.actorRefs != null && !isStringArray(raw.actorRefs)) return { ok: false, error: "invalid_proposal_shape" };
  if (raw.targetRefs != null && !isStringArray(raw.targetRefs)) return { ok: false, error: "invalid_proposal_shape" };
  if (raw.locationRef != null && typeof raw.locationRef !== "string") return { ok: false, error: "invalid_proposal_shape" };
  if (raw.uncertainty != null && typeof raw.uncertainty !== "string") return { ok: false, error: "invalid_proposal_shape" };
  if (raw.sourceRefs != null && !isStringArray(raw.sourceRefs)) return { ok: false, error: "invalid_proposal_shape" };

  const dialogue = Array.isArray(raw.candidateDialogue) ? raw.candidateDialogue : [];
  const events = Array.isArray(raw.candidateEvents) ? raw.candidateEvents : [];
  if (!dialogue.every(validDialogue) || !events.every(validCandidateEvent)) {
    return { ok: false, error: "invalid_proposal_shape" };
  }
  if (events.some((event) => PROTECTED_DOMAINS.has(event?.domain) || containsProtectedKey(event?.payload))) {
    return { ok: false, error: "protected_domain_mutation" };
  }

  return {
    ok: true,
    proposal: {
      proposalId: String(raw.proposalId),
      expectedHeadEventHash: raw.expectedHeadEventHash,
      kind: raw.kind,
      actorRefs: raw.actorRefs ? [...raw.actorRefs] : [],
      targetRefs: raw.targetRefs ? [...raw.targetRefs] : [],
      locationRef: raw.locationRef ?? null,
      candidateDialogue: structuredClone(dialogue),
      candidateEvents: structuredClone(events),
      uncertainty: raw.uncertainty ?? null,
      sourceRefs: raw.sourceRefs ? [...raw.sourceRefs] : []
    }
  };
}

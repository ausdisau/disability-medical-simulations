import { deriveRoleplayContext, summarizeRelationalState } from "./biosocial-relational-substrate.js";
import { buildAIRoleplayContinuePayload } from "./ai-roleplay-relational-adapter.js";

export const NPC_RESPONSE_INTENTS = Object.freeze([
  "BOUNDARY_RESISTANCE",
  "ANXIOUS_INFORMATION_SEEKING",
  "TENTATIVE_BOUNDARY_RESPECT",
  "REPAIR_ATTEMPT",
  "SUPPORTIVE_PRESENCE",
  "CLINICAL_CLARIFICATION"
]);

function clamp01(value) {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}

function assertActor(state, actorId, field) {
  const actor = state?.actors?.[actorId];
  if (!actor) throw new RangeError(`${field} must identify an actor in the relational substrate.`);
  return actor;
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function classifyStudentAction(studentAction = "") {
  const text = normalizeText(studentAction).toLowerCase();
  return {
    privacyBoundaryRequested: /(alone|private|privacy|step outside|leave the room|five minutes)/i.test(text),
    patientVoiceCentered: /(ask maya|maya asked|maya wants|her choice|your choice|what do you want)/i.test(text),
    clarificationOffered: /(explain|clarify|tell you|update you|what happens|answer.*question)/i.test(text),
    reassuranceOffered: /(we will monitor|she is monitored|stay close|we will get you|we will come|get you when)/i.test(text),
    supporterConcernAcknowledged: /(i understand|i hear|you are worried|you are scared|this is frightening|concern)/i.test(text),
    confrontationalLanguage: /(you have no right|you need to leave now|stop interfering|calm down)/i.test(text)
  };
}

function relationshipFor(context) {
  return context.relationship ?? {
    trust: 0.5,
    conflict: 0.2,
    autonomyAlignment: 0.7,
    communicationReliability: 0.8,
    boundaryRespect: 0.8,
    supportAvailability: 0.7
  };
}

function scoreIntents(context, signals) {
  const actor = context.actor;
  const rel = relationshipFor(context);
  const threat = clamp01(context.environment.clinicalThreat);
  const uncertainty = clamp01(context.environment.uncertainty);

  const scores = {
    BOUNDARY_RESISTANCE:
      0.15 +
      0.32 * actor.controlImpulse +
      0.24 * actor.stress +
      0.22 * rel.conflict +
      0.18 * threat +
      (signals.privacyBoundaryRequested ? 0.30 : 0) +
      (signals.confrontationalLanguage ? 0.20 : 0) -
      0.22 * rel.autonomyAlignment -
      0.12 * rel.boundaryRespect,

    ANXIOUS_INFORMATION_SEEKING:
      0.20 +
      0.34 * actor.informationNeed +
      0.22 * uncertainty +
      0.18 * actor.stress +
      0.10 * threat +
      (signals.clarificationOffered ? 0.08 : 0),

    TENTATIVE_BOUNDARY_RESPECT:
      0.18 +
      0.30 * rel.autonomyAlignment +
      0.24 * rel.boundaryRespect +
      0.18 * actor.roleClarity +
      (signals.patientVoiceCentered ? 0.22 : 0) +
      (signals.supporterConcernAcknowledged ? 0.10 : 0) -
      0.15 * actor.controlImpulse,

    REPAIR_ATTEMPT:
      0.12 +
      0.25 * rel.trust +
      0.20 * rel.conflict +
      0.20 * rel.autonomyAlignment +
      (signals.supporterConcernAcknowledged ? 0.18 : 0) +
      (signals.patientVoiceCentered ? 0.12 : 0),

    SUPPORTIVE_PRESENCE:
      0.15 +
      0.28 * rel.supportAvailability +
      0.18 * rel.trust +
      0.18 * rel.boundaryRespect -
      0.18 * rel.conflict -
      0.10 * actor.controlImpulse,

    CLINICAL_CLARIFICATION:
      0.14 +
      0.24 * actor.informationNeed +
      0.20 * uncertainty +
      0.16 * rel.communicationReliability +
      (signals.clarificationOffered ? 0.22 : 0)
  };

  return Object.entries(scores)
    .map(([intent, score]) => ({ intent, score: clamp01(score) }))
    .sort((a, b) => b.score - a.score || a.intent.localeCompare(b.intent));
}

function channelForActor(actor) {
  return actor.kind === "patient" ? "aac" : "spoken";
}

function templateSet(intent, actor, target, variantIndex) {
  const targetName = target.label ?? "the patient";
  const family = actor.kind === "family" || /mother|father|parent|family/i.test(actor.role ?? "");

  const templates = {
    BOUNDARY_RESISTANCE: family
      ? [
          `I heard what ${targetName} asked. I am still struggling with being sent out when things are this serious. Can someone tell me what happens while I am outside?`,
          `I know ${targetName} asked for privacy, but after tonight I am finding it very hard to step away without understanding what is happening.`,
          `I am not trying to speak over ${targetName}. I am frightened, and leaving the room right now feels impossible to me.`
        ]
      : [
          `I am not comfortable moving ahead until I understand the boundary you are asking for.`,
          `I need a clearer explanation before I can respond to that request.`
        ],

    ANXIOUS_INFORMATION_SEEKING: [
      `Before we go any further, can you tell me what you know right now and what is still uncertain?`,
      `What exactly are you worried about at this point, and what are you watching for next?`,
      `I need a straight answer about what is happening. What has changed since the last update?`
    ],

    TENTATIVE_BOUNDARY_RESPECT: family
      ? [
          `Okay. I do not like leaving, but ${targetName} asked. I will wait outside. Please tell me when ${targetName} wants me back.`,
          `All right. This is hard for me, but I heard the request. I will give you the room for a few minutes.`,
          `I can step out. I want ${targetName} to know I am nearby and I will come back when invited.`
        ]
      : [
          `Understood. I will respect that request and remain available if needed.`,
          `All right. I will give you privacy and wait nearby.`
        ],

    REPAIR_ATTEMPT: [
      `I think I came on too strongly. I am scared, but I do not want that fear to take over the conversation.`,
      `I want to try that again. I can ask what you need instead of assuming I know.`,
      `I am worried, but I can listen first. Tell me what would actually be helpful right now.`
    ],

    SUPPORTIVE_PRESENCE: [
      `I am here. You do not have to answer me quickly, and I will follow your lead.`,
      `I can stay close without taking over. Tell me what you want from me.`,
      `I will be nearby. You decide when you want me involved.`
    ],

    CLINICAL_CLARIFICATION: [
      `Can you explain that in plain language and separate what you know from what is still uncertain?`,
      `What does that mean for right now, and what would make you more or less concerned?`,
      `Can you give me the headline first, then the details?`
    ]
  };

  const options = templates[intent] ?? templates.ANXIOUS_INFORMATION_SEEKING;
  return options[variantIndex % options.length];
}

function studentOptions(signals, target) {
  const targetName = target.label ?? "the patient";
  const options = [];

  if (signals.privacyBoundaryRequested) {
    options.push(`Acknowledge the concern and restate that ${targetName}'s privacy request is being respected.`);
    options.push(`Ask ${targetName} directly whether they want the supporter to return after the private discussion.`);
    options.push(`Explain what staff will continue monitoring while the supporter waits outside.`);
  } else {
    options.push(`Ask ${targetName} directly what they want before responding to the supporter.`);
    options.push("Give a concise update separating known facts from uncertainty.");
    options.push("Acknowledge the supporter's fear without transferring decision authority away from the patient.");
  }

  return options.slice(0, 3);
}

/**
 * Build a dynamic NPC turn from the current deterministic relational state.
 * The output is descriptive. It cannot mutate the substrate and cannot create a
 * capacity finding, legal authority, treatment limit, or clinical decision.
 */
export function buildDynamicNPCResponse(state, {
  npcActorId,
  targetActorId = state.patientId,
  studentAction = "",
  turnIndex = 0,
  envelope = null
} = {}) {
  const npc = assertActor(state, npcActorId, "npcActorId");
  const target = assertActor(state, targetActorId, "targetActorId");
  const context = deriveRoleplayContext(state, npcActorId, targetActorId);
  const signals = classifyStudentAction(studentAction);
  const ranked = scoreIntents(context, signals);
  const selected = ranked[0];
  const seed = hashString(`${npcActorId}|${targetActorId}|${turnIndex}|${normalizeText(studentAction)}|${selected.intent}`);
  const message = templateSet(selected.intent, npc, target, seed % 3);
  const delivery = channelForActor(npc);

  const roleplayPayload = buildAIRoleplayContinuePayload({
    otherPersonMessage: delivery === "aac" ? `AAC: ${message}` : message,
    possibleUserResponses: studentOptions(signals, target)
  });

  return {
    npc: {
      id: npc.id,
      label: npc.label,
      role: npc.role,
      delivery
    },
    selectedIntent: selected.intent,
    rankedIntents: ranked,
    message,
    roleplayPayload,
    renderingContext: {
      studentAction: normalizeText(studentAction),
      signals,
      relationalContext: context,
      syntheticFamilyEnvelope: envelope ? { ...envelope } : null
    },
    moderatorEventHints: [
      "NPC text is descriptive only.",
      "If the student materially changes the interaction, the moderator may separately validate and commit a typed relational event.",
      "Possible event families include PRIVATE_CONVERSATION_REQUEST, BOUNDARY_RESPECTED, BOUNDARY_OVERRIDE_ATTEMPT, INFORMATION_CLARIFIED, PATIENT_VOICE_ACKNOWLEDGED and REPAIR_CONVERSATION."
    ],
    rightsConstraints: {
      capacityInferenceAllowed: false,
      familyPresenceCreatesAuthority: false,
      dialogueMutatesState: false,
      clinicalTreatmentChoiceFromRelationalState: false
    },
    stateFingerprint: JSON.stringify(summarizeRelationalState(state))
  };
}

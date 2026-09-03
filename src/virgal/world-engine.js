function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
}

function rightRotate(value, amount) {
  return (value >>> amount) | (value << (32 - amount));
}

function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const bitLength = bytes.length * 8;
  const withOne = bytes.length + 1;
  const paddedLength = Math.ceil((withOne + 8) / 64) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(bytes);
  padded[bytes.length] = 0x80;

  const view = new DataView(padded.buffer);
  const high = Math.floor(bitLength / 0x100000000);
  const low = bitLength >>> 0;
  view.setUint32(paddedLength - 8, high, false);
  view.setUint32(paddedLength - 4, low, false);

  const h = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];
  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];
  const w = new Uint32Array(64);

  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let i = 0; i < 16; i += 1) w[i] = view.getUint32(offset + i * 4, false);
    for (let i = 16; i < 64; i += 1) {
      const s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let [a, b, c, d, e, f, g, hh] = h;
    for (let i = 0; i < 64; i += 1) {
      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (hh + s1 + ch + k[i] + w[i]) >>> 0;
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) >>> 0;
      hh = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h[0] = (h[0] + a) >>> 0;
    h[1] = (h[1] + b) >>> 0;
    h[2] = (h[2] + c) >>> 0;
    h[3] = (h[3] + d) >>> 0;
    h[4] = (h[4] + e) >>> 0;
    h[5] = (h[5] + f) >>> 0;
    h[6] = (h[6] + g) >>> 0;
    h[7] = (h[7] + hh) >>> 0;
  }

  return h.map((value) => value.toString(16).padStart(8, "0")).join("");
}

function deepClone(value) {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

const PRIORITY = {
  IMMEDIATE_SAFETY: 0,
  CLINICAL_CRITICAL: 1,
  RIGHTS_CRITICAL: 2,
  ACCESS_CRITICAL: 3,
  WORLD_INTERRUPT: 4,
  ORDINARY: 5,
  BACKGROUND: 6
};

export function createWorldEngine({ scenarioId, seed = "default", branchId = "canonical", scenarioVersion = "1.0.0" }) {
  return {
    scenarioId,
    scenarioVersion,
    seed,
    branchId,
    parentBranchId: null,
    worldTime: 0,
    revision: 0,
    idempotencyKeys: {},
    focusRef: null,
    events: [],
    headEventHash: null,
    causalGraph: { parents: {} },
    scheduler: [],
    fidelity: {},
    authority: { emergencyLease: null },
    version: "0.3.0"
  };
}

export function commitEvent(world, proposal) {
  const previousEventHash = world.headEventHash ?? "0".repeat(64);
  const eventId = `${world.events.length + 1}-${proposal.type}`;
  const event = {
    eventId,
    commitIndex: world.events.length + 1,
    worldTime: world.worldTime,
    type: proposal.type,
    domain: proposal.domain ?? "WORLD",
    actorRefs: proposal.actorRefs ?? [],
    targetRefs: proposal.targetRefs ?? [],
    locationRef: proposal.locationRef ?? null,
    payload: proposal.payload ?? {},
    causalParents: proposal.causalParents ?? [],
    authorityRef: proposal.authorityRef ?? null,
    guardianRefs: proposal.guardianRefs ?? [],
    previousEventHash,
    branchId: world.branchId
  };
  const eventHash = sha256Hex(stableStringify(event));
  const causalParents = [...event.causalParents];

  return {
    ...world,
    events: [...world.events, { ...event, eventHash }],
    headEventHash: eventHash,
    causalGraph: {
      ...world.causalGraph,
      parents: { ...world.causalGraph.parents, [eventId]: causalParents }
    }
  };
}

export function setFocus(world, focusRef) {
  return { ...world, focusRef };
}

export function scheduleEvent(world, task) {
  if (!task?.taskId || !Number.isFinite(task?.dueTime) || !task?.event?.type) return world;
  return { ...world, scheduler: [...world.scheduler, deepClone(task)] };
}

export function tickWorld(world, { seconds = 1 } = {}) {
  const nextTime = world.worldTime + Math.max(0, seconds);
  const due = world.scheduler
    .filter((task) => task.dueTime <= nextTime)
    .sort((a, b) => {
      const pa = PRIORITY[a.priority] ?? PRIORITY.ORDINARY;
      const pb = PRIORITY[b.priority] ?? PRIORITY.ORDINARY;
      return pa - pb || String(a.taskId).localeCompare(String(b.taskId));
    });

  let next = { ...world, worldTime: nextTime, scheduler: world.scheduler.filter((task) => task.dueTime > nextTime) };
  for (const task of due) next = commitEvent(next, task.event);
  return next;
}

function seedToUint32(seed) {
  return Number.parseInt(sha256Hex(seed).slice(0, 8), 16) >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function chooseNpcAction({ seed, characterId, decisionSequence, candidates, temperature = 1 }) {
  const eligible = (candidates ?? []).filter((candidate) => candidate.eligible !== false);
  if (eligible.length === 0) {
    return { selectedActionId: null, eligibleActionIds: [], seedHash: sha256Hex(`${seed}|${characterId}|${decisionSequence}`) };
  }
  const seedHash = sha256Hex(`${seed}|${characterId}|${decisionSequence}`);
  const random = mulberry32(seedToUint32(seedHash));
  let best = null;
  for (const candidate of eligible) {
    const u = Math.min(1 - Number.EPSILON, Math.max(Number.EPSILON, random()));
    const gumbel = -Math.log(-Math.log(u));
    const score = (Number(candidate.utility) || 0) / Math.max(0.01, temperature) + gumbel;
    if (!best || score > best.score) best = { id: candidate.id, score };
  }
  return {
    selectedActionId: best.id,
    eligibleActionIds: eligible.map((candidate) => candidate.id),
    seedHash
  };
}

export function createEmergencyAuthorityLease({ leaseId, holderRoleRefs = [], emergencyActive }) {
  return {
    leaseId,
    state: emergencyActive ? "ACTIVE" : "REQUESTED",
    holderRoleRefs: [...holderRoleRefs],
    permittedDomains: emergencyActive ? ["EMERGENCY_CLINICAL"] : [],
    explicitlyExcluded: ["PRIVACY", "SOCIAL", "RESEARCH", "PERSONHOOD", "LONG_TERM_GOALS"],
    returnAuthorityToPatient: false
  };
}

export function reassessEmergencyAuthorityLease(lease, { emergencyActive, supportedParticipationFeasible }) {
  if (!emergencyActive && supportedParticipationFeasible) {
    return { ...lease, state: "EXPIRED", permittedDomains: [], returnAuthorityToPatient: true };
  }
  return { ...lease, state: emergencyActive ? "ACTIVE" : "REASSESSING", returnAuthorityToPatient: false };
}

export function evaluateDidacticSignal({
  alignment = 0,
  significance = 0,
  recoverability = 0,
  novelty = 0,
  learnerUncertainty = 0,
  repetitionPenalty = 0,
  intrusionCost = 0
}) {
  const score = Math.max(0, Math.min(1,
    0.30 * alignment +
    0.25 * significance +
    0.20 * recoverability +
    0.15 * novelty +
    0.10 * learnerUncertainty -
    repetitionPenalty -
    intrusionCost
  ));
  const level = score >= 0.70 ? 2 : score >= 0.45 ? 1 : 0;
  return { score, level };
}

export function createBranch(world, { branchId }) {
  return {
    ...deepClone(world),
    branchId,
    parentBranchId: null,
    headEventHash: world.events.at(-1)?.eventHash ?? null
  };
}

export function forkBranch(branch, { branchId, seed }) {
  if (!branchId || branchId === branch.branchId) {
    throw new Error("Variant branch requires a new branch id.");
  }
  if (!seed || seed === branch.seed) {
    throw new Error("Variant branch requires a new seed.");
  }
  return {
    ...deepClone(branch),
    branchId,
    parentBranchId: branch.branchId,
    seed,
    headEventHash: branch.events.at(-1)?.eventHash ?? null
  };
}

export function replayBranch(branch) {
  let previous = "0".repeat(64);
  for (const event of branch.events) {
    if (event.previousEventHash !== previous) {
      return { valid: false, divergenceAt: event.eventId, headEventHash: previous };
    }
    const { eventHash, ...eventWithoutHash } = event;
    const recomputedHash = sha256Hex(stableStringify(eventWithoutHash));
    if (recomputedHash !== eventHash) {
      return { valid: false, divergenceAt: event.eventId, headEventHash: previous };
    }
    previous = eventHash;
  }
  return { valid: true, headEventHash: previous === "0".repeat(64) ? null : previous };
}

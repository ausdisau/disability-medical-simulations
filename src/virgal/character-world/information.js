import { getCharacterClaim } from "./state.js";

export function createInformationPacket({ packetId, senderId, recipientIds = [], claimIds = [], disclosureAuthority = [] }) {
  return { packetId, senderId, recipientIds: [...recipientIds], claimIds: [...claimIds], disclosureAuthority: [...disclosureAuthority] };
}

export function evaluateInformationDelivery(characterWorld, packet) {
  const claims = [];
  for (const claimId of packet.claimIds ?? []) {
    const claim = getCharacterClaim(characterWorld, packet.senderId, claimId);
    if (!claim) return { allowed: false, reason: `Sender does not possess claim ${claimId}.`, proposal: null };
    if (claim.privacyScope === "PATIENT_CONTROLLED" && !(packet.disclosureAuthority ?? []).includes(claimId)) {
      return { allowed: false, reason: `Disclosure authority required for ${claimId}.`, proposal: null };
    }
    claims.push(claim);
  }

  return {
    allowed: true,
    reason: "Delivery permitted by current possession and disclosure scope.",
    proposal: {
      type: "INFORMATION_DELIVERED",
      domain: "INFORMATION",
      actorRefs: [packet.senderId],
      targetRefs: [...(packet.recipientIds ?? [])],
      payload: { packetId: packet.packetId, recipients: [...(packet.recipientIds ?? [])], claims: structuredClone(claims) }
    }
  };
}

import { createCharacterWorld } from "./state.js";

export function createEliCharacterWorldFixture() {
  const state = createCharacterWorld({
    patientPrincipalId: "eli",
    characters: [
      { id: "eli", agentClass: "PATIENT_PRINCIPAL", accessTags: ["WHEELCHAIR", "AAC"] },
      { id: "rachel", agentClass: "NPC" },
      { id: "daniel", agentClass: "NPC" },
      { id: "noah", agentClass: "NPC" },
      { id: "sophie", agentClass: "NPC" },
      { id: "leo", agentClass: "NPC" },
      { id: "zara", agentClass: "NPC" },
      { id: "ms-hartley", agentClass: "NPC" }
    ],
    locations: [
      { id: "picu", accessibilityTags: ["WHEELCHAIR", "AAC"] },
      { id: "hospital-school", accessibilityTags: ["WHEELCHAIR", "AAC"] },
      { id: "morgan-home", accessibilityTags: ["WHEELCHAIR"] },
      { id: "mainstream-school", accessibilityTags: ["WHEELCHAIR"] }
    ],
    objects: [
      { id: "eli-aac", nodeId: "hospital-school", state: "READY", affordances: [{ id: "compose", requiresCoLocation: true, requiredAccessTags: ["AAC"] }] },
      { id: "telepresence-robot", nodeId: "mainstream-school", state: "READY", affordances: [{ id: "connect", requiresCoLocation: false, requiredAccessTags: [] }], clinicalIndication: "NOT_APPLICABLE" }
    ]
  });

  state.positions.eli = "hospital-school";
  state.positions.leo = "mainstream-school";
  state.positions.zara = "mainstream-school";
  state.positions["ms-hartley"] = "mainstream-school";
  state.positions.rachel = "picu";
  state.positions.daniel = "picu";
  state.positions.noah = "morgan-home";
  state.positions.sophie = "morgan-home";

  state.claims.eli["no-sophie-details"] = {
    id: "no-sophie-details",
    proposition: "NO SOPHIE DETAILS",
    status: "KNOWN",
    privacyScope: "PATIENT_CONTROLLED",
    protected: true
  };
  state.claims.eli["acute-icu-status"] = {
    id: "acute-icu-status",
    proposition: "acute ICU status is private clinical information",
    status: "KNOWN",
    privacyScope: "PATIENT_CONTROLLED"
  };
  state.claims.rachel["acute-icu-status"] = structuredClone(state.claims.eli["acute-icu-status"]);
  state.claims.daniel["acute-icu-status"] = structuredClone(state.claims.eli["acute-icu-status"]);

  state.relationships["eli->rachel"] = { fromId: "eli", toId: "rachel", trust: "STRONG", boundaryReliability: "MIXED" };
  state.relationships["rachel->eli"] = { fromId: "rachel", toId: "eli", trust: "STRONG", strain: "PRESENT" };
  state.relationships["eli->leo"] = { fromId: "eli", toId: "leo", trust: "STRONG", reciprocity: "BALANCED" };

  return state;
}

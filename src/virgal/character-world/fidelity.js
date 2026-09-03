export function deriveFidelityMap(characterWorld, { focusRef = null, consequentialRefs = [], scheduledRefs = [] } = {}) {
  const consequential = new Set(consequentialRefs);
  const scheduled = new Set(scheduledRefs);
  const result = {};
  for (const nodeId of Object.keys(characterWorld?.nodes ?? {})) {
    if (nodeId === focusRef) result[nodeId] = "F0_FOREGROUND";
    else if (consequential.has(nodeId)) result[nodeId] = "F1_ACTIVE_BACKGROUND";
    else if (scheduled.has(nodeId)) result[nodeId] = "F2_COARSE_BACKGROUND";
    else result[nodeId] = "F3_DORMANT";
  }
  return result;
}

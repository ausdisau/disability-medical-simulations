// Client-side config helpers. Do NOT commit secrets into the repository.
// Vite exposes client env vars via import.meta.env and requires the VITE_ prefix.
export function getThirdPartyApiKey() {
  return import.meta.env.VITE_THIRD_PARTY_API_KEY || "";
}

export function isThirdPartyApiKeyConfigured() {
  return Boolean(getThirdPartyApiKey());
}

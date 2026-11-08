export function getModelConfig(env = process.env) {
  if (!env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");
  return {
    model: env.PROJECT_HOPE_MODEL || "gpt-6-astra",
    reasoningEffort: env.PROJECT_HOPE_REASONING || "high",
    endpoint: "https://api.openai.com/v1/responses",
    apiKey: env.OPENAI_API_KEY
  };
}

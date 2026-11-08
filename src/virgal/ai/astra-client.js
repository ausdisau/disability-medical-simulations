export async function requestAstraProposal({ envelope, instruction, config, fetchImpl = fetch }) {
  const response = await fetchImpl(config.endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${config.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: config.model,
      reasoning: { effort: config.reasoningEffort },
      input: [
        {
          role: "developer",
          content: [{
            type: "input_text",
            text: "You are a proposal generator for VIRGAL. Never create canonical truth. Return one JSON proposal only."
          }]
        },
        {
          role: "user",
          content: [{
            type: "input_text",
            text: JSON.stringify({ instruction, storyline: envelope })
          }]
        }
      ]
    })
  });

  if (!response.ok) throw new Error(`openai_responses_${response.status}`);
  const body = await response.json();
  if (typeof body.output_text !== "string") throw new Error("openai_missing_output_text");
  return body.output_text;
}

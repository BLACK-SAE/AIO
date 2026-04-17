const URL = "https://openrouter.ai/api/v1/chat/completions";

export async function llmJson(system: string, user: string): Promise<any> {
  const res = await fetch(URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "AIO Docs"
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4.5",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2
    })
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text: string = data.choices?.[0]?.message?.content ?? "";
  const cleaned = text.replace(/^```json\s*|\s*```$/g, "").trim();
  return JSON.parse(cleaned);
}

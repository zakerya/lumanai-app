import { askGemini } from "../services/geminiClient.js";

const VALID_INTENTS = [
  "definition",
  "price",
  "market",
  "marketcap",
  "volume",
  "supply",
  "ath",
  "atl",
  "stats",
  "compare",
  "news",
  "trend",
  "prediction",
  "general",
];

export async function classifyIntentWithGemini(text) {
  const prompt = `
Classify the user's intent into ONE of the following categories:

${VALID_INTENTS.join(", ")}

User message: "${text}"

Respond with ONLY the intent word. No explanation.
  `;

  try {
    const result = await askGemini(prompt);
    const cleaned = result.trim().toLowerCase();

    if (VALID_INTENTS.includes(cleaned)) {
      return cleaned;
    }

    return "general";
  } catch (err) {
    console.error("Gemini intent classification failed:", err);
    return "general";
  }
}

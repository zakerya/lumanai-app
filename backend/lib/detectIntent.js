// backend/lib/detectIntent.js
import { classifyIntentWithGemini } from "./intentClassifier.js";

export async function detectIntent(text) {
  const t = text.toLowerCase().trim();

  if (t.includes("price")) return "price";
  if (t.includes("global market") || t.includes("crypto market")) return "market";
  if (t.includes("market cap") || t.includes("mcap")) return "marketcap";
  if (t.includes("volume")) return "volume";
  if (t.includes("supply")) return "supply";
  if (t.includes("ath")) return "ath";
  if (t.includes("atl")) return "atl";
  if (t.includes("stats") || t.includes("statistics")) return "stats";

  // smart definition detection
  if (t.includes("what") || t.includes("why") || t.includes("explain")) {
    return "definition";
  }

  if (t.includes(" vs ") || t.includes("compare")) return "compare";
  if (t.includes("news")) return "news";
  if (t.includes("pumping") || t.includes("dumping")) return "trend";
  if (t.includes("prediction") || t.includes("forecast")) return "prediction";

  return await classifyIntentWithGemini(text);
}

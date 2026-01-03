// app/lib/extractCoinName.ts
import axios from "axios";

const API_BASE = "http://localhost:5000";

export async function extractCoinName(input: string): Promise<{
  id: string;
  symbol: string;
  name: string;
} | null> {
  try {
    const lower = input.toLowerCase().trim();

    const cleaned = lower
      .replace(
        /\b(price|of|the|what|is|about|tell|me|current|value|worth|how|much|trading|at|marketcap|market cap|mcap|cap|stats|supply|volume|ath|atl)\b/g,
        ""
      )
      .replace(/\s+/g, " ")
      .trim();

    console.log("extractCoinName | cleaned:", cleaned);

    if (!cleaned) return null;

    const res = await axios.get(
      `${API_BASE}/api/coins/search?q=${encodeURIComponent(cleaned)}`
    );

    const coins = res.data?.coins || [];
    console.log("extractCoinName | coins:", coins);

    if (!Array.isArray(coins) || coins.length === 0) return null;

    // ⭐ Return full coin object, not just ID
    return {
      id: coins[0].id,
      symbol: coins[0].symbol,
      name: coins[0].name,
    };
  } catch (err) {
    console.error("extractCoinName | error:", err);
    return null;
  }
}

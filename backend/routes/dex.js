// backend/routes/dex.js
import express from "express";

import {
  searchDexPairs,
  getTokenProfiles,
  getCommunityTakeovers,
  getTokenBoosts,
  getTopBoosts,
  getTokenPairs,  // NEW: Added for address search
} from "../services/dexscreenerClient.js";

import {
  detectDexIntent,
  parseDexQuery,
  formatDexPairsList,
  formatTokenProfiles,
  formatBoosts,
  formatTopBoosts,
  formatTakeovers,
} from "../lib/dexIntent.js";

const router = express.Router();

/**
 * Helper to send a clean response with timestamp.
 */
function send(res, answer) {
  return res.json({
    answer,
    timestamp: new Date().toISOString(),
  });
}

/**
 * POST /dex
 * Main Dexscreener handler
 */
router.post("/", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return send(res, "Invalid message.");
    }

    const intent = detectDexIntent(message);
    const parsed = parseDexQuery(message);

    console.log("DEX_ROUTE | INTENT:", intent);
    console.log("DEX_ROUTE | PARSED:", parsed);

    // ----------------------------------------------------
    // ADDRESS SEARCH (Solana or EVM token address)
    // ----------------------------------------------------
    if (intent === "address-search" && parsed.type === "address") {
      const address = parsed.address;

      // Fetch all pairs for this token across all chains
      const data = await getTokenPairs(address);

      if (!data || !data.pairs || data.pairs.length === 0) {
        return send(res, `No pairs found for token address: ${address}`);
      }

      // Sort pairs by liquidity (descending)
      const sorted = [...data.pairs].sort((a, b) => {
        const liqA = a.liquidity?.usd || 0;
        const liqB = b.liquidity?.usd || 0;
        return liqB - liqA;
      });

      // Build header
      const uniqueChains = new Set(sorted.map((p) => p.chainId));
      const header =
        `Detected token address: **${address}**\n` +
        `Found **${sorted.length}** pairs across **${uniqueChains.size}** chains:\n\n`;

      return send(res, header + formatDexPairsList(sorted));
    }

    // ----------------------------------------------------
    // EXPLICIT PAIR SEARCH (bonk/sol)
    // ----------------------------------------------------
    if (intent === "pair-search" && parsed.type === "pair") {
      const { base, quote } = parsed;

      const data = await searchDexPairs(base);

      if (!data || !data.pairs) {
        return send(res, `No ${base.toUpperCase()}/${quote.toUpperCase()} pairs found.`);
      }

      const filtered = data.pairs.filter(
        (p) =>
          p.baseToken?.symbol?.toLowerCase() === base &&
          p.quoteToken?.symbol?.toLowerCase() === quote
      );

      if (filtered.length === 0) {
        return send(res, `No ${base.toUpperCase()}/${quote.toUpperCase()} pairs found.`);
      }

      return send(res, formatDexPairsList(filtered));
    }

    // ----------------------------------------------------
    // TOKEN SEARCH (1 token)
    // ----------------------------------------------------
    if (intent === "token-search" && parsed.type === "tokens") {
      const query = parsed.tokens[0];
      const data = await searchDexPairs(query);

      if (!data || !data.pairs || data.pairs.length === 0) {
        return send(res, `No DEX pairs found for **${query}**.`);
      }

      return send(res, formatDexPairsList(data.pairs));
    }

    // ----------------------------------------------------
    // FALLBACK PAIR SEARCH (space-separated tokens)
    // e.g. "bonk sol"
    // ----------------------------------------------------
    if (intent === "pair-search" && parsed.type === "tokens") {
      const [base, quote] = parsed.tokens;

      if (!base || !quote) {
        return send(res, "Invalid pair search.");
      }

      const data = await searchDexPairs(base);

      if (!data || !data.pairs) {
        return send(res, `No ${base.toUpperCase()}/${quote.toUpperCase()} pairs found.`);
      }

      const filtered = data.pairs.filter(
        (p) =>
          p.baseToken?.symbol?.toLowerCase() === base &&
          p.quoteToken?.symbol?.toLowerCase() === quote
      );

      if (filtered.length === 0) {
        return send(res, `No ${base.toUpperCase()}/${quote.toUpperCase()} pairs found.`);
      }

      return send(res, formatDexPairsList(filtered));
    }

    // ----------------------------------------------------
    // TOKEN PROFILES
    // ----------------------------------------------------
    if (intent === "profiles") {
      const data = await getTokenProfiles();
      return send(res, formatTokenProfiles(data));
    }

    // ----------------------------------------------------
    // COMMUNITY TAKEOVERS
    // ----------------------------------------------------
    if (intent === "takeovers") {
      const data = await getCommunityTakeovers();
      return send(res, formatTakeovers(data));
    }

    // ----------------------------------------------------
    // TOKEN BOOSTS
    // ----------------------------------------------------
    if (intent === "boosts") {
      const data = await getTokenBoosts();
      return send(res, formatBoosts(data));
    }

    // ----------------------------------------------------
    // TOP BOOSTS
    // ----------------------------------------------------
    if (intent === "top-boosts") {
      const data = await getTopBoosts();
      return send(res, formatTopBoosts(data));
    }

    // ----------------------------------------------------
    // UNKNOWN INTENT
    // ----------------------------------------------------
    return send(res, "I couldn't understand your DEX request.");

  } catch (err) {
    console.error("DEX_ROUTE | ERROR:", err);
    return send(res, "Dexscreener request failed.");
  }
});

export default router;
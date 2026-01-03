// backend/services/dexscreenerClient.js
import axios from "axios";

const DEXSCREENER_BASE_URL = "https://api.dexscreener.com";

/**
 * Generic JSON fetcher for Dexscreener endpoints.
 */
async function fetchDexscreenerJSON(path, params = {}) {
  try {
    const url = `${DEXSCREENER_BASE_URL}${path}`;

    const response = await axios.get(url, {
      params,
      headers: {
        Accept: "*/*",
      },
      timeout: 10000,
    });

    return response.data;
  } catch (error) {
    console.error(`Dexscreener fetch error [${path}]:`, error.message);
    throw new Error("Failed to fetch data from Dexscreener");
  }
}

/**
 * Search DEX pairs by query string.
 * Example: "SOL", "SOL USDC", "BONK SOL", "bonk/sol"
 * GET /latest/dex/search?q=...
 */
export async function searchDexPairs(query) {
  if (!query || typeof query !== "string") {
    throw new Error("Dexscreener search requires a non-empty query string");
  }

  // Normalize query for consistency
  const normalized = query.toLowerCase().trim().replace(/\s+/g, " ");

  return fetchDexscreenerJSON("/latest/dex/search", { q: normalized });
}

/**
 * Get all trading pairs for a specific token address.
 * GET /latest/dex/tokens/{address}
 */
export async function getTokenPairs(address) {
  if (!address || typeof address !== "string") {
    throw new Error("Token address lookup requires a valid address string");
  }

  return fetchDexscreenerJSON(`/latest/dex/tokens/${address}`);
}

/**
 * Latest token profiles.
 * GET /token-profiles/latest/v1
 */
export async function getTokenProfiles() {
  return fetchDexscreenerJSON("/token-profiles/latest/v1");
}

/**
 * Latest community takeovers.
 * GET /community-takeovers/latest/v1
 */
export async function getCommunityTakeovers() {
  return fetchDexscreenerJSON("/community-takeovers/latest/v1");
}

/**
 * Latest token boosts.
 * GET /token-boosts/latest/v1
 */
export async function getTokenBoosts() {
  return fetchDexscreenerJSON("/token-boosts/latest/v1");
}

/**
 * Top boosted tokens.
 * GET /token-boosts/top/v1
 */
export async function getTopBoosts() {
  return fetchDexscreenerJSON("/token-boosts/top/v1");
}

/**
 * Specific pair lookup by chainId and pairId.
 * Example: /latest/dex/pairs/solana/<pairAddress>
 */
export async function getDexPair(chainId, pairId) {
  if (!chainId || !pairId) {
    throw new Error("Dexscreener pair lookup requires chainId and pairId");
  }

  const path = `/latest/dex/pairs/${chainId}/${pairId}`;
  return fetchDexscreenerJSON(path);
}
// backend/lib/dexIntent.js

/**
 * Dex Mode Intent Detection
 * -----------------------------------------
 * Hybrid logic (Mode C):
 * - "bonk/sol" → explicit pair search
 * - 1 token    → token search
 * - 2+ tokens  → pair search (fallback)
 * - keywords   → special endpoints
 * - addresses  → address search (EVM or Solana)
 */
export function detectDexIntent(message) {
  const msg = message.toLowerCase().trim();

  // Detect EVM address (0x + 40 hex chars)
  const isEvmAddress = /^0x[a-f0-9]{40}$/.test(msg);
  
  // Detect Solana address (Base58, 32-44 chars)
  const isSolAddress = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(msg);
  
  if (isEvmAddress || isSolAddress) {
    return "address-search";
  }

  // Explicit pair format like "bonk/sol", "wif/usdc"
  if (msg.includes("/")) {
    return "pair-search";
  }

  // Keyword-based intents
  if (msg.includes("profiles")) return "profiles";
  if (msg.includes("takeovers")) return "takeovers";
  if (msg.includes("boosts") && msg.includes("top")) return "top-boosts";
  if (msg.includes("boosts")) return "boosts";

  // Token/pair search (fallback for space-separated)
  const tokens = msg.split(/\s+/).filter(Boolean);

  if (tokens.length === 1) return "token-search";
  if (tokens.length >= 2) return "pair-search";

  return "unknown";
}

/**
 * Parse Dex Query
 * -----------------------------------------
 * Returns structured query info:
 * - address:   { type: "address", address: string }
 * - explicit pair: { type: "pair", base, quote }
 * - tokens:    { type: "tokens", tokens: string[] }
 */
export function parseDexQuery(message) {
  const cleaned = message.toLowerCase().trim();

  // Detect EVM or Solana address
  const isEvmAddress = /^0x[a-f0-9]{40}$/.test(cleaned);
  const isSolAddress = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(cleaned);

  if (isEvmAddress || isSolAddress) {
    return {
      type: "address",
      address: cleaned
    };
  }

  // Explicit pair input like "bonk/sol"
  if (cleaned.includes("/")) {
    const [baseRaw, quoteRaw] = cleaned.split("/");
    const base = baseRaw.trim();
    const quote = quoteRaw.trim();

    return {
      type: "pair",
      base,
      quote,
    };
  }

  // Fallback: space-separated tokens/keywords
  const tokens = cleaned.split(/\s+/).filter(Boolean);

  return {
    type: "tokens",
    tokens,
  };
}

/**
 * Price Formatter
 * -----------------------------------------
 * Handles microcaps correctly:
 * - Returns value exactly as Dexscreener provides it
 */
function formatPrice(value) {
  if (value === null || value === undefined) return "N/A";
  
  // Dexscreener already returns the correct precision for tiny prices.
  // We simply return it exactly as-is.
  return `$${value}`;
}

/**
 * Format a single Dexscreener pair (Style B)
 * -----------------------------------------
 * Clean, structured, premium output using Markdown Lists.
 */
export function formatDexPair(pair) {
  const price = formatPrice(pair.priceUsd);

  const liquidity = pair.liquidity?.usd
    ? `$${Number(pair.liquidity.usd).toLocaleString()}`
    : "N/A";

  const volume = pair.volume?.h24
    ? `$${Number(pair.volume.h24).toLocaleString()}`
    : "N/A";

  const change = pair.priceChange?.h24
    ? `${pair.priceChange.h24 > 0 ? "+" : ""}${pair.priceChange.h24.toFixed(2)}%`
    : "N/A";

  const fdv = pair.fdv ? `$${Number(pair.fdv).toLocaleString()}` : "N/A";

  const chain = pair.chainId ? capitalize(pair.chainId) : "N/A";
  const dex = pair.dexId ? capitalize(pair.dexId) : "N/A";

  const pairName =
    pair.baseToken && pair.quoteToken
      ? `${pair.baseToken.symbol} / ${pair.quoteToken.symbol}`
      : pair.pairAddress;

  return `**${pairName} (${dex})**

- Price: **${price}**
- Liquidity: **${liquidity}**
- 24h Volume: **${volume}**
- Price Change: **${change}**
- FDV: **${fdv}**
- Chain: **${chain}**
- DEX: **${dex}**
- Pair Address: \`${pair.pairAddress || "N/A"}\``;
}

/**
 * Format multiple pairs (Option A)
 * -----------------------------------------
 * Clean line breaks between each pair without horizontal rules.
 */
export function formatDexPairsList(pairs) {
  // Use triple newline (\n\n\n) to create significant vertical space
  // between separate items, or just \n\n if you want them tighter.
  return pairs.map(formatDexPair).join("\n\n\n");
}

/**
 * Format Token Profiles
 */
export function formatTokenProfiles(data) {
  if (!data || !data.pairs || data.pairs.length === 0) {
    return "No token profiles available.";
  }

  return data.pairs
    .map((p) => {
      const price = formatPrice(p.priceUsd);

      const liquidity = p.liquidity?.usd
        ? `$${Number(p.liquidity.usd).toLocaleString()}`
        : "N/A";

      const volume = p.volume?.h24
        ? `$${Number(p.volume.h24).toLocaleString()}`
        : "N/A";

      return `**${p.baseToken.symbol} (${p.baseToken.address.slice(0, 6)}...)**

- Chain: ${capitalize(p.chainId)}
- Liquidity: ${liquidity}
- 24h Volume: ${volume}
- Price: ${price}`;
    })
    .join("\n\n\n");
}

/**
 * Format Boosts
 */
export function formatBoosts(data) {
  if (!data || !data.pairs || data.pairs.length === 0) {
    return "No boosted tokens found.";
  }

  return data.pairs
    .map((p) => {
      const liquidity = p.liquidity?.usd
        ? `$${Number(p.liquidity.usd).toLocaleString()}`
        : "N/A";

      const volume = p.volume?.h24
        ? `$${Number(p.volume.h24).toLocaleString()}`
        : "N/A";

      return `**${p.baseToken.symbol} (${p.baseToken.address.slice(0, 6)}...)**

- Boost Score: ${p.boostScore || "N/A"}
- Chain: ${capitalize(p.chainId)}
- Liquidity: ${liquidity}
- Volume: ${volume}`;
    })
    .join("\n\n\n");
}

/**
 * Format Top Boosts
 */
export function formatTopBoosts(data) {
  return formatBoosts(data);
}

/**
 * Format Community Takeovers
 */
export function formatTakeovers(data) {
  if (!data || !data.pairs || data.pairs.length === 0) {
    return "No community takeovers found.";
  }

  return data.pairs
    .map((p) => {
      const liquidity = p.liquidity?.usd
        ? `$${Number(p.liquidity.usd).toLocaleString()}`
        : "N/A";

      const volume = p.volume?.h24
        ? `$${Number(p.volume.h24).toLocaleString()}`
        : "N/A";

      const change = p.priceChange?.h24
        ? `${p.priceChange.h24 > 0 ? "+" : ""}${p.priceChange.h24.toFixed(2)}%`
        : "N/A";

      return `**${p.baseToken.symbol} (${p.baseToken.address.slice(0, 6)}...)**

- Chain: ${capitalize(p.chainId)}
- Liquidity: ${liquidity}
- Volume: ${volume}
- Change: ${change}`;
    })
    .join("\n\n\n");
}

/**
 * Capitalize helper
 */
function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}
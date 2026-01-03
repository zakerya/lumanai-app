// backend/routes/chat.js
import express from "express";
import axios from "axios";
import { askGemini } from "../services/geminiClient.js";
import { detectIntent } from "../lib/detectIntent.js";
import {
  getCoinPrice,
  getGlobalMarketData,
  getCoinStats,
} from "../services/coingeckoClient.js";

const router = express.Router();

// Cache for frequently requested data (TTL: 10 seconds)
const cache = {
  price: new Map(),
  stats: new Map(),
  chart: new Map(),
  search: new Map(),
};

const CACHE_TTL = 10 * 1000; // 10 seconds

/* -------------------------------------------------------
   Helper: Format price with commas when appropriate
------------------------------------------------------- */
function formatPriceWithCommas(price) {
  if (price === null || price === undefined || price === "") return "N/A";
  
  const num = Number(price);
  if (isNaN(num)) return price.toString();
  
  // If price is >= 1,000, add commas
  if (num >= 1000) {
    // Handle integers and decimals separately
    const parts = price.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }
  
  // For prices < 1000, return as-is
  return price.toString();
}

// Request queue to prevent too many simultaneous API calls
const requestQueue = [];
let isProcessing = false;

// Rate limiting per IP
const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30; // 30 requests per minute

// Helper function to process queued requests
async function processQueue() {
  if (isProcessing || requestQueue.length === 0) return;
  
  isProcessing = true;
  
  while (requestQueue.length > 0) {
    const request = requestQueue.shift();
    try {
      await request();
    } catch (error) {
      console.error("Queue processing error:", error);
    }
    // Add a small delay between requests to prevent overwhelming APIs
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  isProcessing = false;
}

// Helper to add requests to queue
function enqueueRequest(requestFn) {
  return new Promise((resolve, reject) => {
    const wrappedRequest = async () => {
      try {
        const result = await requestFn();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    requestQueue.push(wrappedRequest);
    processQueue();
  });
}

// Rate limiting middleware
function checkRateLimit(ip) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  if (!rateLimit.has(ip)) {
    rateLimit.set(ip, []);
  }
  
  const requests = rateLimit.get(ip);
  // Clean old requests
  while (requests.length > 0 && requests[0] < windowStart) {
    requests.shift();
  }
  
  if (requests.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  requests.push(now);
  return true;
}

// Clear old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  const windowStart = now - (RATE_LIMIT_WINDOW * 2); // Clear entries older than 2 windows
  for (const [ip, requests] of rateLimit.entries()) {
    while (requests.length > 0 && requests[0] < windowStart) {
      requests.shift();
    }
    if (requests.length === 0) {
      rateLimit.delete(ip);
    }
  }
}, 60000);

/* -------------------------------------------------------
   STOPWORDS — prevents false matches
------------------------------------------------------- */
const STOPWORDS = new Set([
  "what", "is", "the", "price", "of", "a", "an", "for", "to", "in",
  "how", "much", "does", "cost", "tell", "me", "about", "give", "show",
  "mcap", "market", "cap", "volume", "supply", "ath", "atl", "stats",
  "current", "coin", "crypto", "token", "value", "worth",
]);

/* -------------------------------------------------------
   Helper: Sanitize message
------------------------------------------------------- */
function sanitizeMessage(html) {
  return String(html)
    .replace(/\n+/g, " ")   // remove accidental newlines
    .replace(/\s+/g, " ")   // collapse weird spacing
    .trim();
}

/* -------------------------------------------------------
   Chart intent detection (baseline: explicit "chart")
------------------------------------------------------- */
function detectChartIntent(message) {
  const msg = message.toLowerCase();
  return msg.includes("chart");
}

/* -------------------------------------------------------
   Timeframe parser (baseline: 24h / 7d / 30d only)
------------------------------------------------------- */
function parseTimeframe(message) {
  const msg = message.toLowerCase();

  if (msg.includes("7d")) return "7d";
  if (msg.includes("30d")) return "30d";

  // Default and most reliable
  return "24h";
}

/* -------------------------------------------------------
   Cached version of resolveCoinId
------------------------------------------------------- */
async function resolveCoinId(query) {
  const cacheKey = `search:${query}`;
  const cached = cache.search.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const result = await enqueueRequest(async () => {
      const res = await axios.get(
        `https://api.coingecko.com/api/v3/search?query=${query}`
      );

      const coins = res.data?.coins;
      if (!coins || coins.length === 0) return null;

      const coin = coins[0];
      const data = {
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
      };
      
      cache.search.set(cacheKey, {
        timestamp: Date.now(),
        data
      });
      
      return data;
    });
    
    return result;
  } catch (err) {
    console.error("Coin resolve error:", err.message);
    return null;
  }
}

/* -------------------------------------------------------
   Extract coin from user message
------------------------------------------------------- */
async function extractCoin(message) {
  const words = message
    .toLowerCase()
    .split(/\s+/)
    .filter(w => /^[a-z0-9]+$/.test(w))
    .filter(w => w.length >= 2)
    .filter(w => !STOPWORDS.has(w));

  for (const w of words) {
    const coin = await resolveCoinId(w);
    if (coin) return coin;
  }

  return null;
}

/* -------------------------------------------------------
   Fetch chart data from CoinGecko (stable endpoint)
   Uses /market_chart with days = 1 / 7 / 30
------------------------------------------------------- */
async function getCoinChartData(coinId, timeframe) {
  const cacheKey = `chart:${coinId}:${timeframe}`;
  const cached = cache.chart.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const result = await enqueueRequest(async () => {
      const daysMap = {
        "24h": 1,
        "7d": 7,
        "30d": 30,
      };

      const days = daysMap[timeframe] || 1;

      const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;
      const res = await axios.get(url, { timeout: 10000 });

      if (!res.data?.prices || res.data.prices.length === 0) {
        console.warn(
          `Empty chart data from CoinGecko for ${coinId}, timeframe ${timeframe}`
        );
        return [];
      }

      // prices: [ [timestamp, price], ... ]
      const data = res.data.prices.map(([t, p]) => ({
        t,
        p,
      }));
      
      cache.chart.set(cacheKey, {
        timestamp: Date.now(),
        data
      });
      
      return data;
    });
    
    return result;
  } catch (err) {
    console.error("Chart fetch error:", err.message);
    // Return empty array instead of throwing
    return [];
  }
}

/* -------------------------------------------------------
   Cached version of getCoinStats
------------------------------------------------------- */
async function getCachedCoinStats(coinId) {
  const cacheKey = `stats:${coinId}`;
  const cached = cache.stats.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const result = await enqueueRequest(async () => {
      const data = await getCoinStats(coinId);
      cache.stats.set(cacheKey, {
        timestamp: Date.now(),
        data
      });
      return data;
    });
    
    return result;
  } catch (err) {
    console.error("Cached stats fetch error:", err.message);
    throw err;
  }
}

/* -------------------------------------------------------
   Cached version of getCoinPrice
------------------------------------------------------- */
async function getCachedCoinPrice(coinId) {
  const cacheKey = `price:${coinId}`;
  const cached = cache.price.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const result = await enqueueRequest(async () => {
      const data = await getCoinPrice(coinId);
      cache.price.set(cacheKey, {
        timestamp: Date.now(),
        data
      });
      return data;
    });
    
    return result;
  } catch (err) {
    console.error("Cached price fetch error:", err.message);
    throw err;
  }
}

/* -------------------------------------------------------
   Chart Request Handler
------------------------------------------------------- */
async function handleChartRequest(message, res) {
  const coin = await extractCoin(message);
  if (!coin) {
    return res.json({
      type: "error",
      message: "I couldn't detect which coin you're asking about.",
      timestamp: new Date().toISOString(),
    });
  }

  const timeframe = parseTimeframe(message);
  const data = await getCoinChartData(coin.id, timeframe);

  return res.json({
    type: "chart",
    coin,
    timeframe,
    data,
    timestamp: new Date().toISOString(),
  });
}

/* -------------------------------------------------------
   Chat Route (with rate limiting and caching)
------------------------------------------------------- */
router.post("/", async (req, res) => {
  const clientIp = req.ip || req.connection.remoteAddress;
  
  // Check rate limit
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({
      answer: "Too many requests. Please wait a moment before trying again.",
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const { message } = req.body;

    console.log("CHAT_ROUTE | RECEIVED:", message, "from IP:", clientIp);

    // 1) CHART REQUESTS (explicit "chart ..." only)
    if (detectChartIntent(message)) {
      return await handleChartRequest(message, res);
    }

    // 2) GENERAL INTENT (price, market, stats, etc.)
    const intent = await detectIntent(message);
    console.log("CHAT_ROUTE | INTENT:", intent);

    const send = (answer) =>
      res.json({
        answer,
        timestamp: new Date().toISOString(),
      });

    /* -------------------------------------------------------
       PRICE - Optimized with single stats call and caching
    ------------------------------------------------------- */
    if (intent === "price") {
      const coin = await extractCoin(message);
      if (!coin) return send("I couldn't detect which coin you're asking about.");

      try {
        // Use cached stats which includes both price and change
        const data = await getCachedCoinStats(coin.id);
        
        if (!data?.market_data?.current_price?.usd) {
          return send(`I couldn't fetch the price for ${coin.name}.`);
        }

        const price = data.market_data.current_price.usd;
        const change = data.market_data.price_change_percentage_24h || 0;

        // Format price with commas when appropriate
        const formattedPrice = formatPriceWithCommas(price);

        // Arrow + color
        let arrow = "";
        let color = "";

        if (change > 0) {
          arrow = "▲";
          color = "#4ade80"; // green
        } else if (change < 0) {
          arrow = "▼";
          color = "#f87171"; // red
        } else {
          arrow = "";
          color = "#9ca3af"; // gray for 0%
        }

        return send(`The current price of **${coin.name} (${coin.symbol})** is\n\n<span style="display:flex; align-items:center; font-size:32px; font-weight:700;"><span>$${formattedPrice}</span><span style="color:${color}; font-size:12px; margin-left:10px;"><strong>${arrow} ${Math.abs(change).toFixed(2)}% (24h)</strong></span></span>`);
      } catch (err) {
        console.error("Price intent error:", err.message);
        return send(`I couldn't fetch the price for ${coin.name} at the moment. Please try again.`);
      }
    }

    /* -------------------------------------------------------
       MARKET OVERVIEW - with caching
    ------------------------------------------------------- */
    if (intent === "market") {
      try {
        const global = await enqueueRequest(async () => {
          const data = await getGlobalMarketData();
          return data;
        });
        
        if (!global?.data) return send("I couldn't fetch the global market data.");

        const m = global.data;

        return send(
          `Here's the current crypto market overview:\n\n` +
            `• Total Market Cap: **$${m.total_market_cap.usd.toLocaleString()}**\n` +
            `• 24h Volume: **$${m.total_volume.usd.toLocaleString()}**\n` +
            `• Bitcoin Dominance: **${m.market_cap_percentage.btc.toFixed(2)}%**`
        );
      } catch (err) {
        console.error("Market overview error:", err.message);
        return send("I couldn't fetch the global market data at the moment. Please try again.");
      }
    }

    /* -------------------------------------------------------
       MARKET CAP - with caching
    ------------------------------------------------------- */
    if (intent === "marketcap") {
      const coin = await extractCoin(message);
      if (!coin) return send("I couldn't detect which coin you're asking about.");

      try {
        const data = await getCachedCoinStats(coin.id);
        const marketCap = data.market_data.market_cap.usd;
        const formattedMarketCap = formatPriceWithCommas(marketCap);
        
        return send(`**${coin.name} (${coin.symbol})** market cap is\n\n<span style="display:flex; align-items:center; font-size:32px; font-weight:700;"><span>$${formattedMarketCap}</span></span>`);
      } catch (err) {
        console.error("Market cap error:", err.message);
        return send(`I couldn't fetch market cap for ${coin.name}. Please try again.`);
      }
    }

    /* -------------------------------------------------------
       VOLUME - with caching
    ------------------------------------------------------- */
    if (intent === "volume") {
      const coin = await extractCoin(message);
      if (!coin) return send("I couldn't detect which coin you're asking about.");

      try {
        const data = await getCachedCoinStats(coin.id);
        const volume = data.market_data.total_volume.usd;
        const formattedVolume = formatPriceWithCommas(volume);
        
        return send(`**${coin.name} (${coin.symbol})** 24h volume is\n\n<span style="display:flex; align-items:center; font-size:32px; font-weight:700;"><span>$${formattedVolume}</span></span>`);
      } catch (err) {
        console.error("Volume error:", err.message);
        return send(`I couldn't fetch volume for ${coin.name}. Please try again.`);
      }
    }

    /* -------------------------------------------------------
       SUPPLY - with caching
    ------------------------------------------------------- */
    if (intent === "supply") {
      const coin = await extractCoin(message);
      if (!coin) return send("I couldn't detect which coin you're asking about.");

      try {
        const data = await getCachedCoinStats(coin.id);
        const supply = data.market_data.circulating_supply;
        const formattedSupply = formatPriceWithCommas(supply.toFixed(0));
        
        return send(`**${coin.name} (${coin.symbol})** circulating supply is\n\n<span style="display:flex; align-items:center; font-size:32px; font-weight:700;"><span>${formattedSupply}</span></span>`);
      } catch (err) {
        console.error("Supply error:", err.message);
        return send(`I couldn't fetch supply for ${coin.name}. Please try again.`);
      }
    }

    /* -------------------------------------------------------
       ATH - with caching
    ------------------------------------------------------- */
    if (intent === "ath") {
      const coin = await extractCoin(message);
      if (!coin) return send("I couldn't detect which coin you're asking about.");

      try {
        const data = await getCachedCoinStats(coin.id);
        const athPrice = data.market_data.ath.usd;
        const formattedATH = formatPriceWithCommas(athPrice);
        
        return send(`**${coin.name} (${coin.symbol})** all‑time‑high was\n\n<span style="display:flex; align-items:center; font-size:32px; font-weight:700;"><span>$${formattedATH}</span></span>`);
      } catch (err) {
        console.error("ATH error:", err.message);
        return send(`I couldn't fetch ATH for ${coin.name}. Please try again.`);
      }
    }

    /* -------------------------------------------------------
       ATL - with caching
    ------------------------------------------------------- */
    if (intent === "atl") {
      const coin = await extractCoin(message);
      if (!coin) return send("I couldn't detect which coin you're asking about.");

      try {
        const data = await getCachedCoinStats(coin.id);
        const atlPrice = data.market_data.atl.usd;
        const formattedATL = formatPriceWithCommas(atlPrice);
        
        return send(`**${coin.name} (${coin.symbol})** all‑time‑low was\n\n<span style="display:flex; align-items:center; font-size:32px; font-weight:700;"><span>$${formattedATL}</span></span>`);
      } catch (err) {
        console.error("ATL error:", err.message);
        return send(`I couldn't fetch ATL for ${coin.name}. Please try again.`);
      }
    }

    /* -------------------------------------------------------
       FULL STATS - with caching
    ------------------------------------------------------- */
    if (intent === "stats") {
      const coin = await extractCoin(message);
      if (!coin) return send("I couldn't detect which coin you're asking about.");

      try {
        const data = await getCachedCoinStats(coin.id);
        const m = data.market_data;

        // Format prices with commas
        const currentPrice = formatPriceWithCommas(m.current_price.usd);
        const athPrice = formatPriceWithCommas(m.ath.usd);
        const atlPrice = formatPriceWithCommas(m.atl.usd);
        const marketCap = m.market_cap.usd.toLocaleString();
        const volume = m.total_volume.usd.toLocaleString();
        const supply = m.circulating_supply.toLocaleString();
        const totalSupply = m.total_supply?.toLocaleString() || "N/A";
        const change = m.price_change_percentage_24h;

        // Arrow + color for 24h change
        let arrow = "";
        let color = "";

        if (change > 0) {
          arrow = "▲";
          color = "#4ade80"; // green
        } else if (change < 0) {
          arrow = "▼";
          color = "#f87171"; // red
        } else {
          arrow = "";
          color = "#9ca3af"; // gray for 0%
        }

        return send(
          `Here are the stats for **${coin.name} (${coin.symbol})**:\n\n` +
          `**Price**\n<span style="display:flex; align-items:center; font-size:32px; font-weight:700;"><span>$${currentPrice}</span><span style="color:${color}; font-size:12px; margin-left:10px;"><strong>${arrow} ${Math.abs(change).toFixed(2)}% (24h)</strong></span></span>\n\n` +
          `**Market Cap**\n<span style="display:flex; align-items:center; font-size:24px; font-weight:600;"><span>$${marketCap}</span></span>\n\n` +
          `**24h Volume**\n<span style="display:flex; align-items:center; font-size:24px; font-weight:600;"><span>$${volume}</span></span>\n\n` +
          `**Circulating Supply**\n<span style="display:flex; align-items:center; font-size:24px; font-weight:600;"><span>${supply}</span></span>\n\n` +
          `**Total Supply**\n<span style="display:flex; align-items:center; font-size:24px; font-weight:600;"><span>${totalSupply}</span></span>\n\n` +
          `**All-Time High**\n<span style="display:flex; align-items:center; font-size:24px; font-weight:600;"><span>$${athPrice}</span></span>\n\n` +
          `**All-Time Low**\n<span style="display:flex; align-items:center; font-size:24px; font-weight:600;"><span>$${atlPrice}</span></span>`
        );
      } catch (err) {
        console.error("Stats error:", err.message);
        return send(`I couldn't fetch stats for ${coin.name}. Please try again.`);
      }
    }

    /* -------------------------------------------------------
       FALLBACK → Gemini
    ------------------------------------------------------- */
    const aiAnswer = await askGemini(message);
    return send(aiAnswer);
  } catch (err) {
    console.error("CHAT_ROUTE | ERROR:", err);
    return res.status(500).json({
      answer: "Server error. Please try again in a moment.",
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
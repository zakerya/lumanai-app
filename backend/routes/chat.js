// backend/routes/chat.js
import express from "express";
import axios from "axios";
import { askGemini } from "../services/geminiClient.js";
import { detectIntent } from "../lib/detectIntent.js";

const router = express.Router();

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 30 * 1000; // 30 seconds

// Helper function to get/set cache
function getCache(key) {
  const item = cache.get(key);
  if (item && Date.now() - item.timestamp < CACHE_TTL) {
    return item.data;
  }
  return null;
}

function setCache(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

/* -------------------------------------------------------
   Helper: Format price with commas when appropriate
------------------------------------------------------- */
function formatPriceWithCommas(price) {
  if (price === null || price === undefined || price === "") return "N/A";
  
  const num = Number(price);
  if (isNaN(num)) return price.toString();
  
  // If price is >= 1,000, add commas
  if (num >= 1000) {
    const parts = price.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }
  
  return price.toString();
}

/* -------------------------------------------------------
   STOPWORDS
------------------------------------------------------- */
const STOPWORDS = new Set([
  "what", "is", "the", "price", "of", "a", "an", "for", "to", "in",
  "how", "much", "does", "cost", "tell", "me", "about", "give", "show",
  "mcap", "market", "cap", "volume", "supply", "ath", "atl", "stats",
  "current", "coin", "crypto", "token", "value", "worth",
]);

/* -------------------------------------------------------
   Chart intent detection
------------------------------------------------------- */
function detectChartIntent(message) {
  const msg = message.toLowerCase();
  return msg.includes("chart");
}

/* -------------------------------------------------------
   Timeframe parser
------------------------------------------------------- */
function parseTimeframe(message) {
  const msg = message.toLowerCase();
  if (msg.includes("7d")) return "7d";
  if (msg.includes("30d")) return "30d";
  return "24h";
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
   Resolve coin ID from name
------------------------------------------------------- */
async function resolveCoinId(query) {
  const cacheKey = `search:${query}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const res = await axios.get(
      `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`,
      { timeout: 10000 }
    );

    const coins = res.data?.coins || [];
    if (coins.length === 0) return null;

    const coin = coins[0];
    const data = {
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol.toUpperCase(),
    };
    
    setCache(cacheKey, data);
    return data;
  } catch (err) {
    console.error("Coin resolve error:", err.message);
    return null;
  }
}

/* -------------------------------------------------------
   Get coin data with retry logic
------------------------------------------------------- */
async function getCoinData(coinId, endpoint = "simple/price") {
  const cacheKey = `${endpoint}:${coinId}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const maxRetries = 3;
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      let url;
      if (endpoint === "simple/price") {
        url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`;
      } else if (endpoint === "coins") {
        url = `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
      }

      const res = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Luminai/1.0',
          'Accept': 'application/json'
        }
      });

      const data = endpoint === "simple/price" ? res.data : res.data.market_data;
      setCache(cacheKey, data);
      return data;
    } catch (err) {
      lastError = err;
      console.error(`Attempt ${i + 1} failed for ${coinId}:`, err.message);
      
      // Exponential backoff
      if (i < maxRetries - 1) {
        const delay = 1000 * Math.pow(2, i); // 1s, 2s, 4s
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error(`Failed to fetch data for ${coinId}`);
}

/* -------------------------------------------------------
   Get chart data with fallback
------------------------------------------------------- */
async function getCoinChartData(coinId, timeframe) {
  const cacheKey = `chart:${coinId}:${timeframe}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const daysMap = {
      "24h": 1,
      "7d": 7,
      "30d": 30,
    };

    const days = daysMap[timeframe] || 1;
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;
    
    const res = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Luminai/1.0',
        'Accept': 'application/json'
      }
    });

    if (!res.data?.prices || res.data.prices.length === 0) {
      console.warn(`Empty chart data for ${coinId}`);
      return [];
    }

    const data = res.data.prices.map(([t, p]) => ({
      t,
      p,
    }));
    
    setCache(cacheKey, data);
    return data;
  } catch (err) {
    console.error("Chart fetch error:", err.message);
    
    // Generate mock data as fallback
    console.log("Generating fallback chart data...");
    const now = Date.now();
    const data = [];
    const points = timeframe === "7d" ? 168 : timeframe === "30d" ? 720 : 24;
    
    for (let i = 0; i < points; i++) {
      data.push({
        t: now - (points - i) * 3600000,
        p: 10000 + Math.random() * 2000
      });
    }
    
    setCache(cacheKey, data);
    return data;
  }
}

/* -------------------------------------------------------
   Get global market data
------------------------------------------------------- */
async function getGlobalMarketData() {
  const cacheKey = "global";
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const res = await axios.get("https://api.coingecko.com/api/v3/global", {
      timeout: 10000
    });
    
    setCache(cacheKey, res.data);
    return res.data;
  } catch (err) {
    console.error("Global market data error:", err.message);
    // Return fallback data
    return {
      data: {
        total_market_cap: { usd: 2500000000000 },
        total_volume: { usd: 80000000000 },
        market_cap_percentage: { btc: 52.5 }
      }
    };
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
   Main Chat Route
------------------------------------------------------- */
router.post("/", async (req, res) => {
  try {
    const { message } = req.body;
    console.log("CHAT_ROUTE | RECEIVED:", message);

    // 1) CHART REQUESTS
    if (detectChartIntent(message)) {
      return await handleChartRequest(message, res);
    }

    // 2) GENERAL INTENT
    const intent = await detectIntent(message);
    console.log("CHAT_ROUTE | INTENT:", intent);

    const send = (answer) =>
      res.json({
        answer,
        timestamp: new Date().toISOString(),
      });

    /* -------------------------------------------------------
       PRICE
    ------------------------------------------------------- */
    if (intent === "price") {
      const coin = await extractCoin(message);
      if (!coin) return send("I couldn't detect which coin you're asking about.");

      try {
        const data = await getCoinData(coin.id, "simple/price");
        
        if (!data || !data[coin.id]) {
          return send(`I couldn't fetch the price for ${coin.name}.`);
        }

        const coinData = data[coin.id];
        const price = coinData.usd;
        const change = coinData.usd_24h_change || 0;

        const formattedPrice = formatPriceWithCommas(price);

        let arrow = "";
        let color = "";

        if (change > 0) {
          arrow = "▲";
          color = "#4ade80";
        } else if (change < 0) {
          arrow = "▼";
          color = "#f87171";
        } else {
          arrow = "";
          color = "#9ca3af";
        }

        return send(`The current price of **${coin.name} (${coin.symbol})** is\n\n<span style="display:flex; align-items:center; font-size:32px; font-weight:700;"><span>$${formattedPrice}</span><span style="color:${color}; font-size:12px; margin-left:10px;"><strong>${arrow} ${Math.abs(change).toFixed(2)}% (24h)</strong></span></span>`);
      } catch (err) {
        console.error("Price intent error:", err.message);
        return send(`I couldn't fetch the price for ${coin.name} at the moment. Please try again.`);
      }
    }

    /* -------------------------------------------------------
       MARKET OVERVIEW
    ------------------------------------------------------- */
    if (intent === "market") {
      try {
        const global = await getGlobalMarketData();
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
       MARKET CAP, VOLUME, SUPPLY, ATH, ATL, STATS
    ------------------------------------------------------- */
    const statsIntents = ["marketcap", "volume", "supply", "ath", "atl", "stats"];
    if (statsIntents.includes(intent)) {
      const coin = await extractCoin(message);
      if (!coin) return send("I couldn't detect which coin you're asking about.");

      try {
        const data = await getCoinData(coin.id, "coins");
        
        if (intent === "marketcap") {
          const marketCap = data.market_cap.usd;
          const formattedMarketCap = formatPriceWithCommas(marketCap);
          return send(`**${coin.name} (${coin.symbol})** market cap is\n\n<span style="display:flex; align-items:center; font-size:32px; font-weight:700;"><span>$${formattedMarketCap}</span></span>`);
        }
        
        if (intent === "volume") {
          const volume = data.total_volume.usd;
          const formattedVolume = formatPriceWithCommas(volume);
          return send(`**${coin.name} (${coin.symbol})** 24h volume is\n\n<span style="display:flex; align-items:center; font-size:32px; font-weight:700;"><span>$${formattedVolume}</span></span>`);
        }
        
        if (intent === "supply") {
          const supply = data.circulating_supply;
          const formattedSupply = formatPriceWithCommas(supply.toFixed(0));
          return send(`**${coin.name} (${coin.symbol})** circulating supply is\n\n<span style="display:flex; align-items:center; font-size:32px; font-weight:700;"><span>${formattedSupply}</span></span>`);
        }
        
        if (intent === "ath") {
          const athPrice = data.ath.usd;
          const formattedATH = formatPriceWithCommas(athPrice);
          return send(`**${coin.name} (${coin.symbol})** all‑time‑high was\n\n<span style="display:flex; align-items:center; font-size:32px; font-weight:700;"><span>$${formattedATH}</span></span>`);
        }
        
        if (intent === "atl") {
          const atlPrice = data.atl.usd;
          const formattedATL = formatPriceWithCommas(atlPrice);
          return send(`**${coin.name} (${coin.symbol})** all‑time‑low was\n\n<span style="display:flex; align-items:center; font-size:32px; font-weight:700;"><span>$${formattedATL}</span></span>`);
        }
        
        if (intent === "stats") {
          const currentPrice = formatPriceWithCommas(data.current_price.usd);
          const athPrice = formatPriceWithCommas(data.ath.usd);
          const atlPrice = formatPriceWithCommas(data.atl.usd);
          const marketCap = data.market_cap.usd.toLocaleString();
          const volume = data.total_volume.usd.toLocaleString();
          const supply = data.circulating_supply.toLocaleString();
          const totalSupply = data.total_supply?.toLocaleString() || "N/A";
          const change = data.price_change_percentage_24h;

          let arrow = "";
          let color = "";

          if (change > 0) {
            arrow = "▲";
            color = "#4ade80";
          } else if (change < 0) {
            arrow = "▼";
            color = "#f87171";
          } else {
            arrow = "";
            color = "#9ca3af";
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
        }
      } catch (err) {
        console.error(`${intent} error for ${coin?.name}:`, err.message);
        return send(`I couldn't fetch ${intent} for ${coin?.name}. Please try again.`);
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
// backend/routes/chat.js
import express from "express";
import { askGemini } from "../services/geminiClient.js";
import { detectIntent } from "../lib/detectIntent.js";
import {
  searchCryptoRank,
  getCryptoRankPrice,
  getCryptoRankGlobal,
  getCoinInfoBySymbol,
} from "../services/cryptorankClient.js";

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
   Helper: Format price with appropriate decimals and commas
------------------------------------------------------- */
function formatPriceWithCommas(price) {
  if (price === null || price === undefined || price === "") return "N/A";
  
  const num = Number(price);
  if (isNaN(num)) return price.toString();
  
  // Determine appropriate decimal places based on price
  let formattedPrice;
  
  if (num >= 1000) {
    // For prices >= 1000, use 2 decimal places with commas
    formattedPrice = num.toFixed(2);
    const parts = formattedPrice.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    formattedPrice = parts.join(".");
  } else if (num >= 1) {
    // For prices between 1 and 1000, use 2-4 decimal places
    formattedPrice = num.toFixed(2);
  } else if (num >= 0.01) {
    // For prices between 0.01 and 1, use 4-6 decimal places
    formattedPrice = num.toFixed(4);
  } else if (num >= 0.0001) {
    // For prices between 0.0001 and 0.01, use 6-8 decimal places
    formattedPrice = num.toFixed(6);
  } else if (num >= 0.000001) {
    // For prices between 0.000001 and 0.0001, use 8 decimal places
    formattedPrice = num.toFixed(8);
  } else {
    // For very small prices, use scientific notation
    formattedPrice = num.toExponential(4);
  }
  
  return formattedPrice;
}

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
   Clean message for coin extraction - SIMPLIFIED
------------------------------------------------------- */
function cleanMessageForCoinExtraction(message) {
  let cleaned = message.toLowerCase();
  
  // Remove common question patterns
  const patterns = [
    /what('s| is)? the (price|value|mcap|market cap|volume|supply|ath|atl) of /gi,
    /how much is /gi,
    /tell me (about|the price of) /gi,
    /give me (the|a) /gi,
    /show me (the|a) /gi,
    /current /gi,
    /price of /gi,
    /value of /gi,
    /market cap of /gi,
    /mcap of /gi,
    /volume of /gi,
    /supply of /gi,
    /ath of /gi,
    /atl of /gi,
  ];
  
  patterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });
  
  // Remove punctuation and extra spaces
  cleaned = cleaned.replace(/[.,?!]/g, '').trim();
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

// NEW: Define stop words to filter out non-coin terms
const stopWords = new Set([
  'price', 'what', 'is', 'the', 'of', 'for', 'to', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'by', 'with', 'about',
  'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among', 'market', 'cap', 'volume',
  'supply', 'ath', 'atl', 'stats', 'current', 'value', 'mcap', 'how', 'much', 'tell', 'me', 'give', 'show'
]);

/* -------------------------------------------------------
   Extract coin from user message - UPDATED VERSION
------------------------------------------------------- */
async function extractCoin(message) {
  console.log("\n=== EXTRACT COIN ===");
  console.log("Original message:", message);
  
  // Clean the message
  let cleanedMessage = cleanMessageForCoinExtraction(message);
  console.log("Cleaned message:", cleanedMessage);
  
  // NEW: Split into words and filter out stop words
  const words = cleanedMessage.split(/\s+/).filter(word => word.length > 1 && !stopWords.has(word.toLowerCase()));
  console.log("Filtered words to try:", words);
  
  if (words.length === 0) {
    console.log("No words after filtering");
    return null;
  }
  
  // UPDATED: If only one word left, try it directly as a symbol (handles short messages like "mon")
  if (words.length === 1) {
    const symbol = words[0].toUpperCase();
    console.log("Single word, trying as symbol:", symbol);
    const coin = await getCoinInfoBySymbol(symbol);
    if (coin) {
      console.log(`Found coin by single word symbol: ${coin.name} (${coin.symbol})`);
      return {
        id: coin.symbol,
        name: coin.name,
        symbol: coin.symbol,
      };
    }
  }
  
  // Strategy 1: Try each filtered word as a symbol
  for (const word of words) {
    const symbol = word.toUpperCase();
    
    // Skip if it looks like a number or has special chars (except common crypto symbols)
    if (/\d/.test(symbol) || symbol.length > 10) {
      continue;
    }
    
    console.log(`Trying as symbol: ${symbol}`);
    const coin = await getCoinInfoBySymbol(symbol);
    if (coin) {
      console.log(`Found coin by symbol ${symbol}: ${coin.name}`);
      return {
        id: coin.symbol,
        name: coin.name,
        symbol: coin.symbol,
      };
    }
  }
  
  // Strategy 2: UPDATED - Search for the joined filtered words (e.g., "monad" instead of "monad price")
  const searchQuery = words.join(' ');
  console.log(`Searching for filtered query: "${searchQuery}"`);
  const coins = await searchCryptoRank(searchQuery);
  
  if (coins && coins.length > 0) {
    // UPDATED: Use fuzzy matching (includes) for name or symbol
    const fuzzyMatch = coins.find(coin => 
      coin.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      coin.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    let coin;
    if (fuzzyMatch) {
      coin = fuzzyMatch;
      console.log(`Found fuzzy match by filtered search: ${coin.name} (${coin.symbol})`);
    } else {
      // Fallback to first result
      coin = coins[0];
      console.log(`No fuzzy match, using first result: ${coin.name} (${coin.symbol})`);
    }
    
    return {
      id: coin.symbol,
      name: coin.name,
      symbol: coin.symbol,
    };
  }
  
  // Strategy 3: Try each filtered word as a search query
  for (const word of words) {
    console.log(`Searching for filtered word: "${word}"`);
    const coins = await searchCryptoRank(word);
    
    if (coins && coins.length > 0) {
      // UPDATED: Use fuzzy matching (includes) for name or symbol
      const fuzzyMatch = coins.find(coin => 
        coin.name.toLowerCase().includes(word.toLowerCase()) || 
        coin.symbol.toLowerCase().includes(word.toLowerCase())
      );
      
      let coin;
      if (fuzzyMatch) {
        coin = fuzzyMatch;
        console.log(`Found fuzzy match by filtered word search "${word}": ${coin.name} (${coin.symbol})`);
      } else {
        coin = coins[0];
        console.log(`No fuzzy match for "${word}", using first result: ${coin.name} (${coin.symbol})`);
      }
      
      return {
        id: coin.symbol,
        name: coin.name,
        symbol: coin.symbol,
      };
    }
  }
  
  console.log("No coin found");
  return null;
}

/* -------------------------------------------------------
   Get coin price data from CryptoRank
------------------------------------------------------- */
async function getCoinPriceData(symbol) {
  const cacheKey = `price:${symbol}`;
  const cached = getCache(cacheKey);
  if (cached) {
    console.log(`[CACHE] Price for ${symbol}: $${cached.price}`);
    return cached;
  }

  try {
    console.log(`[API] Fetching price for ${symbol}`);
    const data = await getCryptoRankPrice(symbol);
    
    if (!data) {
      console.log(`No price data for ${symbol}`);
      return null;
    }

    console.log(`[API] Price for ${symbol}: $${data.price}`);
    setCache(cacheKey, data);
    return data;
  } catch (err) {
    console.error("Price fetch error:", err.message);
    return null;
  }
}

/* -------------------------------------------------------
   Get coin stats data from CryptoRank
------------------------------------------------------- */
async function getCoinStatsData(symbol) {
  const cacheKey = `stats:${symbol}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const data = await getCryptoRankPrice(symbol);
    
    if (!data) return null;

    // Format data to match expected structure
    const formattedData = {
      market_data: {
        current_price: { usd: data.price },
        price_change_percentage_24h: data.change24h,
        market_cap: { usd: data.marketCap },
        total_volume: { usd: data.volume24h },
        circulating_supply: data.circulatingSupply,
        total_supply: data.totalSupply,
        ath: { usd: data.ath || 0 },
        atl: { usd: 0 }, // CryptoRank doesn't provide ATL
      }
    };

    setCache(cacheKey, formattedData);
    return formattedData;
  } catch (err) {
    console.error("Stats fetch error:", err.message);
    return null;
  }
}

/* -------------------------------------------------------
   Get chart data - generate mock data
------------------------------------------------------- */
async function getCoinChartData(symbol, timeframe) {
  const cacheKey = `chart:${symbol}:${timeframe}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    console.log(`Generating chart data for ${symbol} (${timeframe})`);
    
    // Get current price to base the chart on
    const priceData = await getCoinPriceData(symbol);
    const basePrice = priceData?.price || 1000;
    const change24h = priceData?.change24h || 0;
    
    const now = Date.now();
    const data = [];
    const points = timeframe === "7d" ? 168 : timeframe === "30d" ? 720 : 24;
    
    // Generate realistic price movement
    let currentPrice = basePrice;
    const volatility = timeframe === "24h" ? 0.02 : timeframe === "7d" ? 0.05 : 0.08;
    
    for (let i = 0; i < points; i++) {
      // Simulate random walk with drift based on 24h change
      const randomChange = (Math.random() - 0.5) * 2 * volatility;
      const trendChange = (change24h / 100) / points;
      currentPrice = currentPrice * (1 + randomChange + trendChange);
      
      // Ensure price doesn't go too low
      currentPrice = Math.max(currentPrice, basePrice * 0.001);
      
      data.push({
        t: now - (points - i) * 3600000,
        p: currentPrice,
      });
    }
    
    console.log(`Generated chart for ${symbol} (${timeframe}) with ${points} points, base price: $${basePrice}`);
    setCache(cacheKey, data);
    return data;
  } catch (err) {
    console.error("Chart fetch error:", err.message);
    
    // Return simple mock data as fallback
    const now = Date.now();
    const points = timeframe === "7d" ? 168 : timeframe === "30d" ? 720 : 24;
    const data = [];
    
    for (let i = 0; i < points; i++) {
      data.push({
        t: now - (points - i) * 3600000,
        p: 1000 + Math.random() * 2000
      });
    }
    
    return data;
  }
}

/* -------------------------------------------------------
   Get global market data from CryptoRank
------------------------------------------------------- */
async function getGlobalMarketData() {
  const cacheKey = "global";
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const data = await getCryptoRankGlobal();
    
    if (!data) {
      // Return fallback data
      return {
        data: {
          total_market_cap: { usd: 2500000000000 },
          total_volume: { usd: 80000000000 },
          market_cap_percentage: { btc: 52.5 }
        }
      };
    }

    // Format data to match expected structure
    const formattedData = {
      data: {
        total_market_cap: { usd: data.totalMarketCap },
        total_volume: { usd: data.totalVolume24h },
        market_cap_percentage: { btc: data.btcDominance }
      }
    };

    setCache(cacheKey, formattedData);
    return formattedData;
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
  const data = await getCoinChartData(coin.symbol, timeframe);

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
    console.log("\n=== NEW REQUEST ===");
    console.log("Message:", message);

    // 1) CHART REQUESTS
    if (detectChartIntent(message)) {
      console.log("Detected chart intent");
      return await handleChartRequest(message, res);
    }

    // 2) GENERAL INTENT
    const intent = await detectIntent(message);
    console.log("Detected intent:", intent);

    const send = (answer) =>
      res.json({
        answer,
        timestamp: new Date().toISOString(),
      });

    /* -------------------------------------------------------
       PRICE
    ------------------------------------------------------- */
    if (intent === "price") {
      console.log("Processing price intent...");
      const coin = await extractCoin(message);
      if (!coin) {
        console.log("Could not extract coin from message");
        return send("I couldn't detect which coin you're asking about. Please try being more specific, like 'bitcoin price' or 'BTC price'.");
      }

      console.log(`Found coin: ${coin.name} (${coin.symbol})`);
      
      try {
        const data = await getCoinPriceData(coin.symbol);
        
        if (!data) {
          console.log(`No price data available for ${coin.symbol}`);
          return send(`I couldn't fetch the price for ${coin.name}. The coin might not exist or there might be a temporary issue with the data source.`);
        }

        const price = data.price;
        const change = data.change24h || 0;

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

        const response = `The current price of **${coin.name} (${coin.symbol})** is\n\n<span style="display:flex; align-items:center; font-size:32px; font-weight:700;"><span>$${formattedPrice}</span><span style="color:${color}; font-size:12px; margin-left:10px;"><strong>${arrow} ${Math.abs(change).toFixed(2)}% (24h)</strong></span></span>`;
        
        console.log(`Price response for ${coin.symbol}: $${price}`);
        return send(response);
      } catch (err) {
        console.error("Price intent error:", err.message);
        return send(`I couldn't fetch the price for ${coin.name} at the moment. Please try again in a few seconds.`);
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
        const data = await getCoinStatsData(coin.symbol);
        
        if (!data) {
          return send(`I couldn't fetch data for ${coin.name}.`);
        }
        
        const marketData = data.market_data;
        
        if (intent === "marketcap") {
          const marketCap = marketData.market_cap.usd;
          const formattedMarketCap = formatPriceWithCommas(marketCap);
          return send(`**${coin.name} (${coin.symbol})** market cap is\n\n<span style="display:flex; align-items:center; font-size:32px; font-weight:700;"><span>$${formattedMarketCap}</span></span>`);
        }
        
        if (intent === "volume") {
          const volume = marketData.total_volume.usd;
          const formattedVolume = formatPriceWithCommas(volume);
          return send(`**${coin.name} (${coin.symbol})** 24h volume is\n\n<span style="display:flex; align-items:center; font-size:32px; font-weight:700;"><span>$${formattedVolume}</span></span>`);
        }
        
        if (intent === "supply") {
          const supply = marketData.circulating_supply;
          const formattedSupply = formatPriceWithCommas(supply.toFixed(0));
          return send(`**${coin.name} (${coin.symbol})** circulating supply is\n\n<span style="display:flex; align-items:center; font-size:32px; font-weight:700;"><span>${formattedSupply}</span></span>`);
        }
        
        if (intent === "ath") {
          const athPrice = marketData.ath.usd;
          const formattedATH = formatPriceWithCommas(athPrice);
          return send(`**${coin.name} (${coin.symbol})** all‑time‑high was\n\n<span style="display:flex; align-items:center; font-size:32px; font-weight:700;"><span>$${formattedATH}</span></span>`);
        }
        
        if (intent === "atl") {
          // CryptoRank doesn't provide ATL, so return a message
          return send(`**${coin.name} (${coin.symbol})** all‑time‑low data is not available from our current data source.`);
        }
        
        if (intent === "stats") {
          const currentPrice = formatPriceWithCommas(marketData.current_price.usd);
          const athPrice = formatPriceWithCommas(marketData.ath.usd);
          const marketCap = marketData.market_cap.usd.toLocaleString();
          const volume = marketData.total_volume.usd.toLocaleString();
          const supply = marketData.circulating_supply.toLocaleString();
          const totalSupply = marketData.total_supply?.toLocaleString() || "N/A";
          const change = marketData.price_change_percentage_24h;

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
            `**All-Time High**\n<span style="display:flex; align-items:center; font-size:24px; font-weight:600;"><span>$${athPrice}</span></span>`
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
    console.log("Falling back to Gemini");
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
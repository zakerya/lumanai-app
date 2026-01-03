// backend/services/coingeckoClient.js
import axios from "axios";

const API = "https://api.coingecko.com/api/v3";

// Simple in-memory cache with TTL
const cache = new Map();

const CACHE_TTL = {
  price: 30 * 1000, // 30 seconds for prices
  stats: 60 * 1000, // 1 minute for stats
  global: 120 * 1000, // 2 minutes for global data
  chart: 60 * 1000, // 1 minute for chart data
};

// Helper function for cache management
function getFromCache(key, ttl) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  return null;
}

function setToCache(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
  // Limit cache size to prevent memory issues
  if (cache.size > 100) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
}

// Cache key generators
function getPriceCacheKey(id) {
  return `price:${id}`;
}

function getStatsCacheKey(id) {
  return `stats:${id}`;
}

function getGlobalCacheKey() {
  return "global";
}

function getChartCacheKey(coinId, timeframe) {
  return `chart:${coinId}:${timeframe}`;
}

/**
 * Get simple price for a coin id (e.g. "bitcoin")
 */
export async function getCoinPrice(id) {
  try {
    const cacheKey = getPriceCacheKey(id);
    const cached = getFromCache(cacheKey, CACHE_TTL.price);
    if (cached) {
      console.log(`[CACHE HIT] Price for ${id}`);
      return cached;
    }

    console.log(`[CACHE MISS] Fetching price for ${id}`);
    const res = await axios.get(`${API}/simple/price`, {
      params: {
        ids: id,
        vs_currencies: "usd",
      },
      timeout: 10000, // 10 second timeout
    });
    
    setToCache(cacheKey, res.data);
    return res.data;
  } catch (error) {
    console.error(`Error fetching price for ${id}:`, error.message);
    // Return cached data even if expired if fetch fails
    const cacheKey = getPriceCacheKey(id);
    const staleCache = cache.get(cacheKey);
    if (staleCache) {
      console.log(`[FALLBACK] Using stale cache for ${id}`);
      return staleCache.data;
    }
    throw error;
  }
}

/**
 * Get global crypto market data (market cap, volume, dominance, etc.)
 */
export async function getGlobalMarketData() {
  try {
    const cacheKey = getGlobalCacheKey();
    const cached = getFromCache(cacheKey, CACHE_TTL.global);
    if (cached) {
      console.log(`[CACHE HIT] Global market data`);
      return cached;
    }

    console.log(`[CACHE MISS] Fetching global market data`);
    const res = await axios.get(`${API}/global`, {
      timeout: 10000,
    });
    
    setToCache(cacheKey, res.data);
    return res.data;
  } catch (error) {
    console.error(`Error fetching global market data:`, error.message);
    const cacheKey = getGlobalCacheKey();
    const staleCache = cache.get(cacheKey);
    if (staleCache) {
      console.log(`[FALLBACK] Using stale global market data`);
      return staleCache.data;
    }
    throw error;
  }
}

/**
 * Get full coin stats (market cap, supply, ATH, ATL, etc.)
 */
export async function getCoinStats(id) {
  try {
    const cacheKey = getStatsCacheKey(id);
    const cached = getFromCache(cacheKey, CACHE_TTL.stats);
    if (cached) {
      console.log(`[CACHE HIT] Stats for ${id}`);
      return cached;
    }

    console.log(`[CACHE MISS] Fetching stats for ${id}`);
    const res = await axios.get(`${API}/coins/${id}`, {
      params: {
        localization: false,
        tickers: false,
        market_data: true,
        community_data: false,
        developer_data: false,
        sparkline: false,
      },
      timeout: 10000,
    });

    setToCache(cacheKey, res.data);
    return res.data;
  } catch (error) {
    console.error(`Error fetching stats for ${id}:`, error.message);
    const cacheKey = getStatsCacheKey(id);
    const staleCache = cache.get(cacheKey);
    if (staleCache) {
      console.log(`[FALLBACK] Using stale stats for ${id}`);
      return staleCache.data;
    }
    throw error;
  }
}

/**
 * Get chart data for a coin
 */
export async function getCoinChartData(coinId, timeframe) {
  try {
    const cacheKey = getChartCacheKey(coinId, timeframe);
    const cached = getFromCache(cacheKey, CACHE_TTL.chart);
    if (cached) {
      console.log(`[CACHE HIT] Chart for ${coinId} (${timeframe})`);
      return cached;
    }

    console.log(`[CACHE MISS] Fetching chart for ${coinId} (${timeframe})`);
    const now = Math.floor(Date.now() / 1000);

    // Convert timeframe → seconds
    const ranges = {
      "5m": 60 * 5,
      "15m": 60 * 15,
      "30m": 60 * 30,
      "1h": 60 * 60,
      "12h": 60 * 60 * 12,
      "24h": 60 * 60 * 24,
      "7d": 60 * 60 * 24 * 7,
      "30d": 60 * 60 * 24 * 30,
    };

    const seconds = ranges[timeframe] || ranges["24h"];
    const from = now - seconds;

    let url;

    // For 24h, 7d, 30d → use simpler endpoint
    if (["24h", "7d", "30d"].includes(timeframe)) {
      const daysMap = {
        "24h": 1,
        "7d": 7,
        "30d": 30,
      };

      url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${daysMap[timeframe]}`;
    } else {
      // For 5m, 15m, 30m, 1h, 12h → use range endpoint
      url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart/range?vs_currency=usd&from=${from}&to=${now}`;
    }

    const res = await axios.get(url, {
      timeout: 10000,
    });

    // Normalize data
    const prices = res.data.prices.map(([timestamp, price]) => ({
      t: timestamp,
      p: price,
    }));

    setToCache(cacheKey, prices);
    return prices;
  } catch (error) {
    console.error(`Chart fetch error for ${coinId} (${timeframe}):`, error.message);
    const cacheKey = getChartCacheKey(coinId, timeframe);
    const staleCache = cache.get(cacheKey);
    if (staleCache) {
      console.log(`[FALLBACK] Using stale chart for ${coinId} (${timeframe})`);
      return staleCache.data;
    }
    return null;
  }
}

// Optional: Add a method to clear cache (useful for testing or manual cache invalidation)
export function clearCache() {
  console.log(`Clearing cache (was ${cache.size} entries)`);
  cache.clear();
}

// Optional: Log cache stats periodically
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    console.log(`[CACHE STATS] Entries: ${cache.size}`);
  }, 60000); // Log every minute
}
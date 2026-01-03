// backend/services/coingeckoClient.js
import axios from "axios";

const API = "https://api.coingecko.com/api/v3";

// Simple in-memory cache
const cache = new Map();

const CACHE_TTL = {
  price: 30 * 1000,
  stats: 60 * 1000,
  global: 120 * 1000,
  chart: 60 * 1000,
};

function getCache(key, ttl) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  return null;
}

function setCache(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
  // Limit cache size
  if (cache.size > 100) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
}

export async function getCoinPrice(id) {
  const cacheKey = `price:${id}`;
  const cached = getCache(cacheKey, CACHE_TTL.price);
  if (cached) return cached;

  try {
    const res = await axios.get(`${API}/simple/price`, {
      params: {
        ids: id,
        vs_currencies: "usd",
        include_24hr_change: true,
      },
      timeout: 10000,
      headers: {
        'User-Agent': 'Luminai/1.0',
        'Accept': 'application/json'
      }
    });
    
    setCache(cacheKey, res.data);
    return res.data;
  } catch (error) {
    console.error(`Error fetching price for ${id}:`, error.message);
    throw error;
  }
}

export async function getGlobalMarketData() {
  const cacheKey = "global";
  const cached = getCache(cacheKey, CACHE_TTL.global);
  if (cached) return cached;

  try {
    const res = await axios.get(`${API}/global`, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Luminai/1.0',
        'Accept': 'application/json'
      }
    });
    
    setCache(cacheKey, res.data);
    return res.data;
  } catch (error) {
    console.error(`Error fetching global market data:`, error.message);
    throw error;
  }
}

export async function getCoinStats(id) {
  const cacheKey = `stats:${id}`;
  const cached = getCache(cacheKey, CACHE_TTL.stats);
  if (cached) return cached;

  try {
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
      headers: {
        'User-Agent': 'Luminai/1.0',
        'Accept': 'application/json'
      }
    });

    setCache(cacheKey, res.data);
    return res.data;
  } catch (error) {
    console.error(`Error fetching stats for ${id}:`, error.message);
    throw error;
  }
}

export async function getCoinChartData(coinId, timeframe) {
  const cacheKey = `chart:${coinId}:${timeframe}`;
  const cached = getCache(cacheKey, CACHE_TTL.chart);
  if (cached) return cached;

  try {
    const now = Math.floor(Date.now() / 1000);
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

    if (["24h", "7d", "30d"].includes(timeframe)) {
      const daysMap = {
        "24h": 1,
        "7d": 7,
        "30d": 30,
      };
      url = `${API}/coins/${coinId}/market_chart?vs_currency=usd&days=${daysMap[timeframe]}`;
    } else {
      url = `${API}/coins/${coinId}/market_chart/range?vs_currency=usd&from=${from}&to=${now}`;
    }

    const res = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Luminai/1.0',
        'Accept': 'application/json'
      }
    });

    const prices = res.data.prices.map(([timestamp, price]) => ({
      t: timestamp,
      p: price,
    }));

    setCache(cacheKey, prices);
    return prices;
  } catch (err) {
    console.error("Chart fetch error:", err.message);
    throw err;
  }
}
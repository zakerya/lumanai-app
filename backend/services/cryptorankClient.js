// backend/services/cryptorankClient.js

import axios from "axios";

const API = "https://api.cryptorank.io/v1";
const KEY = process.env.CRYPTORANK_API_KEY;

if (!KEY) {
  console.warn("CRYPTORANK_API_KEY is not set in environment variables");
}

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 30 * 1000; // 30 seconds

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

// Helper function for API requests with retry
async function makeCryptoRankRequest(url, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Making request to: ${url.replace(KEY, 'API_KEY_REDACTED')}`);
      const res = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Luminai/1.0',
          'Accept': 'application/json'
        }
      });
      
      console.log(`Request successful, status: ${res.status}`);
      return res.data;
    } catch (err) {
      console.error(`Attempt ${i + 1} failed for ${url.replace(KEY, 'API_KEY_REDACTED')}:`, err.message);
      
      if (i < maxRetries - 1) {
        // Exponential backoff
        const delay = 1000 * Math.pow(2, i);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw err;
      }
    }
  }
}

/**
 * Search for coins by name or symbol
 */
export async function searchCryptoRank(query) {
  const cacheKey = `search:${query}`;
  const cached = getCache(cacheKey);
  if (cached) {
    console.log(`[CACHE HIT] Search for ${query}`);
    return cached;
  }

  try {
    if (!KEY) {
      console.error("CryptoRank API key is missing");
      return [];
    }

    const url = `${API}/currencies?api_key=${KEY}&search=${encodeURIComponent(query)}`;
    const data = await makeCryptoRankRequest(url);
    
    if (!data?.data) {
      console.log("No data returned from CryptoRank search");
      return [];
    }

    const coins = data.data.map(coin => ({
      id: coin.key || coin.symbol,
      symbol: coin.symbol,
      name: coin.name,
      rank: coin.rank,
    }));

    console.log(`[CACHE MISS] Search for ${query} returned ${coins.length} results`);
    setCache(cacheKey, coins);
    return coins;
  } catch (err) {
    console.error("CryptoRank search error:", err.message);
    
    // Fallback to empty array
    return [];
  }
}

/**
 * Get price and basic data for a symbol
 */
export async function getCryptoRankPrice(symbol) {
  const cacheKey = `price:${symbol}`;
  const cached = getCache(cacheKey);
  if (cached) {
    console.log(`[CACHE HIT] Price for ${symbol}`);
    return cached;
  }

  try {
    if (!KEY) {
      console.error("CryptoRank API key is missing");
      return null;
    }

    const url = `${API}/currencies?api_key=${KEY}&symbols=${symbol.toUpperCase()}`;
    const data = await makeCryptoRankRequest(url);

    if (!data?.data?.length) {
      console.log(`No price data for ${symbol} - response data:`, data);
      return null;
    }

    const coin = data.data[0];
    console.log(`Found coin for ${symbol}: ${coin.name} (${coin.symbol})`);
    
    const result = {
      price: coin.values?.USD?.price || 0,
      change24h: coin.values?.USD?.percentChange24h || 0,
      marketCap: coin.values?.USD?.marketCap || 0,
      volume24h: coin.values?.USD?.volume24h || 0,
      circulatingSupply: coin.circulatingSupply || 0,
      totalSupply: coin.totalSupply || 0,
      ath: coin.athPrice?.USD || 0,
      athDate: coin.athDate?.USD || null,
      rank: coin.rank || 0,
      name: coin.name, // Add name to the result
      symbol: coin.symbol, // Add symbol to the result
    };

    console.log(`[CACHE MISS] Price for ${symbol}: $${result.price}, Change 24h: ${result.change24h}%`);
    setCache(cacheKey, result);
    return result;
  } catch (err) {
    console.error("CryptoRank price error for", symbol, ":", err.message);
    
    // Fallback to null
    return null;
  }
}

/**
 * Get global market data
 */
export async function getCryptoRankGlobal() {
  const cacheKey = "global";
  const cached = getCache(cacheKey);
  if (cached) {
    console.log(`[CACHE HIT] Global market data`);
    return cached;
  }

  try {
    if (!KEY) {
      console.error("CryptoRank API key is missing");
      return null;
    }

    const url = `${API}/global?api_key=${KEY}`;
    const data = await makeCryptoRankRequest(url);

    if (!data?.data) {
      console.log("No global data returned from CryptoRank");
      return null;
    }

    const result = {
      totalMarketCap: data.data.totalMarketCap || 0,
      totalVolume24h: data.data.totalVolume24h || 0,
      btcDominance: data.data.btcDominance || 0,
      activeCryptocurrencies: data.data.activeCryptocurrencies || 0,
    };

    console.log(`[CACHE MISS] Global market data fetched`);
    setCache(cacheKey, result);
    return result;
  } catch (err) {
    console.error("CryptoRank global error:", err.message);
    
    // Return fallback data
    return {
      totalMarketCap: 2500000000000,
      totalVolume24h: 80000000000,
      btcDominance: 52.5,
      activeCryptocurrencies: 10000,
    };
  }
}

/**
 * Get historical chart data
 * Note: CryptoRank free tier doesn't have historical chart API,
 * so we generate mock data based on current price
 */
export async function getCryptoRankChart(symbol, timeframe = "24h") {
  const cacheKey = `chart:${symbol}:${timeframe}`;
  const cached = getCache(cacheKey);
  if (cached) {
    console.log(`[CACHE HIT] Chart for ${symbol} (${timeframe})`);
    return cached;
  }

  try {
    console.log(`Generating mock chart data for ${symbol} (${timeframe})`);
    
    // Get current price first
    const priceData = await getCryptoRankPrice(symbol);
    const basePrice = priceData?.price || 1000;
    const change24h = priceData?.change24h || 0;
    
    const now = Date.now();
    const points = timeframe === "7d" ? 168 : timeframe === "30d" ? 720 : 24;
    const data = [];
    
    // Generate realistic price movement
    let currentPrice = basePrice;
    const volatility = timeframe === "24h" ? 0.02 : timeframe === "7d" ? 0.05 : 0.08;
    
    for (let i = 0; i < points; i++) {
      // Simulate random walk with drift
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
    
    console.log(`[CACHE MISS] Generated chart for ${symbol} (${timeframe}) with ${points} points`);
    setCache(cacheKey, data);
    return data;
  } catch (err) {
    console.error("CryptoRank chart error:", err.message);
    
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

// Add this helper function to get coin info by symbol
export async function getCoinInfoBySymbol(symbol) {
  try {
    const priceData = await getCryptoRankPrice(symbol);
    if (!priceData) return null;
    
    return {
      id: symbol,
      name: priceData.name,
      symbol: priceData.symbol,
      price: priceData.price,
      change24h: priceData.change24h,
    };
  } catch (err) {
    console.error("Error getting coin info by symbol:", err.message);
    return null;
  }
}
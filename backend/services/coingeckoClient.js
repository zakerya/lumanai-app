// backend/services/coingeckoClient.js
import axios from "axios";

const API = "https://api.coingecko.com/api/v3";

/**
 * Get simple price for a coin id (e.g. "bitcoin")
 */
export async function getCoinPrice(id) {
  const res = await axios.get(`${API}/simple/price`, {
    params: {
      ids: id,
      vs_currencies: "usd",
    },
  });
  return res.data;
}

/**
 * Get global crypto market data (market cap, volume, dominance, etc.)
 */
export async function getGlobalMarketData() {
  const res = await axios.get(`${API}/global`);
  return res.data;
}

/**
 * Get full coin stats (market cap, supply, ATH, ATL, etc.)
 */
export async function getCoinStats(id) {
  const res = await axios.get(`${API}/coins/${id}`, {
    params: {
      localization: false,
      tickers: false,
      market_data: true,
      community_data: false,
      developer_data: false,
      sparkline: false,
    },
  });

  return res.data;
}

/**
 * Get chart data for a coin
 */
export async function getCoinChartData(coinId, timeframe) {
  try {
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

    const res = await axios.get(url);

    // Normalize data
    const prices = res.data.prices.map(([timestamp, price]) => ({
      t: timestamp,
      p: price,
    }));

    return prices;
  } catch (err) {
    console.error("Chart fetch error:", err.message);
    return null;
  }
}
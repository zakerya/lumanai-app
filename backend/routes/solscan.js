// backend/routes/solscan.js

import express from "express";

const router = express.Router();
const SOLSCAN_API_KEY = process.env.SOLSCAN_API_KEY;

async function solscan(endpoint) {
  const url = `https://pro-api.solscan.io/v2.0/${endpoint}`;

  const res = await fetch(url, {
    headers: {
      accept: "application/json",
      token: SOLSCAN_API_KEY
    }
  });

  const data = await res.json();

  // Handle Solscan API errors
  if (data.code && data.code !== 0) {
    throw new Error(`Solscan error: ${data.message || "Unknown error"}`);
  }

  return data;
}

router.post("/full-wallet", async (req, res) => {
  const { wallet } = req.body;

  if (!wallet) {
    return res.status(400).json({ error: "Wallet address required" });
  }

  try {
    const [detail, transfers, balance, txs, portfolio] = await Promise.all([
      solscan(`account/detail?address=${wallet}`),
      solscan(`account/transfer?address=${wallet}&page=1&page_size=20&sort_by=block_time&sort_order=desc`),
      solscan(`account/balance_change?address=${wallet}&page=1&page_size=20&sort_by=block_time&sort_order=desc`),
      solscan(`account/transactions?address=${wallet}&limit=20`),
      solscan(`account/portfolio?address=${wallet}`)
    ]);

    res.json({
      detail,
      transfers,
      balance,
      transactions: txs,
      portfolio
    });

  } catch (err) {
    console.error("Solscan fetch error:", err.message);
    res.status(500).json({ error: err.message || "Failed to fetch Solscan data" });
  }
});

export default router;

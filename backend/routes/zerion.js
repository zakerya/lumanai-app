// backend/routes/zerion.js

import express from "express";

const router = express.Router();
const API_KEY = process.env.ZERION_API_KEY;

async function zerion(endpoint) {
  const url = `https://api.zerion.io/v1/${endpoint}`;

  const res = await fetch(url, {
    headers: {
      accept: "application/json",
      authorization: `Basic ${API_KEY}`
    }
  });

  const data = await res.json();
  return data;
}

router.post("/full-wallet", async (req, res) => {
  const { wallet } = req.body;

  if (!wallet) {
    return res.status(400).json({ error: "Wallet address required" });
  }

  try {
    const [portfolio, pnl, transactions] = await Promise.all([
      zerion(`wallets/${wallet}/portfolio?filter[positions]=only_simple&currency=usd`),
      zerion(`wallets/${wallet}/pnl?currency=usd`),
      zerion(`wallets/${wallet}/transactions?currency=usd&page[size]=100&filter[trash]=no_filter`)
    ]);

    res.json({
      portfolio,
      pnl,
      transactions
    });

  } catch (err) {
    console.error("Zerion error:", err);
    res.status(500).json({ error: "Failed to fetch Zerion data" });
  }
});

export default router;

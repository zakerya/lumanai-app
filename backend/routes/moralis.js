// backend/routes/moralis.js

import express from "express";

const router = express.Router();
const API_KEY = process.env.MORALIS_API_KEY;

async function moralis(endpoint) {
  const url = `https://solana-gateway.moralis.io/${endpoint}`;

  const res = await fetch(url, {
    headers: {
      accept: "application/json",
      "X-API-Key": API_KEY
    }
  });

  return res.json();
}

router.post("/full-wallet", async (req, res) => {
  const { wallet } = req.body;

  if (!wallet) {
    return res.status(400).json({ error: "Wallet address required" });
  }

  try {
    // 1️⃣ Fetch core wallet data
    const [balanceRaw, tokensRaw, transactions, swaps] = await Promise.all([
      moralis(`account/mainnet/${wallet}/balance`),
      moralis(`account/mainnet/${wallet}/tokens?excludeSpam=true`),
      moralis(`account/mainnet/${wallet}/transactions`),
      moralis(`account/mainnet/${wallet}/swaps?limit=25&order=DESC&transactionTypes=buy,sell`)
    ]);

    // Convert lamports → SOL
    const sol = balanceRaw.lamports / 1_000_000_000;

    // 2️⃣ Fetch SOL price
    const solPrice = await moralis(
      "token/mainnet/So11111111111111111111111111111111111111112/price"
    );

    const solValueUsd = sol * (solPrice.usdPrice || 0);

    // 3️⃣ Extract mint addresses
    const mints = tokensRaw.map(t => t.mint);

    // 4️⃣ Fetch prices + metadata in parallel
    const pricePromises = mints.map(mint =>
      moralis(`token/mainnet/${mint}/price`)
    );

    const metadataPromises = mints.map(mint =>
      moralis(`token/mainnet/${mint}/metadata`)
    );

    const prices = await Promise.all(pricePromises);
    const metadata = await Promise.all(metadataPromises);

    // 5️⃣ Merge price + metadata into tokens
    const tokens = tokensRaw.map((t, i) => {
      const price = prices[i]?.usdPrice || 0;
      const valueUsd = price * Number(t.amount);

      return {
        ...t,
        priceUsd: price,
        valueUsd,
        metadata: metadata[i] || {}
      };
    });

    // 6️⃣ Compute token USD total
    const tokenValueUsd = tokens.reduce(
      (sum, t) => sum + (t.valueUsd || 0),
      0
    );

    // 7️⃣ Compute total portfolio value
    const totalValueUsd = solValueUsd + tokenValueUsd;

    // 8️⃣ Final response
    res.json({
      balance: {
        lamports: balanceRaw.lamports,
        sol,
        solValueUsd
      },
      tokens,
      portfolio: {
        solValueUsd,
        tokenValueUsd,
        totalValueUsd
      },
      transactions,
      swaps
    });

  } catch (err) {
    console.error("Moralis error:", err);
    res.status(500).json({ error: "Failed to fetch Moralis data" });
  }
});

export default router;

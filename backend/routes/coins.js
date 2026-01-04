// backend/routes/coin.js

import express from "express";
import { searchCryptoRank } from "../services/cryptorankClient.js";

const router = express.Router();

router.get("/search", async (req, res) => {
  try {
    const query = req.query.q;

    if (!query) {
      return res.json({ coins: [] });
    }

    const coins = await searchCryptoRank(query);
    
    return res.json({ coins });
  } catch (err) {
    console.error("Coin search error:", err);
    return res.status(500).json({ coins: [] });
  }
});

export default router;
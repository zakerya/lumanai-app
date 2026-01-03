// backend/routes/coin.js

import express from "express";
import axios from "axios";

const router = express.Router();

router.get("/search", async (req, res) => {
  try {
    const query = req.query.q;

    if (!query) {
      return res.json({ coins: [] });
    }

    const response = await axios.get(
      `https://api.coingecko.com/api/v3/search?query=${query}`
    );

    return res.json({ coins: response.data.coins || [] });
  } catch (err) {
    console.error("Coin search error:", err);
    return res.status(500).json({ coins: [] });
  }
});

export default router;

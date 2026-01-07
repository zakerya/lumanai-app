// backend/routes/pumpportal.js

import express from "express";
import { 
  subscribeAccountTrade, 
  subscribeToPumpEvents 
} from "../services/pumpportalClient.js";

const router = express.Router();

// Track a wallet
router.post("/track-wallet", (req, res) => {
  const { wallet } = req.body;

  if (!wallet) {
    return res.status(400).json({ error: "Wallet address required" });
  }

  subscribeAccountTrade([wallet]);

  res.json({ message: `Now tracking wallet ${wallet}` });
});

// SSE stream for live events
router.get("/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const sendEvent = (event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  subscribeToPumpEvents(sendEvent);
});

export default router;

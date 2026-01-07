// backend/server.js

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import chatRouter from './routes/chat.js';
import coinsRouter from './routes/coins.js';
import dexRouter from './routes/dex.js';

// ⭐ Zerion (suspended but kept)
import zerionRouter from "./routes/zerion.js";

// ⭐ Moralis — ACTIVE Solana Wallet Intelligence Route
import moralisRouter from "./routes/moralis.js";

const app = express();
const PORT = process.env.PORT || 5000;

// CORS
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://luminai-app.vercel.app"
    ],
  })
);

app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Luminai backend is running' });
});

// API Routes
app.use('/api/chat', chatRouter);
app.use('/api/coins', coinsRouter);
app.use('/api/dex', dexRouter);

// ⭐ Moralis Wallet Intelligence API (ACTIVE)
app.use("/api/moralis", moralisRouter);

// ⭐ Zerion Wallet Intelligence API (SUSPENDED)
app.use("/api/zerion", zerionRouter);

// Server start
app.listen(PORT, () => {
  console.log(`Luminai backend listening on port ${PORT}`);
});

// backend/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

// TEMP DEBUG LOG
console.log("Loaded GEMINI_API_KEY:", process.env.GEMINI_API_KEY);

import chatRouter from './routes/chat.js';
import coinsRouter from './routes/coins.js';
import dexRouter from './routes/dex.js'; // ⭐ NEW

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: "http://localhost:3000",
  })
);

app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Luminai backend is running' });
});

// Routes
app.use('/api/chat', chatRouter);
app.use('/api/coins', coinsRouter);
app.use('/api/dex', dexRouter); // ⭐ NEW

app.listen(PORT, () => {
  console.log(`Luminai backend listening on port ${PORT}`);
});

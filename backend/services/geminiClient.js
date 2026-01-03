// backend/services/geminiClient.js
import dotenv from "dotenv";
dotenv.config(); // ensures .env loads no matter import order

import axios from "axios";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export async function askGemini(prompt) {
  if (!GEMINI_API_KEY) {
    console.error("Gemini API key is missing");
    return "I'm not configured to answer AI questions right now.";
  }

  try {
    const res = await axios.post(
      `${GEMINI_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      },
      {
        timeout: 100000,
      }
    );

    const text =
      res.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      "I couldn't generate a response.";
    return text;
  } catch (err) {
    const status = err?.response?.status;

    if (status === 429) {
      console.error("Gemini rate limit (429):", err.response?.data);
      return "I'm currently rate-limited by my AI provider. Try again in a bit.";
    }

    console.error("Gemini error:", err.response?.data || err.message);
    return "I couldn't generate a response right now.";
  }
}

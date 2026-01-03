// app/chat/components/ChatContainer.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import ChatWindow from "./ChatWindow";
import InputBar from "./InputBar";
import type { Message } from "../types/Message";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

export default function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: "text",
      sender: "bot",
      text: `**Hey, I'm Luminai. I can explain ANY crypto and fetch live DEX data.**

**General Mode:**
• What is Bitcoin?
• What blockchain does Solana use?
• What's the price of Kaspa?
• Tell me about Injective.

**DEX Mode:**
• **Pairs:** \`bonk/sol\`, \`sol wif\`
• **Tokens:** \`solana\`, \`bonk\`
• **Addresses:** Paste any token address (EVM or Solana)
• **Features:** \`profiles\`, \`takeovers\`, \`boosts\`, \`top boosts\`

Try asking in **General** or switch to **DEX** mode below!`,
      timestamp: new Date().toISOString(),
      isStreaming: false,
    },
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [inputHeight, setInputHeight] = useState(140);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* -------------------------------------------------------
     MAIN SEND HANDLER (General + DEX)
  ------------------------------------------------------- */
  const handleSend = async (
    messageText: string,
    mode: "general" | "dex"
  ) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      type: "text",
      sender: "user",
      text: messageText,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const endpoint =
        mode === "general"
          ? `${API_BASE}/api/chat`
          : `${API_BASE}/api/dex`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.text }),
      });

      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

      const data = await res.json();

      /* -------------------------------------------------------
         CHART MESSAGE (General mode only)
      ------------------------------------------------------- */
      if (data.type === "chart") {
        const chartMessage: Message = {
          id: Date.now() + 1,
          type: "chart",
          sender: "bot",
          coin: data.coin,
          timeframe: "24h", // baseline: always 24h
          data: data.data,
          timestamp: new Date().toISOString(),
          isStreaming: false,
        };

        setMessages(prev => [...prev, chartMessage]);
        return;
      }

      /* -------------------------------------------------------
         TEXT MESSAGE (General + DEX)
      ------------------------------------------------------- */
      const responseText =
        data.answer || "Sorry, I couldn't process your request.";

      const botMessage: Message = {
        id: Date.now() + 1,
        type: "text",
        sender: "bot",
        text: responseText,
        timestamp: new Date().toISOString(),
        isStreaming: true,
      };

      setMessages(prev => [...prev, botMessage]);

      // simple streaming effect
      const delay = Math.max(responseText.length * 10, 1200);
      setTimeout(() => {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === botMessage.id
              ? { ...msg, isStreaming: false }
              : msg
          )
        );
      }, delay);

    } catch (err) {
      console.error("API Error:", err);

      const errorMessage: Message = {
        id: Date.now() + 2,
        type: "text",
        sender: "bot",
        text: `**Connection Error**  
I couldn't reach the server. Please check:

1. Backend server is running  
2. CORS is configured  
3. API endpoints are correct  

Current API: \`${API_BASE}\``,
        timestamp: new Date().toISOString(),
        isStreaming: true,
      };

      setMessages(prev => [...prev, errorMessage]);

      setTimeout(() => {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === errorMessage.id
              ? { ...msg, isStreaming: false }
              : msg
          )
        );
      }, 2000);

    } finally {
      setIsLoading(false);
    }
  };

  /* -------------------------------------------------------
     BASELINE RESET → NO TIMEFRAME SWITCHING
  ------------------------------------------------------- */
  const reloadChart = () => {
    console.log("Chart reload disabled in baseline mode.");
  };

  return (
    <div className="flex flex-col h-full">
      <ChatWindow
        messages={messages}
        isLoading={isLoading}
        messagesEndRef={messagesEndRef}
        inputHeight={inputHeight}
        onSend={(text, mode) => handleSend(text, mode)}
        onReloadChart={reloadChart}
      />

      <InputBar
        input={input}
        setInput={setInput}
        isLoading={isLoading}
        onSend={(e, mode) => {
          e.preventDefault();
          handleSend(input, mode);
        }}
        onHeightChange={setInputHeight}
      />
    </div>
  );
}

// app/chat/components/ChatWindow.tsx
"use client";

import { Bot } from "lucide-react";
import MessageBubble from "./MessageBubble";
import ChartBubble from "./ChartBubble";
import type { Message } from "../types/Message";

type Props = {
  messages: Message[];
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  inputHeight: number;

  // Updated: allow async + mode
  onSend: (text: string, mode: "general" | "dex") => Promise<void> | void;

  // Baseline: still required for chart bubble, but no switching
  onReloadChart: (
    msgId: number,
    coin: { id: string; name: string; symbol: string },
    timeframe: string
  ) => void;
};

export default function ChatWindow({
  messages,
  isLoading,
  messagesEndRef,
  inputHeight,
  onSend,
  onReloadChart,
}: Props) {
  return (
    <main
      className="flex-1 overflow-y-auto w-full"
      style={{ paddingBottom: inputHeight + 40 }}
    >
      <div className="mx-auto w-full max-w-[48rem] px-4 pt-8 space-y-8">
        
        {messages.map((msg) => {
          /* ---------------------------------------------
             CHART MESSAGE
          --------------------------------------------- */
          if (msg.type === "chart") {
            return (
              <ChartBubble
                key={msg.id}
                data={msg.data}
                coin={msg.coin}
                timeframe={msg.timeframe}
                isStreaming={msg.isStreaming}
                // Baseline: chart reload disabled, but prop required
                onReloadChart={(tf: string) =>
                  onReloadChart(msg.id, msg.coin, tf)
                }
              />
            );
          }

          /* ---------------------------------------------
             TEXT MESSAGE
          --------------------------------------------- */
          return (
            <MessageBubble
              key={msg.id}
              sender={msg.sender}
              text={msg.text}
              timestamp={msg.timestamp}
              isStreaming={msg.isStreaming}
            />
          );
        })}

        {/* ---------------------------------------------
            LOADING / THINKING INDICATOR
        --------------------------------------------- */}
        {isLoading && messages[messages.length - 1]?.sender !== "bot" && (
          <div className="flex items-start gap-4 w-full animate-fadeIn">
            <div className="flex-shrink-0 mt-1 opacity-90 p-1.5 bg-white/10 rounded-full">
              <Bot size={18} className="text-white" />
            </div>

            <div className="flex items-center gap-1 mt-2.5 ml-1">
              <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce"></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} className="h-4" />
      </div>
    </main>
  );
}

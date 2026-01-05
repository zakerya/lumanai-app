// frontend/app/chat/components/ChatWindow.tsx
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

  onSend: (text: string, mode: "general" | "dex") => Promise<void> | void;

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
      className="
        relative
        h-full
        w-full
        overflow-y-auto
        overflow-x-hidden
      "
    >
      {/* MESSAGE COLUMN */}
      <div 
        className="mx-auto w-full max-w-[48rem] px-4 pt-8 space-y-15"
        style={{
          paddingBottom: `${inputHeight + 40}px`, // enough space for input bar overlap
        }}
      >
        {messages.map((msg) => {
          if (msg.type === "chart") {
            return (
              <ChartBubble
                key={msg.id}
                data={msg.data}
                coin={msg.coin}
                timeframe={msg.timeframe}
                isStreaming={msg.isStreaming}
                onReloadChart={(tf: string) =>
                  onReloadChart(msg.id, msg.coin, tf)
                }
              />
            );
          }

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

        {isLoading && messages[messages.length - 1]?.sender !== "bot" && (
          <div className="flex items-start gap-4 w-full">
            <div className="flex-shrink-0 mt-1 p-1.5 bg-white/10 rounded-full">
              <Bot size={18} className="text-white" />
            </div>

            <div className="flex items-center gap-1 mt-2.5 ml-1">
              <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} className="h-4" />
      </div>
    </main>
  );
}

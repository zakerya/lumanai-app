// app/chat/types/Message.ts

export type TextMessage = {
  id: number;
  type: "text";
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  isStreaming?: boolean;
};

export type ChartMessage = {
  id: number;
  type: "chart";
  sender: "bot";
  coin: {
    id: string;
    name: string;
    symbol: string;
  };
  timeframe: string;
  data: {
    t: number;
    p: number;
  }[];
  timestamp: string;
  isStreaming?: boolean; // ⭐ added for fade animation + reload state
};

export type Message = TextMessage | ChartMessage;

// app/chat/components/MessageBubble.tsx
"use client";

import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw"; // ⭐ enables HTML inside markdown

type Props = {
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  isStreaming?: boolean; // kept for compatibility but unused
};

export default function MessageBubble({ sender, text, timestamp }: Props) {
  const isBot = sender === "bot";

  // Format timestamp
  let formattedTime = timestamp;
  const parsedDate = new Date(timestamp);
  if (!isNaN(parsedDate.getTime())) {
    const hours24 = parsedDate.getHours();
    const hours12 = ((hours24 + 11) % 12) + 1;
    const minutes = parsedDate.getMinutes().toString().padStart(2, "0");
    const ampm = hours24 >= 12 ? "PM" : "AM";
    formattedTime = `${hours12}:${minutes} ${ampm}`;
  }

  return (
    <div
      className={`flex items-start gap-4 w-full ${
        isBot ? "justify-start" : "justify-end"
      }`}
    >
      {/* BOT ICON */}
      {isBot && (
        <div className="flex-shrink-0 mt-1 opacity-90 p-1.5 bg-white/10 rounded-full">
          <Bot size={18} className="text-white" />
        </div>
      )}

      {/* MESSAGE BUBBLE */}
      <div
        className={`relative text-[15px] leading-relaxed ${
          isBot
            ? "w-full text-white pl-1 font-sans font-normal"
            : "max-w-[85%] bg-white text-black rounded-2xl rounded-tr-sm px-5 py-3 shadow-sm font-sans font-normal"
        }`}
      >
        {/* TEXT */}
        <div className={`${isBot ? "pr-0" : "pr-4"}`}>
          <ReactMarkdown
            rehypePlugins={[rehypeRaw]}
            allowedElements={[
              "div",
              "span",
              "p",
              "strong",
              "em",
              "ul",
              "li",
              "br",
              "code",
              "a"
            ]}
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              strong: ({ children }) => (
                <span className="font-bold">{children}</span>
              ),
              em: ({ children }) => (
                <span className="italic opacity-90">{children}</span>
              ),
              ul: ({ children }) => (
                <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>
              ),
              li: ({ children }) => <li className="break-words">{children}</li>,
              code: ({ children }) => {
                const value = String(children).trim();

                // Detect EVM or Solana address
                const isAddress =
                  /^0x[a-fA-F0-9]{40}$/.test(value) ||
                  /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);

                if (isAddress) {
                  return (
                    <span
                      onClick={() => navigator.clipboard.writeText(value)}
                      className="cursor-pointer underline decoration-dotted hover:text-white/70"
                    >
                      {value}
                    </span>
                  );
                }

                return (
                  <code className="bg-white/10 px-1 py-0.5 rounded">
                    {value}
                  </code>
                );
              },
              a: ({ href, children, ...props }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline transition-colors"
                  {...props}
                >
                  {children}
                </a>
              ),
            }}
          >
            {text}
          </ReactMarkdown>
        </div>

        {/* TIMESTAMP */}
        <div
          className={`text-[10px] mt-1 opacity-50 ${
            isBot ? "text-left" : "text-right"
          }`}
        >
          {formattedTime}
        </div>
      </div>

      {/* USER ICON */}
      {!isBot && (
        <div className="flex-shrink-0 mt-1 opacity-70">
          <User size={20} className="text-white" />
        </div>
      )}
    </div>
  );
}

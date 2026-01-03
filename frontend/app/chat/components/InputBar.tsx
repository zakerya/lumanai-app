// app/chat/components/InputBar.tsx
"use client";

import { Send } from "lucide-react";
import { useRef, useEffect, useState } from "react";

type Props = {
  input: string;
  setInput: (v: string) => void;
  isLoading: boolean;
  onSend: (e: React.FormEvent, mode: "general" | "dex") => void;
  onHeightChange?: (h: number) => void;
};

export default function InputBar({
  input,
  setInput,
  isLoading,
  onSend,
  onHeightChange,
}: Props) {
  const [mode, setMode] = useState<"general" | "dex">("general");
  const disabled = isLoading || !input.trim();

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  /* Auto‑resize textarea */
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "0px";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [input]);

  /* Report height to parent */
  useEffect(() => {
    if (containerRef.current && onHeightChange) {
      onHeightChange(containerRef.current.offsetHeight);
    }
  });

  /* Enter to send */
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled) {
        onSend(e as any, mode);
      }
    }
  };

  return (
    <form
      onSubmit={(e) => onSend(e, mode)}
      className="pointer-events-none fixed inset-x-0 bottom-10 flex justify-center px-4"
    >
      <div
        ref={containerRef}
        className="
          pointer-events-auto 
          w-full max-w-[48rem]
          rounded-2xl
          bg-white/10 
          backdrop-blur-xl 
          border border-white/20 
          shadow-[0_0_25px_rgba(255,255,255,0.08)]
        "
      >
        {/* MODE SWITCH */}
        <div className="flex gap-2 px-4 pt-3">
          <button
            type="button"
            onClick={() => setMode("general")}
            className={`
              px-3 py-1 text-xs rounded-md border transition
              ${
                mode === "general"
                  ? "bg-white text-black border-white"
                  : "bg-transparent text-white/70 border-white/20"
              }
            `}
          >
            GENERAL
          </button>

          <button
            type="button"
            onClick={() => setMode("dex")}
            className={`
              px-3 py-1 text-xs rounded-md border transition
              ${
                mode === "dex"
                  ? "bg-white text-black border-white"
                  : "bg-transparent text-white/70 border-white/20"
              }
            `}
          >
            DEX
          </button>
        </div>

        {/* INPUT + SEND */}
        <div className="flex items-center gap-3 px-4 pb-3 pt-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              mode === "general"
                ? "Ask anything about crypto..."
                : "Search DEX pairs like bonk/sol..."
            }
            rows={1}
            className="
              flex-1 
              bg-transparent 
              resize-none 
              overflow-hidden 
              border-none 
              outline-none 
              text-sm 
              text-white 
              placeholder:text-white/40
              leading-normal
              max-h-[160px]
            "
          />

          <button
            type="submit"
            disabled={disabled}
            className={`
              inline-flex items-center justify-center 
              h-9 w-9 
              rounded-full 
              transition 
              ${
                disabled
                  ? "bg-white/10 text-white/30 cursor-not-allowed"
                  : "bg-white text-black hover:bg-white/90"
              }
            `}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </form>
  );
}

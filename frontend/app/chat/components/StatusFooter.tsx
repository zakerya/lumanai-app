"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export default function StatusFooter({ onHeightChange }: { onHeightChange?: (h: number) => void }) {
  const pathname = usePathname();
  const show = pathname !== "/";
  const footerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (footerRef.current && onHeightChange) {
      onHeightChange(footerRef.current.offsetHeight);
    }
  });

  if (!show) return null;

  return (
    <div
      ref={footerRef}
      className="
        fixed right-5 top-1/2 -translate-y-1/2
        flex flex-col gap-4
        z-30 pointer-events-none
      "
    >
      {/* Google Gemini */}
      <div className="flex items-center justify-end gap-2 w-full">
        <div className="
          pointer-events-auto 
          flex items-center justify-center
          gap-1.75 px-3 py-1.5 rounded-full 
          border-2 border-green-700/60 bg-green-400/10
        ">
          <img 
            src="https://static.vecteezy.com/system/resources/previews/055/687/065/non_2x/gemini-google-icon-symbol-logo-free-png.png"
            alt="Google Gemini Logo"
            className="inline h-3 w-3 object-contain translate-y-px"
          />
          <span className="text-[12px] text-white/60 tracking-tight">Gemini 2.5 Flash</span>
        </div>

        <span className="status-dot h-1.5 w-1.5 rounded-full bg-green-400"></span>
      </div>


      {/* CoinGecko */}
      <div className="flex items-center justify-end gap-2 w-full">
        <div className="
          pointer-events-auto 
          flex items-center justify-center
          gap-1.75 px-3 py-1.5 rounded-full 
          border-2 border-red-600/70 bg-red-500/10
        ">
          <img 
            src="https://support.coingecko.com/hc/article_attachments/4499575478169"
            alt="CoinGecko Logo"
            className="inline h-3 w-3 object-contain translate-y-px"
          />
          <span className="text-[12px] text-white/60 tracking-tight">CoinGecko API</span>
        </div>

        <span className="status-dot h-1.5 w-1.5 rounded-full bg-red-500"></span>
      </div>


      {/* CryptoRank */}
      <div className="flex items-center justify-end gap-2 w-full">
        <div className="
          pointer-events-auto 
          flex items-center justify-center
          gap-1.75 px-3 py-1.5 rounded-full 
          border-2 border-green-700/60 bg-green-400/10
        ">
          <img 
            src="https://cryptorank.io/static/logo.png"
            alt="CryptoRank Logo"
            className="inline h-3 w-3 object-contain translate-y-px"
          />
          <span className="text-[12px] text-white/60 tracking-tight">CryptoRank API</span>
        </div>

        <span className="status-dot h-1.5 w-1.5 rounded-full bg-green-400"></span>
      </div>


      {/* DexScreener */}
      <div className="flex items-center justify-end gap-2 w-full">
        <div className="
          pointer-events-auto 
          flex items-center justify-center
          gap-1.75 px-3 py-1.5 rounded-full 
          border-2 border-green-700/60 bg-green-400/10
        ">
          <img 
            src="https://play-lh.googleusercontent.com/ewszj7zGWgTQCUEsf_kfEkrnEZEMmvBn0hnb5vWBHQU2Yfnf30ayTNT9KoYsaQPoQ3k"
            alt="DexScreener Logo"
            className="inline h-3 w-3 object-contain translate-y-px"
          />
          <span className="text-[12px] text-white/60 tracking-tight">DEXSCREENER API</span>
        </div>

        <span className="status-dot h-1.5 w-1.5 rounded-full bg-green-400"></span>
      </div>

    </div>
  );
}

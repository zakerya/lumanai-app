import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Luminai",
  description: "Your minimal, AI-powered crypto tutor.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white min-h-screen flex flex-col`}
      >
        {/* Main app content */}
        <div className="flex-1 flex flex-col">
          {children}
        </div>

        {/* Modern powered-by footer with LED-style status indicators */}
        <div className="pointer-events-none fixed inset-x-0 bottom-3 flex justify-center">
          <div className="flex items-center gap-4 text-[12px] text-white/60 tracking-tight">

            {/* Gemini Status */}
            <div className="flex items-center gap-1.5">
              <span className="status-dot h-1.5 w-1.5 rounded-full bg-green-400"></span>
              <span>Google Gemini 2.5</span>
            </div>

            <span className="text-white/30">•</span>

            {/* CoinGecko Status */}
            <div className="flex items-center gap-1.5">
              <span className="status-dot h-1.5 w-1.5 rounded-full bg-green-400"></span>
              <span>CoinGecko Market Data</span>
            </div>

            <span className="text-white/30">•</span>

            <div className="flex items-center gap-1.5">
              <span className="status-dot h-1.5 w-1.5 rounded-full bg-green-400"></span>
              <span>DEXSCREENER Market Data</span>
            </div>

          </div>
        </div>

      </body>
    </html>
  );
}

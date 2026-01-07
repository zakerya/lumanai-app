// frontend/app/waller-tracker/page.tsx

"use client";

import { useState } from "react";
import { 
  Wallet, 
  Search, 
  Loader2, 
  TrendingUp, 
  DollarSign, 
  Layers, 
  Activity, 
  Copy 
} from "lucide-react";
import PortfolioPieChart from "./PortfolioPieChart";

export default function WalletTrackerPage() {
  const [wallet, setWallet] = useState("");
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const startTracking = async () => {
    if (!wallet) return;

    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/moralis/full-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet }),
      });

      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Failed to fetch wallet data", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20 flex flex-col items-center">
      
      {/* BACKGROUND GLOW EFFECTS */}
      <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] bg-white/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-white/5 blur-[120px] rounded-full pointer-events-none" />

      <main className="w-full max-w-5xl px-6 py-20 z-10">
        
        {/* PAGE HEADER */}
        <div className="mb-12 text-center space-y-10">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-b text-white bg-clip-text text-transparent">
            Wallet Intelligence
          </h1>
          <p className="text-white text-lg max-w-2xl mx-auto">
            Deep dive into any Solana address. Reveal balances and token holdings in real-time.
          </p>
        </div>

        {/* INPUT SECTION */}
        <div className="w-full max-w-2xl mx-auto mb-16 relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-white/20 to-white/0 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative flex items-center bg-black/80 backdrop-blur-xl border-2 border-white/10 rounded-2xl p-2 shadow-2xl">
            <div className="pl-4 text-white/40">
              <Search className="w-5 h-5" />
            </div>
            <input
              className="flex-1 bg-transparent border-none text-white placeholder:text-white/30 px-4 py-4 text-lg focus:ring-0 outline-none"
              placeholder="Paste Solana address (e.g. 9x...A1)"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && startTracking()}
            />
            <button
              onClick={startTracking}
              disabled={isLoading || !wallet}
              className="mr-2 px-6 py-3 rounded-xl bg-white text-black font-semibold hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Fetching
                </>
              ) : (
                "Analyze"
              )}
            </button>
          </div>
        </div>

        {/* RESULTS AREA */}
        {!data && !isLoading && (
          <div className="text-center py-20 border-2 border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
            <Wallet className="w-12 h-12 text-white/40 mx-auto mb-4" />
            <p className="text-white/40 font-medium">Ready to analyze. Enter a wallet above.</p>
          </div>
        )}

        {data && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* KEY METRICS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Net Worth */}
              <div className="p-6 rounded-2xl bg-white/[0.03] border-2 border-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-2 text-white/50">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-sm font-medium uppercase tracking-wider">Net Worth</span>
                </div>
                <div className="text-3xl font-bold tracking-tight">
                  ${Number(data.portfolio?.totalValueUsd || 0).toLocaleString()}
                </div>
                <div className="text-sm text-white/40 mt-1">
                  Total Portfolio Value
                </div>
              </div>

              {/* Card 2: SOL Balance */}
              <div className="p-6 rounded-2xl bg-white/[0.03] border-2 border-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-2 text-white/50">
                  <img src="https://cryptologos.cc/logos/solana-sol-logo.png?v=024" className="w-4 h-4 grayscale opacity-70" alt="SOL" />
                  <span className="text-sm font-medium uppercase tracking-wider">SOL Balance</span>
                </div>
                <div className="text-3xl font-bold tracking-tight">
                  {(data.balance?.sol || 0).toLocaleString()} <span className="text-lg text-white/40">SOL</span>
                </div>
                <div className="text-sm text-white/40 mt-1">
                  ${Number(data.portfolio?.solValueUsd || 0).toLocaleString()} USD
                </div>
              </div>

               {/* Card 3: Token Count */}
               <div className="p-6 rounded-2xl bg-white/[0.03] border-2 border-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-2 text-white/50">
                  <Layers className="w-4 h-4" />
                  <span className="text-sm font-medium uppercase tracking-wider">Assets</span>
                </div>
                <div className="text-3xl font-bold tracking-tight">
                  {data.tokens?.length || 0}
                </div>
                <div className="text-sm text-white/40 mt-1">
                  Active Tokens Held
                </div>
              </div>
            </div>

            {/* PORTFOLIO PIE CHART */}
            <div className="p-6 rounded-3xl bg-white/[0.03] border-2 border-white/10 backdrop-blur-sm">
              <PortfolioPieChart 
                solValueUsd={data.portfolio?.solValueUsd}
                tokens={data.tokens}
              />
            </div>

            {/* TOKEN HOLDINGS LIST */}
            <div className="bg-white/[0.02] border-2 border-white/10 rounded-3xl overflow-hidden">
              <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-white/60" />
                  Token Holdings
                </h2>
                <span className="text-xs text-white/40 uppercase tracking-widest font-medium">Portfolio Breakdown</span>
              </div>
              
              <div className="divide-y divide-white/5">
                {data.tokens?.map((t: any, i: number) => (
                  <div key={i} className="group p-4 hover:bg-white/[0.03] transition flex items-center gap-4 sm:gap-6">
                    {/* Icon */}
                    <div className="relative">
                       <img
                        src={t.metadata?.image || t.logo || "https://placehold.co/100x100/333/FFF?text=?"}
                        alt={t.symbol}
                        className="w-12 h-12 rounded-full object-cover bg-neutral-900 border-2 border-white/10 group-hover:scale-105 transition"
                      />
                      <div className="absolute -bottom-1 -right-1 bg-neutral-900 text-[10px] font-bold px-1.5 py-0.5 rounded border-2 border-white/20 text-white/80">
                        {t.score}
                      </div>
                    </div>

                    {/* Name & Symbol */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <h3 className="font-semibold text-white truncate">{t.name}</h3>
                        <span className="text-sm text-white/40">{t.symbol}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/30 mt-0.5 font-mono">
                        <span>{t.mint.slice(0, 4)}...{t.mint.slice(-4)}</span>
                        <Copy className="w-3 h-3 hover:text-white cursor-pointer" />
                      </div>
                    </div>

                    {/* Price Info (Hidden on very small screens) */}
                    <div className="hidden sm:block text-right">
                      <div className="text-sm text-white/50">Price</div>
                      <div className="font-medium text-white/80">
                         ${t.priceUsd?.toFixed(6) || "0.00"}
                      </div>
                    </div>

                    {/* Balance Info */}
                    <div className="text-right min-w-[100px]">
                      <div className="font-bold text-lg">
                        ${t.valueUsd?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || "0"}
                      </div>
                      <div className="text-sm text-white/40">
                        {Number(t.amount).toLocaleString()} {t.symbol}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {(!data.tokens || data.tokens.length === 0) && (
                <div className="p-8 text-center text-white/40 italic">
                  No other tokens found in this wallet.
                </div>
              )}
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
"use client";

import React from "react";

// --- ICONS (Neutral/Monochrome) ---
const Icons = {
  Terminal: () => (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 17l6-6-6-6M12 19h8" /></svg>
  ),
  Database: () => (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.58 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.58 4 8 4s8-1.79 8-4M4 7c0-2.21 3.58-4 8-4s8 1.79 8 4m0 5c0 2.21-3.58 4-8 4s-8-1.79-8-4" /></svg>
  ),
  Cpu: () => (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
  ),
  Check: () => (
    // Changed stroke from green to white
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4 text-white"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
  ),
  Copy: () => (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
  )
};

export default function DocsPage() {
  return (
    // Using pure black per your request variable
    <div className="min-h-screen bg-black text-white flex relative selection:bg-white/20 selection:text-white">
      
      {/* BACKGROUND EFFECTS */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* White spotlight at top (Monochrome) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-white/5 blur-[120px] rounded-full opacity-40" />
        {/* Noise Pattern */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
      </div>

      {/* LEFT SIDEBAR */}
      <aside className="
        hidden lg:flex flex-col w-72 sticky top-0 h-screen z-10
        border-r border-white/10 bg-black/40 backdrop-blur-md
        pt-12 px-6
      ">
        <div className="mb-10 flex items-center space-x-3">
          {/* Logo Icon - White */}
          <div className="w-4 h-4 bg-white rounded-sm shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
          <span className="font-mono text-sm font-bold tracking-widest text-white">LUMINAI DOCS</span>
        </div>

        <h2 className="text-white/40 text-xs font-bold tracking-widest mb-6 uppercase pl-3">
          Core Modules
        </h2>

        <nav className="space-y-1">
          <SidebarLink href="#dexscreener" icon={<Icons.Terminal />} label="Dexscreener API" />
          <SidebarLink href="#cryptorank" icon={<Icons.Database />} label="CryptoRank API" />
          <SidebarLink href="#gemini" icon={<Icons.Cpu />} label="Gemini 2.5 Flash" />
        </nav>

        <div className="mt-auto mb-10 p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="text-xs font-semibold text-white/60 mb-2">SYSTEM STATUS</h4>
            <div className="flex items-center space-x-2 text-white text-sm">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                <span className="opacity-80">All Systems Operational</span>
            </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="relative z-10 flex-1 px-6 md:px-12 lg:px-20 py-20 space-y-24 max-w-7xl mx-auto">

        {/* PAGE HEADER */}
        <header className="border-b border-white/10 pb-12">
          
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white">
            Luminai Documentation
          </h1>
          
          <p className="text-neutral-400 mt-6 text-xl leading-relaxed max-w-3xl">
            Technical reference for the Luminai architecture. Understand the data pipelines, 
            API integrations, and LLM reasoning engine that power the platform.
          </p>
        </header>

        {/* SECTION: DEXSCREENER */}
        <Section id="dexscreener" title="Dexscreener Integration" description="Real-time token data, price movements, and liquidity analysis pipeline.">
          
          <div className="grid md:grid-cols-2 gap-10 mt-12">
            <div>
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-3">
                {/* Number Badge: Inverted (Black on White) for Contrast */}
                <span className="flex items-center justify-center w-6 h-6 rounded-sm bg-white text-black font-bold text-xs">1</span>
                Fetching Data
              </h3>
              <p className="text-neutral-400 mb-6 text-sm leading-6">
                We use a proxied backend route to sanitize requests and cache results. 
                This prevents rate-limiting on the client side and hides upstream API mechanics.
              </p>
              
              <FeatureList items={[
                "Server-side caching (Redis)",
                "Response normalization",
                "API Key protection"
              ]} />
            </div>

            <CodeBlock 
              filename="/api/dexscreener/[address]/route.ts"
              code={`export async function GET(req, { params }) {
  const { address } = params;
  
  // 1. Construct upstream URL
  const url = \`https://api.dexscreener.com/latest/dex/tokens/\${address}\`;

  // 2. Fetch with revalidation
  const res = await fetch(url, { next: { revalidate: 60 } });
  const data = await res.json();

  return Response.json(data);
}`} 
            />
          </div>

          <div className="mt-10 pt-10 border-t border-white/10">
            <h3 className="text-lg font-medium text-white mb-6">Usage Examples</h3>
            <div className="grid md:grid-cols-2 gap-4">
               <PromptCard text="Check price of SOL" />
               <PromptCard text="Show me liquidity for BONK" />
            </div>
          </div>
        </Section>

        {/* SECTION: CRYPTORANK */}
        <Section id="cryptorank" title="CryptoRank Integration" description="Deep market metrics, historical data, and ecosystem insights.">
          <div className="grid md:grid-cols-2 gap-10 mt-12">
            <div className="order-2 md:order-1">
                 <CodeBlock 
                  filename="/api/cryptorank/[id]/route.ts"
                  code={`const url = \`https://api.cryptorank.io/v1/currencies/\${id}?api_key=\${process.env.CR_KEY}\`;

const res = await fetch(url);
const metrics = await res.json();

// Extract only needed fields
return Response.json({
  mcap: metrics.marketCap,
  fdv: metrics.fullyDilutedValuation,
  ath: metrics.athPrice
});`} 
                />
            </div>
            
            <div className="order-1 md:order-2">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-sm bg-white text-black font-bold text-xs">2</span>
                Data Enrichment
              </h3>
              <p className="text-neutral-400 mb-6 text-sm leading-6">
                CryptoRank is used when Dexscreener data is insufficient, specifically for 
                macro-market data like FDV ratios and All-Time Highs.
              </p>
               <FeatureList items={[
                "Market Cap & FDV",
                "Token Supply Schedules",
                "ATH / ATL deltas"
              ]} />
            </div>
          </div>
        </Section>

        {/* SECTION: GEMINI */}
        <Section id="gemini" title="Gemini 2.5 Flash Engine" description="The reasoning core that synthesizes market data into natural language.">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
             <StepCard 
                step="01" 
                title="Intent Detection" 
                desc="Classifies if user wants price, analysis, or comparison." 
             />
             <StepCard 
                step="02" 
                title="Data Retrieval" 
                desc="Orchestrates calls to Dexscreener/CryptoRank in parallel." 
             />
             <StepCard 
                step="03" 
                title="Synthesis" 
                desc="Injects JSON data into System Prompt for final output." 
             />
          </div>

          <div className="mt-12 bg-white/5 border border-white/10 rounded-xl p-8 relative overflow-hidden group">
            {/* Subtle top right indicator */}
            <div className="absolute top-0 right-0 p-4">
                <div className="text-[10px] text-white/60 font-mono border border-white/20 px-2 py-1 rounded bg-black/40">SYSTEM_PROMPT_V1</div>
            </div>
            <h3 className="text-lg font-medium text-white mb-6">System Prompt Architecture</h3>
            <ul className="space-y-4 text-neutral-400 text-sm">
                <li className="flex items-start gap-3">
                    <span className="text-white mt-1">▹</span>
                    <span><strong className="text-white">Persona:</strong> Expert crypto analyst, concise, data-driven.</span>
                </li>
                <li className="flex items-start gap-3">
                    <span className="text-white mt-1">▹</span>
                    <span><strong className="text-white">Constraints:</strong> Never hallucinate prices. Always cite sources. Format currency as USD.</span>
                </li>
            </ul>
          </div>
        </Section>

        {/* FOOTER */}
        <footer className="pt-24 pb-12 text-center border-t border-white/10 mt-20">
            <p className="text-white/30 text-sm">© 2024 Luminai Documentation. Built with Next.js & Tailwind.</p>
        </footer>

      </main>
    </div>
  );
}

// --- SUBCOMPONENTS (UPDATED FOR MONOCHROME) ---

function SidebarLink({ href, icon, label }: { href: string, icon: React.ReactNode, label: string }) {
  return (
    <a href={href} className="group flex items-center space-x-3 px-3 py-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all duration-200">
      <span className="group-hover:text-white transition-colors opacity-70 group-hover:opacity-100">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </a>
  );
}

function Section({ id, title, description, children }: { id: string, title: string, description: string, children: React.ReactNode }) {
    return (
        <section id={id} className="scroll-mt-32">
            <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-8 md:p-10 relative overflow-hidden group hover:border-white/20 transition-colors duration-500">
               {/* Hover Glow - White */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/10 transition duration-700 pointer-events-none" />
               
               <div className="relative z-10">
                    <h2 className="text-3xl font-semibold text-white mb-2">{title}</h2>
                    <p className="text-neutral-400 text-lg mb-8 max-w-2xl">{description}</p>
                    {children}
               </div>
            </div>
        </section>
    )
}

function CodeBlock({ filename, code }: { filename: string, code: string }) {
    return (
        <div className="rounded-xl overflow-hidden bg-black border border-white/10 shadow-2xl group">
            <div className="bg-white/5 border-b border-white/5 px-4 py-2 flex justify-between items-center">
                <span className="text-xs text-white/40 font-mono">{filename}</span>
                <button className="text-white/20 hover:text-white transition"><Icons.Copy /></button>
            </div>
            {/* Monochromatic Syntax Highlight (Grays) */}
            <pre className="p-4 overflow-x-auto text-sm font-mono text-neutral-300 leading-relaxed">
                <code>{code}</code>
            </pre>
        </div>
    )
}

function FeatureList({ items }: { items: string[] }) {
    return (
        <ul className="space-y-3">
            {items.map((item, i) => (
                <li key={i} className="flex items-center space-x-3 text-sm text-neutral-300">
                    {/* White Check Circle */}
                    <div className="p-0.5 rounded-full bg-white/10 border border-white/20">
                        <Icons.Check />
                    </div>
                    <span>{item}</span>
                </li>
            ))}
        </ul>
    )
}

function PromptCard({ text }: { text: string }) {
    return (
        <div className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 transition-all cursor-default p-4 rounded-lg flex items-center justify-between group">
            <code className="text-sm text-white/80 group-hover:text-white">"{text}"</code>
        </div>
    )
}

function StepCard({ step, title, desc }: { step: string, title: string, desc: string }) {
    return (
        <div className="bg-white/5 p-6 rounded-xl border border-white/5 flex flex-col h-full relative overflow-hidden group hover:border-white/20 transition-colors">
            {/* Big number in background */}
            <div className="text-6xl font-bold text-white/[0.02] absolute -top-2 -right-2 font-sans group-hover:text-white/[0.05] transition-colors">{step}</div>
            <div className="text-white text-xs font-mono mb-3 tracking-widest uppercase opacity-60">Step {step}</div>
            <h4 className="text-white font-medium mb-2">{title}</h4>
            <p className="text-neutral-400 text-sm leading-relaxed">{desc}</p>
        </div>
    )
}
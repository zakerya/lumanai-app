"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { 
  ArrowUpRight, 
  BrainCircuit, 
  LineChart, 
  ScanSearch, 
  CheckCircle2, 
  Search,
  Zap
} from "lucide-react";

type Particle = {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
};

export default function Home() {
  const [scrollY, setScrollY] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  // Removed unused state currentTestimonial to clean up code since it wasn't being rendered
  const hasInitializedParticles = useRef(false);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const tiltRef = useRef<HTMLDivElement | null>(null);

  // Scroll-based parallax
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY || 0);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Floating spark particles
  useEffect(() => {
    if (hasInitializedParticles.current) return;
    hasInitializedParticles.current = true;

    const count = 45;
    const newParticles: Particle[] = Array.from({ length: count }).map(
      (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 2 + Math.random() * 3,
        delay: Math.random() * 4,
        duration: 5 + Math.random() * 6,
        opacity: 0.15 + Math.random() * 0.35,
      })
    );

    setParticles(newParticles);
  }, []);

  // Simple 3D tilt on hero card
  useEffect(() => {
    const el = tiltRef.current;
    if (!el) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const midX = rect.width / 2;
      const midY = rect.height / 2;

      const rotateX = ((y - midY) / midY) * -6;
      const rotateY = ((x - midX) / midX) * 6;

      el.style.transform = `
        perspective(900px)
        rotateX(${rotateX}deg)
        rotateY(${rotateY}deg)
        translateY(-4px)
      `;
    };

    const handleMouseLeave = () => {
      el.style.transform =
        "perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0)";
    };

    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  // Fade-in sections on scroll
  useEffect(() => {
    const elements = document.querySelectorAll(".fade-in");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("opacity-100", "translate-y-0");
          }
        });
      },
      { threshold: 0.15 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Parallax factors
  const heroParallax = scrollY * 0.15;
  const particlesParallax = scrollY * 0.08;
  const glowParallax = scrollY * 0.12;

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden font-sans selection:bg-white/20">
      {/* BACKGROUND GLOWS */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute top-[-260px] left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-white/5 blur-[180px] rounded-full"
          style={{
            transform: `translate3d(-50%, ${glowParallax * 0.4}px, 0)`,
          }}
        />
        <div
          className="absolute bottom-[-320px] right-[10%] w-[720px] h-[720px] bg-white/4 blur-[160px] rounded-full"
          style={{
            transform: `translate3d(0, ${glowParallax * -0.3}px, 0)`,
          }}
        />
      </div>

      {/* BACKGROUND VERY-SUBTLE GRID */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.04]">
        <div className="w-full h-full bg-[radial-gradient(circle_at_top,_#ffffff22,_transparent_60%),repeating-linear-gradient(to_right,_#ffffff10_0,_#ffffff10_1px,_transparent_1px,_transparent_20px),repeating-linear-gradient(to_bottom,_#ffffff10_0,_#ffffff10_1px,_transparent_1px,_transparent_20px)]" />
      </div>

      {/* FLOATING SPARK PARTICLES */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          transform: `translate3d(0, ${particlesParallax * -0.25}px, 0)`,
        }}
      >
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full bg-white"
            style={{
              left: `${p.x}vw`,
              top: `${p.y}vh`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              opacity: p.opacity,
              boxShadow: "0 0 10px rgba(255,255,255,0.6)",
              animation: `sparkFloat ${p.duration}s linear ${p.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* DARK GLASS NAVBAR */}
      <header className="sticky top-0 z-30">
        <div className="backdrop-blur-xl bg-black/60 border-b border-white/10">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shadow-[0_0_16px_rgba(255,255,255,0.15)]">
                <span className="text-[11px] font-semibold tracking-tight">
                  L
                </span>
              </div>
              <span className="text-sm font-medium tracking-tight text-white/80">
                Luminai
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-white/50">
              <Link
                href="/chat"
                className="flex items-center gap-2 rounded-xl bg-white text-black px-4 py-2 text-xs font-bold tracking-tight hover:bg-white/90 transition shadow-[0_0_18px_rgba(255,255,255,0.35)]"
              >
                Luminai Chat <ArrowUpRight size={14} />
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="relative z-10">
        {/* HERO SECTION */}
        <section
          ref={heroRef}
          className="px-6 pt-20 pb-28 md:pt-24 md:pb-32 fade-in opacity-0 translate-y-10 transition-all duration-700"
          style={{
            transform: `translate3d(0, ${heroParallax * -0.3}px, 0)`,
          }}
        >
          <div className="mx-auto flex max-w-6xl flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/60 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-white/70 shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
              <span>Crypto‑Native AI</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-semibold leading-tight tracking-tight text-white">
              Understand the market
              <span className="block text-white/70">before everyone else.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-sm md:text-base text-white/60 leading-relaxed">
              Luminai turns raw crypto data into clear, actionable insight.
              Ask naturally — get real‑time prices, trends, and explanations
              rendered in a clean, premium interface.
            </p>
          </div>
        </section>

        {/* ANIMATED SVG LINES */}
        <section
          className="relative overflow-hidden py-24 fade-in opacity-0 translate-y-10 transition-all duration-700"
          style={{ transform: `translate3d(0, ${scrollY * -0.1}px, 0)` }}
        >
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.18]"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
            <defs>
              <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="white" stopOpacity="0.0" />
                <stop offset="50%" stopColor="white" stopOpacity="0.45" />
                <stop offset="100%" stopColor="white" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            {[...Array(7)].map((_, i) => (
              <path
                key={i}
                d={`M0 ${10 + i * 12} Q 50 ${5 + i * 12}, 100 ${10 + i * 12}`}
                stroke="url(#lineGrad)"
                strokeWidth="0.1"
                fill="none"
                style={{
                  animation: `lineFlow 8s ease-in-out ${i * 0.3}s infinite`,
                }}
              />
            ))}
          </svg>

          <div className="relative z-10 mx-auto max-w-4xl text-center px-6">
            <h2 className="text-3xl md:text-4xl font-semibold text-white">
              Built for clarity. Designed for speed.
            </h2>
            <p className="mt-4 text-white/60 text-sm md:text-base leading-relaxed">
              Luminai transforms raw crypto data into clean, structured insight.
              No noise. No clutter. Just the information you need — instantly.
            </p>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section className="relative z-10 px-6 pt-16 pb-24 fade-in opacity-0 translate-y-10 transition-all duration-700">
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: "Real‑Time Prices",
                  desc: "Live crypto prices with premium formatting and clean visuals.",
                },
                {
                  title: "Smart Coin Detection",
                  desc: "Ask naturally — Luminai understands symbols, names, and context.",
                },
                {
                  title: "Market Overview",
                  desc: "Instant global market cap, volume, and BTC dominance.",
                },
                {
                  title: "AI‑Powered Chat",
                  desc: "Ask anything — Luminai responds with clarity and precision.",
                },
                {
                  title: "Fast & Reliable",
                  desc: "Optimized backend with caching and retry logic for stability.",
                },
                {
                  title: "Beautiful UI Output",
                  desc: "Premium HTML formatting for prices, charts, and insights.",
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="group p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="h-8 w-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center mb-4 group-hover:bg-white/20 transition-colors">
                    <span className="text-xs font-semibold">{index + 1}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-white/60 text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- NEW DEEP DIVE SECTIONS --- */}
        
        {/* 1. EDUCATIONAL AI */}
        <section className="relative z-10 px-6 py-24 border-t border-white/5 fade-in opacity-0 translate-y-10 transition-all duration-700">
          <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center gap-12 lg:gap-20">
            {/* Left: Content */}
            <div className="flex-1 space-y-6 text-center md:text-left">
              <div className="inline-flex items-center justify-center md:justify-start gap-2 text-blue-300 mb-2">
                <BrainCircuit className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-widest text-white/50">Gemini 2.5 Flash</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white">
                Crypto concepts, <br />
                <span className="text-white/50">simplified for humans.</span>
              </h2>
              <p className="text-white/60 leading-relaxed max-w-lg mx-auto md:mx-0">
                Stop drowning in jargon. Luminai uses the advanced Gemini 2.5 Flash model to break down complex topics like Staking, DeFi, and Yield Farming into plain English. 
              </p>
              <ul className="space-y-3 text-sm text-white/70 inline-block text-left">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-white/40" />
                  <span>Beginner-friendly explanations</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-white/40" />
                  <span>Context-aware responses</span>
                </li>
              </ul>
            </div>

            {/* Right: Visual Mockup */}
            <div className="flex-1 w-full max-w-md">
              <div 
                ref={tiltRef} // Reusing the tilt ref here for effect
                className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-black/40 backdrop-blur-xl p-6 shadow-2xl"
              >
                {/* Mock Chat UI */}
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <div className="rounded-2xl rounded-tr-sm bg-white text-black px-4 py-3 text-sm font-medium shadow-lg max-w-[85%]">
                      Explain Impermanent Loss like I'm 5.
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-tl-sm bg-white/10 border border-white/5 text-white/90 px-4 py-3 text-sm leading-relaxed max-w-[95%]">
                      <div className="flex items-center gap-2 mb-2 text-white/40 text-[10px] uppercase font-bold tracking-wider">
                        <Zap size={10} /> Luminai AI
                      </div>
                      Imagine you have a basket of apples and oranges. If the price of apples goes up, people trade their oranges for your apples. You end up with fewer apples...
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. MARKET DATA */}
        <section className="relative z-10 px-6 py-24 border-t border-white/5 bg-white/[0.02] fade-in opacity-0 translate-y-10 transition-all duration-700">
          <div className="mx-auto max-w-6xl flex flex-col md:flex-row-reverse items-center gap-12 lg:gap-20">
            {/* Right: Content */}
            <div className="flex-1 space-y-6 text-center md:text-left">
              <div className="inline-flex items-center justify-center md:justify-start gap-2 text-green-300 mb-2">
                <LineChart className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-widest text-white/50">CryptoRank API</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white">
                Deep market <br />
                <span className="text-white/50">intelligence live.</span>
              </h2>
              <p className="text-white/60 leading-relaxed max-w-lg mx-auto md:mx-0">
                Don't settle for delayed data. Luminai connects directly to CryptoRank to fetch real-time stats. From market cap to circulating supply, get the numbers that move the market instantly.
              </p>
            </div>

            {/* Left: Visual Mockup */}
            <div className="flex-1 w-full max-w-md">
              <div className="grid grid-cols-2 gap-3">
                {/* Card 1 */}
                <div className="col-span-2 p-5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-between">
                  <div>
                    <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Bitcoin Price</div>
                    <div className="text-2xl font-mono font-medium">$96,420.50</div>
                  </div>
                  <div className="text-green-400 bg-green-400/10 px-2 py-1 rounded text-xs font-bold">+4.2%</div>
                </div>
                {/* Card 2 */}
                <div className="p-5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md">
                  <div className="text-xs text-white/40 uppercase tracking-wider mb-1">24h Vol</div>
                  <div className="text-lg font-mono text-white/80">$42.8B</div>
                </div>
                {/* Card 3 */}
                <div className="p-5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md">
                  <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Dominance</div>
                  <div className="text-lg font-mono text-white/80">54.2%</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. MEMECOIN / ON-CHAIN */}
        <section className="relative z-10 px-6 py-24 border-t border-white/5 fade-in opacity-0 translate-y-10 transition-all duration-700">
           <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center gap-12 lg:gap-20">
            {/* Left: Content */}
            <div className="flex-1 space-y-6 text-center md:text-left">
              <div className="inline-flex items-center justify-center md:justify-start gap-2 text-purple-300 mb-2">
                <ScanSearch className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-widest text-white/50">DexScreener</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white">
                Catch the 100x <br />
                <span className="text-white/50">before it trends.</span>
              </h2>
              <p className="text-white/60 leading-relaxed max-w-lg mx-auto md:mx-0">
                Missed the last pump? Never again. Paste any contract address—from any chain—and get an instant audit. Luminai unifies DexScreener and block explorers to spot liquidity locks and honeypots instantly.
              </p>
            </div>

            {/* Right: Visual Mockup */}
            <div className="flex-1 w-full max-w-md">
              <div className="relative rounded-xl border border-white/10 bg-[#0A0A0A] overflow-hidden p-1">
                 {/* Fake Search Bar */}
                 <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-white/5">
                    <Search size={14} className="text-white/40"/>
                    <div className="text-xs text-white/30 font-mono">0x7d1...2a9 (Scan)</div>
                 </div>
                 {/* Results */}
                 <div className="p-6 space-y-4">
                    <div className="flex items-start gap-4">
                       <div className="w-10 h-10 rounded bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">
                          PEPE
                       </div>
                       <div>
                          <div className="text-sm font-bold text-white">Pepe Coin</div>
                          <div className="text-xs text-white/50 mt-1">Pair created: 14 mins ago</div>
                       </div>
                    </div>
                    <div className="h-px w-full bg-white/5" />
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <div className="text-[10px] uppercase text-white/30">Liquidity</div>
                          <div className="text-xs text-green-400 font-mono mt-1">LOCKED 🔒</div>
                       </div>
                       <div>
                          <div className="text-[10px] uppercase text-white/30">Honeypot</div>
                          <div className="text-xs text-green-400 font-mono mt-1">NO ✅</div>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="px-6 py-24 fade-in opacity-0 translate-y-10 transition-all duration-700 border-t border-white/5">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/60 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
              <span>Ready to get started?</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-6">
              Start chatting with Luminai today
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto mb-8">
              Join thousands of crypto users who use Luminai to stay ahead of the market.
              No sign-up required.
            </p>
            <Link
              href="/chat"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-8 py-4 text-sm font-bold text-black hover:bg-white/90 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)]"
            >
              Luminai Chat Interface
              <span>→</span>
            </Link>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                <span className="text-xs font-semibold">L</span>
              </div>
              <div>
                <span className="font-medium">Luminai</span>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-white text-xs">
                © {new Date().getFullYear()} Luminai. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* GLOBAL STYLES */}
      <style jsx global>{`
        @keyframes sparkFloat {
          0% {
            transform: translate3d(0, 0, 0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translate3d(-20px, -80px, 0);
            opacity: 0;
          }
        }
        
        @keyframes lineFlow {
          0% {
            stroke-dasharray: 0 100;
            stroke-dashoffset: 0;
          }
          50% {
            stroke-dasharray: 100 100;
            stroke-dashoffset: -50;
          }
          100% {
            stroke-dasharray: 0 100;
            stroke-dashoffset: -100;
          }
        }
        
        .fade-in {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.7s ease-out, transform 0.7s ease-out;
        }
        
        .fade-in.opacity-100 {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}
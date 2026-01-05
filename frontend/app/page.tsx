"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";

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
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const hasInitializedParticles = useRef(false);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const tiltRef = useRef<HTMLDivElement | null>(null);
  const testimonialRef = useRef<HTMLDivElement | null>(null);

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

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
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
      { threshold: 0.2 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Parallax factors
  const heroParallax = scrollY * 0.15;
  const particlesParallax = scrollY * 0.08;
  const glowParallax = scrollY * 0.12;

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
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
                className="flex items-center gap-1 rounded-lg bg-white text-black px-4 py-2 text-xs font-semibold tracking-tight hover:bg-white/90 transition shadow-[0_0_18px_rgba(255,255,255,0.35)]"
              >
                Luminai Chat <ArrowUpRight className="text-[14px]" />
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

            {/* HERO ACTION CARD WITH 3D TILT */}
            <div
              ref={tiltRef}
              className="mt-10 w-full max-w-xl rounded-2xl border border-white/15 bg-white/5 px-5 py-5 shadow-[0_18px_60px_rgba(0,0,0,0.8)] transition-transform duration-300 will-change-transform"
            >
              <div className="flex flex-col items-stretch gap-4 md:flex-row md:items-center md:justify-between">
                <div className="text-left">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/40 mb-1">
                    Live crypto assistant
                  </div>
                  <div className="text-sm md:text-base font-medium text-white/90">
                    "What&apos;s happening with BTC, ETH and SOL today?"
                  </div>
                  <div className="mt-2 text-[11px] text-white/45">
                    Luminai responds with live prices, clean visuals, and
                    market context in seconds.
                  </div>
                </div>

                <div className="flex flex-col items-stretch gap-2 md:items-end">
                  <Link
                    href="/chat"
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-lg bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-black hover:bg-white/95 transition shadow-[0_0_22px_rgba(255,255,255,0.5)]"
                  >
                    Start chatting
                  </Link>
                  <span className="text-[10px] text-white/40">
                    No sign‑up • Just start typing
                  </span>
                </div>
              </div>
            </div>
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
        <section className="relative z-10 px-6 py-24 fade-in opacity-0 translate-y-10 transition-all duration-700">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
                Everything you need in one place
              </h2>
              <p className="text-white/60 max-w-2xl mx-auto">
                Comprehensive tools for modern crypto analysis
              </p>
            </div>
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

        {/* PRICING SECTION */}
        <section className="relative z-10 px-6 py-24 fade-in opacity-0 translate-y-10 transition-all duration-700">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
                Simple, transparent pricing
              </h2>
              <p className="text-white/60 max-w-2xl mx-auto">
                Choose the plan that fits your needs
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-white">Free</h3>
                  <p className="text-white/60 text-sm mt-1">
                    Perfect for getting started
                  </p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">$0</span>
                  <span className="text-white/60 ml-2">/ month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {[
                    "Live crypto prices",
                    "Basic market overview",
                    "Smart coin detection",
                    "Clean formatted responses",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center text-white/70">
                      <span className="mr-2">✓</span>
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/chat"
                  className="block w-full text-center py-3 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
                >
                  Get Started
                </Link>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 px-4 py-1 bg-white/20 text-xs font-semibold rounded-bl-lg">
                  POPULAR
                </div>
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-white">Pro</h3>
                  <p className="text-white/60 text-sm mt-1">
                    For traders and power users
                  </p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">$12</span>
                  <span className="text-white/60 ml-2">/ month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {[
                    "Everything in Free",
                    "Full market analytics",
                    "Multi‑coin comparisons",
                    "Priority API routing",
                    "Advanced insights",
                    "Custom alerts",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center text-white/70">
                      <span className="mr-2">✓</span>
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/chat"
                  className="block w-full text-center py-3 rounded-lg bg-white text-black hover:bg-white/90 transition-colors font-semibold"
                >
                  Upgrade to Pro
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="relative z-10 px-6 py-24 fade-in opacity-0 translate-y-10 transition-all duration-700">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
                Trusted by crypto users
              </h2>
              <p className="text-white/60">
                See what our users have to say
              </p>
            </div>
            <div className="relative h-64 overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
              <div
                className="absolute inset-0 flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentTestimonial * 100}%)` }}
              >
                {[
                  {
                    quote: "Luminai is the first AI that actually understands crypto. Prices, trends, context — all clean and instant.",
                    author: "Alex Chen",
                    role: "Day Trader",
                  },
                  {
                    quote: "The formatting alone is worth it. I get clean price blocks and insights without digging through charts.",
                    author: "Sarah Johnson",
                    role: "Crypto Analyst",
                  },
                  {
                    quote: "Feels like having a crypto researcher on demand. Fast, accurate, and beautifully designed.",
                    author: "Marcus Rivera",
                    role: "Portfolio Manager",
                  },
                ].map((testimonial, index) => (
                  <div
                    key={index}
                    className="w-full h-full flex-shrink-0 flex items-center justify-center p-8"
                  >
                    <div className="text-center max-w-2xl">
                      <p className="text-lg md:text-xl text-white/80 italic mb-6">
                        "{testimonial.quote}"
                      </p>
                      <div>
                        <p className="font-semibold text-white">{testimonial.author}</p>
                        <p className="text-white/60 text-sm">{testimonial.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {[0, 1, 2].map((i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentTestimonial(i)}
                    className={`h-2 rounded-full transition-all ${
                      currentTestimonial === i
                        ? "w-8 bg-white"
                        : "w-2 bg-white/30"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="px-6 py-24 fade-in opacity-0 translate-y-10 transition-all duration-700">
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
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-8 py-4 text-sm font-semibold text-black hover:bg-white/90 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)]"
            >
              Open Chat Interface
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
                <span className="text-xs font-semibold">Lu</span>
              </div>
              <div>
                <span className="font-medium">Luminai</span>
                <p className="text-white/60 text-xs mt-1">
                  Crypto‑native AI companion
                </p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-white/40 text-xs">
                © {new Date().getFullYear()} Luminai. All rights reserved.
              </p>
              <p className="text-white/30 text-xs mt-1">
                Built for realtime crypto understanding
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
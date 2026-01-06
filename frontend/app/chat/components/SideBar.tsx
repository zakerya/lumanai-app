"use client";

import React, { useState, useEffect } from "react";
import { ChevronRight, ChevronLeft, ArrowUpRight } from "lucide-react";
import Link from "next/link";

/* ---------------------------------------------
   SIDEBAR ITEM (internal component)
---------------------------------------------- */
function SidebarItem({
  icon,
  label,
  rightIcon,
  active = false,
  delay = 0,
  className = "",
}: {
  icon?: React.ReactNode;
  label: React.ReactNode;
  rightIcon?: React.ReactNode;
  active?: boolean;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer
        transition-all duration-300 ease-out
        hover:translate-x-1 hover:scale-[1.02] active:scale-[0.98]
        animate-stagger
        ${className}
      `}
      style={{ animationDelay: `${delay}ms` }}
    >
    <div className="flex items-center gap-3">
      {icon}
      <span className="text-sm font-medium tracking-wide">{label}</span>
    </div>

    {rightIcon && (
      <div className="flex items-center ml-auto">
        {rightIcon}
      </div>
    )}
    </div>
  );
}

/* ---------------------------------------------
   FULL SIDEBAR COMPONENT
---------------------------------------------- */
export default function SideBar() {
  const [open, setOpen] = useState(false);
  const [showItems, setShowItems] = useState(false);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => setShowItems(true), 50);
      return () => clearTimeout(timer);
    } else {
      setShowItems(false);
    }
  }, [open]);

  return (
    <>
      {/* SIDEBAR TOGGLE BUTTON */}
      <button
        onClick={() => setOpen(!open)}
        className="
          fixed top-1/2 -translate-y-1/2 left-4 z-50
          h-12 w-12 rounded-xl
          bg-white/10 backdrop-blur-xl border-2 border-white/20
          flex items-center justify-center
          transition-all duration-300 ease-out
          hover:bg-white/20 hover:scale-105 active:scale-95
        "
      >
        {open ? (
          <ChevronLeft size={22} className="text-white/80" />
        ) : (
          <ChevronRight size={22} className="text-white/80" />
        )}
      </button>

      {/* FLOATING SIDEBAR PANEL */}
      <aside
        className="
          fixed top-1/2 -translate-y-1/2 left-20 z-40
          w-56 pointer-events-none
        "
      >
        <div
          className={`
            bg-white/5 backdrop-blur-xl border-2 border-white/20
            rounded-2xl shadow-xl flex flex-col origin-left pointer-events-auto
            ${open ? "animate-slideIn" : "animate-slideOut"}
          `}
        >
          {showItems && (
            <nav className="flex flex-col gap-2 px-3 py-4 animate-fadeIn">
              <SidebarItem icon={null} label={<>Price Converter <br /><code className="text-white">(Coming Soon)</code></>} className="bg-red-500/20 border-2 border-red-600/70 rounded-xl"/>
              <SidebarItem icon={null} label={<>CoinScan <br /><code className="text-white">(Coming Soon)</code></>} className="bg-red-500/20 border-2 border-red-600/70 rounded-xl"/>
              <SidebarItem icon={null} label={<>Wallet Tracker <br /><code className="text-white">(Coming Soon)</code></>} className="bg-red-500/20 border-2 border-red-600/70 rounded-xl"/>
              <Link href="/docs">
                <SidebarItem 
                  label={<>Docs <code className="text-white">(NEW)</code></>} 
                  rightIcon={<ArrowUpRight size={24} className="text-green-400" />} 
                  className="bg-green-400/20 border-2 border-green-700/60 rounded-xl"
                />
              </Link>
            </nav>
          )}
        </div>
      </aside>
    </>
  );
}

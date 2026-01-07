"use client";

import { useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

interface TokenEntry {
  symbol: string;
  valueUsd: number;
}

interface PortfolioPieChartProps {
  solValueUsd: number;
  tokens: TokenEntry[];
}

// A curated palette that looks good on dark backgrounds
const CHART_COLORS = [
  "#10b981", // Emerald (SOL)
  "#3b82f6", // Blue
  "#8b5cf6", // Violet
  "#f43f5e", // Rose
  "#f59e0b", // Amber
  "#06b6d4", // Cyan
  "#3f3f46", // Zinc (for 'Others')
];

export default function PortfolioPieChart({
  solValueUsd,
  tokens,
}: PortfolioPieChartProps) {
  
  // Process data: Sort by value, take top 5, group rest into "Others"
  const { chartData, displayData, totalValue } = useMemo(() => {
    // 1. Combine SOL + Tokens into one array
    const allAssets = [
      { symbol: "SOL", valueUsd: solValueUsd },
      ...tokens.map((t) => ({ symbol: t.symbol, valueUsd: t.valueUsd })),
    ];

    // 2. Calculate Total
    const total = allAssets.reduce((acc, curr) => acc + curr.valueUsd, 0);

    // 3. Sort descending
    const sortedAssets = allAssets.sort((a, b) => b.valueUsd - a.valueUsd);

    // 4. Group small assets if we have more than 5
    let finalAssets = sortedAssets;
    if (sortedAssets.length > 5) {
      const top5 = sortedAssets.slice(0, 5);
      const others = sortedAssets.slice(5);
      const othersValue = others.reduce((acc, curr) => acc + curr.valueUsd, 0);
      
      finalAssets = [...top5, { symbol: "Others", valueUsd: othersValue }];
    }

    // 5. Format for Chart.js
    const data = {
      labels: finalAssets.map((a) => a.symbol),
      datasets: [
        {
          data: finalAssets.map((a) => a.valueUsd),
          backgroundColor: finalAssets.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
          borderColor: "#09090b", // Matches container bg for a "cutout" look
          borderWidth: 2,
          hoverOffset: 4,
        },
      ],
    };

    return { chartData: data, displayData: finalAssets, totalValue: total };
  }, [solValueUsd, tokens]);

  const options = {
    responsive: true,
    cutout: "75%", // Makes it a thin doughnut
    plugins: {
      legend: {
        display: false, // Hide default canvas legend
      },
      tooltip: {
        backgroundColor: "#18181b",
        titleColor: "#f4f4f5",
        bodyColor: "#a1a1aa",
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function (context: any) {
            let label = context.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed !== null) {
              label += new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(context.parsed);
            }
            return label;
          },
        },
      },
    },
  };

  if (totalValue === 0) {
    return null; // Don't show chart if wallet is empty
  }

  return (
    <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-6 h-full flex flex-col">
      <h2 className="text-lg font-medium text-zinc-200 mb-6">Asset Allocation</h2>
      
      <div className="flex flex-col md:flex-row items-center gap-8 h-full">
        
        {/* CHART SECTION */}
        <div className="relative w-48 h-48 flex-shrink-0">
          <Doughnut data={chartData} options={options} />
          {/* Centered Total Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xs text-zinc-500 font-medium">Total</span>
            <span className="text-sm font-bold text-zinc-200">
              ${(totalValue / 1000).toFixed(1)}k
            </span>
          </div>
        </div>

        {/* CUSTOM LEGEND SECTION */}
        <div className="flex-1 w-full space-y-3 overflow-y-auto max-h-[250px] custom-scrollbar pr-2">
          {displayData.map((item, index) => {
            const percentage = ((item.valueUsd / totalValue) * 100).toFixed(1);
            const color = CHART_COLORS[index % CHART_COLORS.length];

            return (
              <div key={item.symbol} className="flex items-center justify-between text-sm group">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" 
                    style={{ backgroundColor: color }} 
                  />
                  <span className="text-zinc-300 font-medium group-hover:text-white transition-colors">
                    {item.symbol}
                  </span>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="text-zinc-600 text-xs">{percentage}%</span>
                  <span className="text-zinc-400 font-mono">
                    ${item.valueUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
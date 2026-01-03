// app/chat/components/ChartBubble.tsx

"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Filler,
  type ChartOptions,
} from "chart.js";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Filler
);

type ChartBubbleProps = {
  data: { t: number; p: number }[];
  coin: { id: string; name: string; symbol: string };
  timeframe: string;
  isStreaming?: boolean;
  onReloadChart: (tf: string) => void;
};

export default function ChartBubble({
  data,
  coin,
  timeframe,
  isStreaming,
  onReloadChart,
}: ChartBubbleProps) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full bg-white/5 p-4 rounded-lg text-center text-white/60">
        No chart data available.
      </div>
    );
  }

  const labels = data.map((d) =>
    new Date(d.t).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  );

  const prices = data.map((d) => d.p);
  const latestPrice = prices[prices.length - 1];

  const chartData = {
    labels,
    datasets: [
      {
        label: `${coin.symbol} Price`,
        data: prices,
        borderColor: "white",
        backgroundColor: (ctx: any) => {
          const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, "rgba(255,255,255,0.25)");
          gradient.addColorStop(1, "rgba(255,255,255,0.02)");
          return gradient;
        },
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 600,
      easing: "easeInOutCubic",
    },
    scales: {
      x: {
        ticks: {
          color: "rgba(255,255,255,0.4)",
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 6,
          padding: 8,
        },
        grid: { color: "rgba(255,255,255,0.05)" },
      },
      y: {
        ticks: {
          color: "rgba(255,255,255,0.4)",
          callback: (value) =>
            `$${Number(value).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`,
          padding: 10,
        },
        grid: { color: "rgba(255,255,255,0.05)" },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(0,0,0,0.8)",
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        callbacks: {
          label: (ctx: any) =>
            `$${ctx.raw.toLocaleString(undefined, {
              minimumFractionDigits: 4,
              maximumFractionDigits: 4,
            })}`,
        },
      },
    },
  };

  const timeframes = ["5m", "15m", "30m", "1h", "12h", "24h", "7d", "30d"];

  return (
    <div className="w-full flex flex-col gap-3 my-4 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between text-white/80 text-sm font-medium">
        <span>{coin.symbol.toUpperCase()} • {timeframe}</span>
        <span className="text-white text-base font-semibold">
          ${latestPrice.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6,
          })}
        </span>
      </div>

      {/* Timeframe buttons */}
      <div className="flex gap-2 overflow-x-auto pb-1 relative">
        {timeframes.map((tf) => (
          <button
            key={tf}
            onClick={() => onReloadChart(tf)}
            className={`px-3 py-1 rounded-md text-sm transition-all duration-200 relative ${
              tf === timeframe
                ? "bg-white text-black shadow-[0_0_10px_rgba(255,255,255,0.4)]"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            {tf}
            {tf === timeframe && (
              <div className="absolute left-0 right-0 -bottom-1 h-[2px] bg-white rounded-full transition-all"></div>
            )}
          </button>
        ))}
      </div>

      {/* Chart with fade animation */}
      <div
        className={`w-full h-64 bg-white/5 rounded-lg p-3 shadow-inner transition-opacity duration-300 ${
          isStreaming ? "opacity-0" : "opacity-100"
        }`}
      >
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}

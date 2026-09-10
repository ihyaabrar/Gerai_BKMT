"use client";

import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ChartData {
  bulan: string;
  penjualan: number;
  laba: number;
}

interface SalesChartProps {
  data: ChartData[];
}

const formatRupiahShort = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}jt`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}rb`;
  return String(value);
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-xl shadow-card p-3 text-sm">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: p.stroke || p.fill }}
          />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-medium">
            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

export function SalesChart({ data }: SalesChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        Belum ada data penjualan
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="isiPenjualan" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2F9862" stopOpacity={0.16} />
            <stop offset="100%" stopColor="#2F9862" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#EEF3F0" vertical={false} />
        <XAxis
          dataKey="bulan"
          tick={{ fontSize: 12, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatRupiahShort}
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#BCE4CB", strokeWidth: 1 }} />
        {/* Grafik garis dengan area lembut — lebih tenang daripada batang */}
        <Area
          type="monotone"
          dataKey="penjualan"
          name="Penjualan"
          stroke="none"
          fill="url(#isiPenjualan)"
        />
        <Line
          type="monotone"
          dataKey="penjualan"
          name="Penjualan"
          stroke="#1E7A4D"
          strokeWidth={2.5}
          dot={{ r: 3, fill: "#1E7A4D", strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="laba"
          name="Laba"
          stroke="#E0AC08"
          strokeWidth={2}
          strokeDasharray="4 4"
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

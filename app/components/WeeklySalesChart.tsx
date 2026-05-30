// app/components/WeeklySalesChart.tsx

'use client';

import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface ChartData {
  day: string;
  revenue: number;
}

interface WeeklySalesChartProps {
  data: ChartData[];
}

// Custom tooltips styling
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#121829] border border-slate-800 p-3 rounded-xl shadow-xl">
        <p className="text-slate-400 text-xs font-semibold mb-1">{payload[0].payload.day}</p>
        <p className="text-indigo-400 font-bold text-sm">
          {payload[0].value.toLocaleString('ar-SA')} ر.س
        </p>
      </div>
    );
  }
  return null;
};

export default function WeeklySalesChart({ data }: WeeklySalesChartProps) {
  // Safe rendering check to avoid SSR hydration mismatch
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-72 w-full bg-slate-900/10 rounded-xl animate-pulse" />;
  }

  return (
    <div className="h-72 w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" opacity={0.2} vertical={false} />
          <XAxis 
            dataKey="day" 
            stroke="#94a3b8" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false}
          />
          <YAxis 
            stroke="#94a3b8" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.05)', radius: 8 }} />
          <Bar 
            dataKey="revenue" 
            fill="#6366f1" 
            radius={[6, 6, 0, 0]} 
            maxBarSize={30}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

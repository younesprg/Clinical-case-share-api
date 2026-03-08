"use client";

import { useMemo } from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip, XAxis } from 'recharts';
import { ChevronRight } from 'lucide-react';

interface VitalChartWidgetProps {
    title: string;
    data: number[];
    unit: string;
    color: string;
}

export default function VitalChartWidget({ title, data, unit, color }: VitalChartWidgetProps) {
    // Transform flat array into format required by Recharts
    const chartData = useMemo(() => {
        if (!data || data.length === 0) {
            return []; // Return empty array if no real data
        }
        return data.map((val, i) => ({ index: i, value: val }));
    }, [data]);

    const latestValue = chartData.length > 0 ? chartData[chartData.length - 1].value : 0;

    const averageValue = useMemo(() => {
        if (chartData.length === 0) return 0;
        const sum = chartData.reduce((acc, curr) => acc + curr.value, 0);
        return sum / chartData.length;
    }, [chartData]);

    // Custom tooltip for clean aesthetic
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900 text-white text-xs px-2 py-1 rounded shadow-md">
                    {Math.round(payload[0].value)} {unit}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm w-full">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-slate-900 flex items-center hover:text-blue-600 cursor-pointer transition-colors">
                    {title} <ChevronRight size={16} className="ml-1 text-slate-400" />
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                    Today: avg. <span className="text-slate-800 font-semibold">{Math.round(averageValue)} {unit}</span>
                </p>
            </div>

            <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <YAxis
                            domain={['auto', 'auto']}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 10 }}
                            tickCount={4}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1, strokeDasharray: '3 3' }} />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke={color}
                            strokeWidth={2.5}
                            dot={false}
                            activeDot={{ r: 6, fill: color, stroke: '#fff', strokeWidth: 2 }}
                            animationDuration={1500}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

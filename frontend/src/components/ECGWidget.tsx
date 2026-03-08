import { useEffect, useState } from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { Activity } from 'lucide-react';

interface ECGWidgetProps {
    heartRate: number | null | undefined;
}

export default function ECGWidget({ heartRate }: ECGWidgetProps) {
    const [data, setData] = useState<any[]>([]);

    useEffect(() => {
        if (!heartRate || heartRate <= 0) {
            // Flatline if no heart rate
            const flatline = Array.from({ length: 150 }).map((_, i) => ({ time: i, value: 0 }));
            setData(flatline);
            return;
        }

        // Logic to simulate an ECG trace based on heart rate
        // 60 BPM = 1 beat every 1 second
        const beatsPerSecond = heartRate / 60;
        const totalDurationSeconds = 3; // Show 3 seconds of trace
        const pointsPerSecond = 100; // Resolution
        const totalPoints = totalDurationSeconds * pointsPerSecond;
        const beatIntervalPoints = pointsPerSecond / beatsPerSecond;

        const simulatedData = [];

        // Idealized PQRST complex relative amplitudes and durations
        // Baseline: 0. P: 0.1, Q: -0.1, R: 1.0, S: -0.2, T: 0.2
        for (let i = 0; i < totalPoints; i++) {
            const positionInBeat = i % beatIntervalPoints;
            const progress = positionInBeat / beatIntervalPoints; // 0 to 1 scaling inside a beat

            let value = 0;
            // Add some base noise
            value += (Math.random() - 0.5) * 0.05;

            // Approx timings within a cardiac cycle
            if (progress > 0.1 && progress < 0.15) {
                // P Wave
                value += Math.sin((progress - 0.1) * Math.PI * 20) * 0.15;
            } else if (progress > 0.2 && progress < 0.22) {
                // Q Wave
                value -= 0.15;
            } else if (progress >= 0.22 && progress < 0.25) {
                // R Wave (Spike)
                const peakProgress = (progress - 0.22) / 0.03;
                value += Math.sin(peakProgress * Math.PI) * 1.5;
            } else if (progress >= 0.25 && progress < 0.28) {
                // S Wave
                value -= 0.3;
            } else if (progress > 0.4 && progress < 0.55) {
                // T Wave
                value += Math.sin((progress - 0.4) * Math.PI * 6.66) * 0.2;
            }

            simulatedData.push({ time: i, value });
        }

        setData(simulatedData);
    }, [heartRate]);

    return (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm overflow-hidden relative">
            {/* Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(239,68,68,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(239,68,68,0.05)_1px,transparent_1px)] bg-[size:20px_20px]"></div>

            <div className="relative z-10">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-slate-900 text-lg flex items-center">
                        <Activity className="mr-2 text-red-500" size={20} />
                        Electrocardiogram (ECG) Snapshot
                    </h3>
                    {heartRate && (
                        <div className="flex flex-col items-end">
                            <span className="text-3xl font-black text-red-500 font-mono tracking-tighter">
                                {heartRate}
                                <span className="text-sm font-normal text-slate-500 ml-1 tracking-normal">BPM</span>
                            </span>
                        </div>
                    )}
                </div>

                <div className="h-40 w-full mt-4 -ml-2 -mr-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <YAxis domain={[-1, 2]} hide={true} />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#0f172a"
                                strokeWidth={2}
                                dot={false}
                                isAnimationActive={false}
                                style={{ filter: 'drop-shadow(0px 1px 1px rgba(15, 23, 42, 0.2))' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

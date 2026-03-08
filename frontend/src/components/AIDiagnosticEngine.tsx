import { useEffect, useState } from 'react';
import { fetchAIAnalysis } from '@/lib/api';
import { BrainCircuit, Activity, AlertTriangle, CheckCircle } from 'lucide-react';

interface AIAnalysis {
    risk_level: string;
    confidence_score: number;
    differential_diagnoses: string[];
    clinical_recommendations: string[];
}

export default function AIDiagnosticEngine({ caseId }: { caseId: number }) {
    const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const getAnalysis = async () => {
            setIsLoading(true);
            try {
                const data = await fetchAIAnalysis(caseId);
                setAnalysis(data);
            } catch (error) {
                console.error("Failed to fetch AI analysis", error);
            } finally {
                setIsLoading(false);
            }
        };
        if (caseId) {
            getAnalysis();
        }
    }, [caseId]);

    if (isLoading) {
        return (
            <div className="bg-slate-900 rounded-3xl p-6 border border-slate-700 shadow-lg flex flex-col items-center justify-center min-h-[300px]">
                <BrainCircuit className="animate-pulse text-blue-500 mb-4" size={40} />
                <p className="text-sm text-slate-400">AI Diagnostic Engine analyzing patient data...</p>
            </div>
        );
    }

    if (!analysis) return null;

    const getRiskColor = (level: string) => {
        switch (level) {
            case 'Critical': return 'text-red-500 bg-red-500/10 border-red-500/20';
            case 'High': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
            case 'Elevated': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
            default: return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
        }
    };

    return (
        <div className="relative bg-white rounded-3xl p-1 overflow-hidden shadow-sm border border-slate-100">
            {/* Subtle gradient border effect - light theme */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100/30 via-purple-100/30 to-white/30 opacity-50"></div>

            <div className="relative bg-white rounded-[1.4rem] p-6 h-full">
                <div className="flex flex-col md:flex-row justify-between md:items-start mb-6 border-b border-slate-100 pb-4 gap-4">
                    <div className="flex items-center">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center mr-4 shadow-md shadow-blue-500/20 flex-shrink-0">
                            <BrainCircuit className="text-white" size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-lg tracking-wide">AI Diagnostic Engine</h3>
                            <p className="text-xs text-slate-500">Real-time Clinical Evaluation Engine</p>
                        </div>
                    </div>

                    <div className={`px-4 py-2 rounded-xl border flex flex-col justify-center items-center ${getRiskColor(analysis.risk_level)}`}>
                        <span className="text-xs uppercase tracking-wider font-bold mb-1 opacity-80">Risk Level</span>
                        <span className="text-lg font-black">{analysis.risk_level}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-slate-700 flex items-center">
                                <Activity className="mr-2 text-indigo-500" size={16} />
                                Differential Diagnoses
                            </h4>
                            <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                                Conf: {analysis.confidence_score}%
                            </span>
                        </div>
                        <ul className="space-y-2">
                            {analysis.differential_diagnoses.map((diag, i) => (
                                <li key={i} className="text-sm text-slate-700 bg-slate-50 border border-slate-100 rounded-lg p-3 flex items-start">
                                    <AlertTriangle size={14} className="mt-0.5 mr-2 text-orange-500 flex-shrink-0" />
                                    <span>{diag}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-slate-700 flex items-center">
                            <CheckCircle className="mr-2 text-emerald-500" size={16} />
                            Clinical Recommendations
                        </h4>
                        <ul className="space-y-2">
                            {analysis.clinical_recommendations.map((rec, i) => (
                                <li key={i} className="text-sm text-slate-700 bg-slate-50 border border-slate-100 rounded-lg p-3 flex items-start">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 mr-2 flex-shrink-0"></div>
                                    <span>{rec}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

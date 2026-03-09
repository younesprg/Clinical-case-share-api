"use client";

import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Search, User, FileText, BrainCircuit, Activity } from 'lucide-react';
import Link from 'next/link';

export default function SearchResultsPage() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';

    const [isLoading, setIsLoading] = useState(true);
    const [results, setResults] = useState<any[]>([]);

    useEffect(() => {
        const fetchAndFilterResults = async () => {
            setIsLoading(true);
            try {
                if (!query) {
                    setResults([]);
                    setIsLoading(false);
                    return;
                }

                const lowerQuery = query.toLowerCase();

                // 1. Fetch all users to map patient names
                const usersResponse = await api.get('/users/me'); // HACK: In a real app we need a /users endpoint that returns all users. 
                // For this demo context, we'll try to fetch all cases and filter on them, simulating user search via case data if possible.
                // NOTE: The current API doesn't have a GET /users/ endpoint. We will filter mostly on cases and their associated patient_id.
                // We will simulate patient name if needed, or rely on ID.

                // 2. Fetch all cases
                const casesResponse = await api.get('/cases/');
                const allCases = casesResponse.data;

                // 3. We also need AI logic. In a real app, AI analysis is saved in DB or fetched on demand.
                // Since our current backend computes AI on the fly per case via `GET /cases/{id}/ai-analysis`,
                // fetching it for ALL cases is N+1 problem. For this demo, we will execute a lightweight frontend 
                // simulation of the AI symptoms check to allow keyword matching on "AI Diagnoses" without melting the server,
                // OR we can make concurrent API calls (if dataset is small).

                // Let's do concurrent API calls for a small dataset demo.
                const casePromises = allCases.map(async (c: any) => {
                    try {
                        const aiResp = await api.get(`/cases/${c.id}/ai-analysis`);
                        return { ...c, ai_analysis: aiResp.data };
                    } catch (e) {
                        return { ...c, ai_analysis: null };
                    }
                });

                const casesWithAI = await Promise.all(casePromises);

                // 4. Filter Logic
                const filtered = casesWithAI.filter((c: any) => {
                    // Match Patient ID
                    const matchId = c.patient_id.toString().includes(lowerQuery);

                    // Match Diagnosis
                    const matchDiagnosis = c.diagnosis?.toLowerCase().includes(lowerQuery);

                    // Match Symptoms
                    const matchSymptoms = c.symptoms?.toLowerCase().includes(lowerQuery);

                    // Match AI Differential Diagnoses
                    let matchAI = false;
                    if (c.ai_analysis && c.ai_analysis.differential_diagnoses) {
                        matchAI = c.ai_analysis.differential_diagnoses.some((diag: string) =>
                            diag.toLowerCase().includes(lowerQuery)
                        );
                    }

                    // (Patient name matching would require full user profiles, assuming not fully available, falling back to ID)

                    return matchId || matchDiagnosis || matchSymptoms || matchAI;
                });

                setResults(filtered);
            } catch (error) {
                console.error("Search failed:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAndFilterResults();
    }, [query]);

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto h-full flex flex-col">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center">
                        <Search className="mr-3 text-blue-500" size={28} />
                        Search Results
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg">
                        Showing results for: <span className="font-semibold text-slate-800">"{query}"</span>
                    </p>
                </div>

                <div className="flex-1 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                    {isLoading ? (
                        <div className="flex-1 flex flex-col justify-center items-center">
                            <Activity className="animate-spin text-blue-500 mb-4" size={40} />
                            <p className="text-slate-500 font-medium animate-pulse">Scanning clinical database & AI models...</p>
                        </div>
                    ) : results.length === 0 ? (
                        <div className="flex-1 flex flex-col justify-center items-center text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex justify-center items-center mb-4">
                                <Search className="text-slate-300" size={32} />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-800">No results found</h3>
                            <p className="text-slate-500 max-w-sm mt-2">We couldn't find any cases matching your search across Patient IDs, Diagnoses, or AI Results.</p>
                        </div>
                    ) : (
                        <div className="overflow-y-auto pr-4 space-y-4">
                            {results.map((c: any) => (
                                <Link href={`/patient/${c.patient_id}`} key={c.id} className="block group">
                                    <div className="border border-slate-100 p-5 rounded-2xl hover:border-blue-300 hover:shadow-md transition-all bg-slate-50/50 group-hover:bg-white flex flex-col md:flex-row gap-6 items-start md:items-center">

                                        <div className="flex-shrink-0 flex items-center justify-center w-14 h-14 bg-indigo-50 text-indigo-600 rounded-xl font-bold border border-indigo-100">
                                            PT-{c.patient_id}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center mb-1">
                                                <FileText size={16} className="text-slate-400 mr-2" />
                                                <h4 className="text-base font-semibold text-slate-900 truncate">
                                                    {c.diagnosis || 'Undiagnosed Case'}
                                                </h4>
                                                <span className="ml-3 text-xs text-slate-400 font-medium">
                                                    Case #{c.id} • {new Date(c.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-600 line-clamp-1">{c.symptoms}</p>
                                        </div>

                                        {c.ai_analysis && (
                                            <div className="md:w-64 flex-shrink-0 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6">
                                                <div className="flex items-center text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                                                    <BrainCircuit size={14} className="mr-1 text-purple-500" />
                                                    AI Flags
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {c.ai_analysis.differential_diagnoses.slice(0, 2).map((diag: string, i: number) => (
                                                        <span key={i} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                                                            {diag}
                                                        </span>
                                                    ))}
                                                    {c.ai_analysis.differential_diagnoses.length > 2 && (
                                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600">
                                                            +{c.ai_analysis.differential_diagnoses.length - 2} more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

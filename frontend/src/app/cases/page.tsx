"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, ChevronRight, Activity, CalendarDays, User } from 'lucide-react';

export default function CasesFeed() {
    const [cases, setCases] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const { user } = useAuth();

    const [patientsMap, setPatientsMap] = useState<Record<number, string>>({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [casesRes, patientsRes] = await Promise.all([
                    api.get('/cases/'),
                    api.get('/patients/')
                ]);

                setCases(casesRes.data);

                const pMap: Record<number, string> = {};
                patientsRes.data.forEach((p: any) => {
                    pMap[p.id] = p.full_name;
                });
                setPatientsMap(pMap);

            } catch (error) {
                console.error("Failed to fetch cases or patients:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Central Case Feed</h1>
                    <p className="text-slate-500 mt-1">Overview of all patient clinical cases</p>
                </div>
                {user?.role === 'doctor' && (
                    <button
                        onClick={() => router.push('/cases/new')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-colors flex items-center"
                    >
                        <FileText size={18} className="mr-2" />
                        Add New Case
                    </button>
                )}
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Activity className="animate-pulse text-blue-500" size={40} />
                </div>
            ) : cases.length === 0 ? (
                <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm">
                    <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                        <FileText size={32} />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800">No cases found</h3>
                    <p className="text-slate-500 mt-2 max-w-sm mx-auto">
                        There are no clinical cases recorded in the system yet.
                        {user?.role === 'doctor' && ' Click "Add New Case" to get started.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {cases.map((c) => (
                        <div
                            key={c.id}
                            onClick={() => router.push(`/patient/${c.patient_id}?caseId=${c.id}`)}
                            className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold overflow-hidden border-2 border-white shadow-sm">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                                            {patientsMap[c.patient_id] || `Patient ID: ${c.patient_id}`}
                                        </h3>
                                        <p className="text-xs text-slate-500 flex items-center mt-0.5">
                                            <CalendarDays size={12} className="mr-1 inline" />
                                            {new Date(c.created_at || Date.now()).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-semibold">
                                    HR: {c.heart_rate}
                                </div>
                            </div>

                            <div className="space-y-3 mb-5">
                                <div>
                                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Diagnosis</p>
                                    <p className="text-sm font-medium text-slate-800 truncate">{c.diagnosis || 'Pending'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Symptoms</p>
                                    <p className="text-sm text-slate-600 line-clamp-2">{c.symptoms}</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                <span className="text-sm text-blue-600 font-medium group-hover:underline">
                                    View Patient Dashboard
                                </span>
                                <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </DashboardLayout>
    );
}

"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, ChevronRight, Activity, CalendarDays, User, Minus, AlertTriangle, Heart, Filter, Search, CheckCircle } from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────
const PENDING_KEYWORDS = ['pending', 'bekliyor', 'bilinmiyor', 'belli değil', 'belirsiz', 'teşhis bekleniyor', 'null'];

function DiagnosisBadge({ diagnosis }: { diagnosis?: string }) {
    const d = (diagnosis || '').toLowerCase().trim();
    const isPending = !d || PENDING_KEYWORDS.some(k => d === k || d.includes(k));

    if (isPending) {
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mr-1.5" />
                Teşhis Bekleniyor
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
            <CheckCircle size={12} />
            {diagnosis}
        </span>
    );
}

// ─── Delete Modal ────────────────────────────────────────────
function DeleteConfirmModal({ onConfirm, onCancel, isDeleting }: { onConfirm: () => void; onCancel: () => void; isDeleting: boolean }) {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm w-full mx-4 border border-slate-100">
                <div className="flex flex-col items-center text-center">
                    <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle className="text-red-500" size={28} />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 mb-2">Vakayı Sil</h2>
                    <p className="text-slate-500 text-sm mb-6">Bu vakayı kalıcı olarak silmek istediğinizden emin misiniz?</p>
                    <div className="flex gap-3 w-full">
                        <button onClick={onCancel} disabled={isDeleting} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors">Vazgeç</button>
                        <button onClick={onConfirm} disabled={isDeleting} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 rounded-xl text-white text-sm font-medium disabled:opacity-75 flex items-center justify-center gap-2 transition-colors">
                            {isDeleting && <Activity className="animate-spin" size={14} />}
                            {isDeleting ? 'Siliniyor...' : 'Evet, Sil'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ───────────────────────────────────────────────
type FilterType = 'all' | 'pending' | 'mine';

export default function CasesFeed() {
    const [cases, setCases] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [patientsMap, setPatientsMap] = useState<Record<number, string>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [casesRes, patientsRes] = await Promise.all([api.get('/cases/'), api.get('/patients/')]);
                setCases(casesRes.data);
                const pMap: Record<number, string> = {};
                patientsRes.data.forEach((p: any) => { pMap[p.id] = p.full_name; });
                setPatientsMap(pMap);
            } catch (error) {
                console.error('Failed to fetch:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredCases = useMemo(() => {
        let result = cases;

        // Filter
        if (activeFilter === 'pending') {
            result = result.filter(c => {
                const d = (c.diagnosis || '').toLowerCase().trim();
                return !d || PENDING_KEYWORDS.some(k => d.includes(k));
            });
        } else if (activeFilter === 'mine') {
            result = result.filter(c => c.author_id === user?.id);
        }

        // Search
        const q = searchTerm.toLowerCase().trim();
        if (q) {
            result = result.filter(c => {
                const patientName = (patientsMap[c.patient_id] || '').toLowerCase();
                const symptoms = (c.symptoms || '').toLowerCase();
                const diagnosis = (c.diagnosis || '').toLowerCase();
                return patientName.includes(q) || symptoms.includes(q) || diagnosis.includes(q) || String(c.patient_id).includes(q);
            });
        }

        return result;
    }, [cases, activeFilter, searchTerm, user, patientsMap]);

    const handleDeleteConfirm = async () => {
        if (!confirmDeleteId) return;
        setIsDeleting(true);
        try {
            await api.delete(`/cases/${confirmDeleteId}`);
            setCases(prev => prev.filter(c => c.id !== confirmDeleteId));
        } catch (err) {
            console.error('Delete failed', err);
        } finally {
            setIsDeleting(false);
            setConfirmDeleteId(null);
        }
    };

    const filterTabs: { key: FilterType; label: string }[] = [
        { key: 'all', label: 'Tüm Vakalar' },
        { key: 'pending', label: 'Teşhis Bekleyenler' },
        { key: 'mine', label: 'Benim Vakalarım' },
    ];

    return (
        <DashboardLayout>
            {confirmDeleteId !== null && (
                <DeleteConfirmModal onConfirm={handleDeleteConfirm} onCancel={() => setConfirmDeleteId(null)} isDeleting={isDeleting} />
            )}

            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Vaka Akışı</h1>
                <p className="text-slate-400 text-sm mt-0.5">Tüm klinik vakalara genel bakış</p>
            </div>

            {/* Search + Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Hasta adı, semptom veya teşhis ara..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 gap-1 shrink-0">
                    <Filter size={14} className="text-slate-400 ml-2 mr-1" />
                    {filterTabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveFilter(tab.key)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                                activeFilter === tab.key
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Results Count */}
            {!isLoading && (
                <p className="text-xs text-slate-400 mb-4">
                    {filteredCases.length} vaka gösteriliyor{searchTerm && ` — "${searchTerm}" araması`}
                </p>
            )}

            {/* States */}
            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Activity className="animate-pulse text-blue-500" size={40} />
                </div>
            ) : filteredCases.length === 0 ? (
                <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm">
                    <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                        <FileText size={32} />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800">Vaka bulunamadı</h3>
                    <p className="text-slate-500 mt-2 max-w-sm mx-auto text-sm">
                        {searchTerm ? 'Farklı bir arama terimi deneyin.' : 'Henüz sisteme kayıtlı vaka yok.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredCases.map((c) => (
                        <div
                            key={c.id}
                            onClick={() => router.push(`/patient/${c.patient_id}?caseId=${c.id}`)}
                            className="relative bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                        >
                            {/* Delete Button */}
                            {user?.role === 'doctor' && (
                                <button
                                    onClick={e => { e.stopPropagation(); setConfirmDeleteId(c.id); }}
                                    className="absolute top-3.5 right-3.5 w-6 h-6 bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 rounded-full flex items-center justify-center transition-colors z-10"
                                    title="Vakayı Sil"
                                >
                                    <Minus size={12} strokeWidth={3} />
                                </button>
                            )}

                            {/* Patient Info */}
                            <div className="flex items-center gap-3 mb-4 pr-8">
                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                                    <User size={18} />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-semibold text-slate-900 text-sm group-hover:text-blue-600 transition-colors truncate">
                                        {patientsMap[c.patient_id] || `Hasta #${c.patient_id}`}
                                    </h3>
                                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                        <CalendarDays size={11} />
                                        {new Date(c.created_at || Date.now()).toLocaleDateString('tr-TR')}
                                    </p>
                                </div>
                            </div>

                            {/* Vitals */}
                            {c.heart_rate && (
                                <div className="flex items-center gap-1.5 mb-3 text-sm text-slate-700">
                                    <Heart size={14} className="text-red-400 shrink-0" fill="currentColor" />
                                    <span className="font-semibold">{c.heart_rate}</span>
                                    <span className="text-xs text-slate-400">bpm</span>
                                </div>
                            )}

                            {/* Diagnosis Badge */}
                            <div className="mb-3">
                                <DiagnosisBadge diagnosis={c.diagnosis} />
                            </div>

                            {/* Symptoms */}
                            <p className="text-xs text-slate-500 line-clamp-2 mb-4">{c.symptoms}</p>

                            {/* Footer */}
                            <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                                <span className="text-xs text-blue-600 font-medium group-hover:underline">Hasta Panosu</span>
                                <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </DashboardLayout>
    );
}

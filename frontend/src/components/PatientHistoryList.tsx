import { Stethoscope, Activity, Minus } from 'lucide-react';
import api from '@/lib/api';
import { useState } from 'react';

interface PatientHistoryListProps {
    cases: any[];
    onSelectCase?: (caseObj: any) => void;
    onDeleteCase?: (caseId: number) => void;
    selectedCaseId?: number;
    isDoctor?: boolean;
}

function DeleteMiniModal({ onConfirm, onCancel, isDeleting }: { onConfirm: () => void; onCancel: () => void; isDeleting: boolean }) {
    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-xs w-full mx-4 border border-slate-100 text-center">
                <p className="text-slate-800 font-semibold mb-1">Bu vakayı silmek istiyor musunuz?</p>
                <p className="text-slate-400 text-xs mb-5">Bu işlem geri alınamaz.</p>
                <div className="flex gap-3">
                    <button onClick={onCancel} disabled={isDeleting} className="flex-1 py-2 border border-slate-200 rounded-xl text-slate-600 text-sm font-medium hover:bg-slate-50">Vazgeç</button>
                    <button onClick={onConfirm} disabled={isDeleting} className="flex-1 py-2 bg-red-600 hover:bg-red-700 rounded-xl text-white text-sm font-medium disabled:opacity-75">
                        {isDeleting ? 'Siliniyor...' : 'Sil'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function PatientHistoryList({ cases, onSelectCase, onDeleteCase, selectedCaseId, isDoctor }: PatientHistoryListProps) {
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const displayList = cases.map((c) => ({
        id: c.id,
        rawCase: c,
        specialty: c.diagnosis || "General Consultation",
        doctor: `Doctor ID: ${c.author_id}`,
        time: new Date(c.created_at || Date.now()).toLocaleString(),
    })).slice(0, 6);

    const handleDeleteConfirm = async () => {
        if (confirmDeleteId === null) return;
        setIsDeleting(true);
        try {
            await api.delete(`/cases/${confirmDeleteId}`);
            onDeleteCase && onDeleteCase(confirmDeleteId);
        } catch (err) {
            console.error("Failed to delete case", err);
        } finally {
            setIsDeleting(false);
            setConfirmDeleteId(null);
        }
    };

    return (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex-1 flex flex-col">
            {confirmDeleteId !== null && (
                <DeleteMiniModal
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setConfirmDeleteId(null)}
                    isDeleting={isDeleting}
                />
            )}

            <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-slate-900">Appointment history</h3>
            </div>

            <div className="space-y-4 flex-1">
                {displayList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 py-6">
                        <Activity size={32} className="mb-2 text-slate-300" />
                        <p className="text-sm">No appointment history found.</p>
                    </div>
                ) : (
                    displayList.map((item, idx) => (
                        <div
                            key={item.id}
                            onClick={() => onSelectCase && onSelectCase(item.rawCase)}
                            className={`flex items-start p-3 rounded-2xl cursor-pointer transition-colors ${item.id === selectedCaseId ? 'bg-blue-50/50 border border-blue-100' : 'hover:bg-slate-50 border border-transparent'}`}
                        >
                            <div className="w-10 h-10 rounded-full flex items-center justify-center mr-4 mt-1 bg-blue-50 text-blue-500 shrink-0">
                                <Stethoscope size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold truncate ${item.id === selectedCaseId ? 'text-blue-700' : 'text-slate-900'}`}>{item.specialty}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{item.time}</p>
                            </div>
                            {isDoctor && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(item.id); }}
                                    className="ml-2 w-7 h-7 shrink-0 bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 rounded-full flex items-center justify-center transition-colors"
                                    title="Vakayı Sil"
                                >
                                    <Minus size={13} strokeWidth={3} />
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

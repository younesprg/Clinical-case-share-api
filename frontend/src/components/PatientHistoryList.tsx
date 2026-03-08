import { Stethoscope, Activity, HeartPulse } from 'lucide-react';

interface PatientHistoryListProps {
    cases: any[];
    onSelectCase?: (caseObj: any) => void;
    selectedCaseId?: number;
}

export default function PatientHistoryList({ cases, onSelectCase, selectedCaseId }: PatientHistoryListProps) {
    const displayList = cases.map((c, i) => ({
        id: c.id,
        rawCase: c,
        specialty: c.diagnosis || "General Consultation",
        doctor: `Doctor ID: ${c.author_id}`,
        time: new Date(c.created_at || Date.now()).toLocaleString(),
        icon: Stethoscope,
        bgIcon: "bg-blue-50 text-blue-500"
    })).slice(0, 4);

    return (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-slate-900">Appointment history</h3>
                <button className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">See all &gt;</button>
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
                            className={`flex items-start p-3 rounded-2xl cursor-pointer transition-colors ${item.id === selectedCaseId ? 'bg-blue-50/50 border border-blue-100' : 'hover:bg-slate-50 border border-transparent'} ${idx !== displayList.length - 1 && item.id !== selectedCaseId ? 'border-b-slate-100 !border-x-transparent !border-t-transparent !rounded-none pb-4' : ''}`}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 mt-1 ${item.bgIcon}`}>
                                <item.icon size={18} />
                            </div>
                            <div className="flex-1">
                                <p className={`text-sm font-semibold ${item.id === selectedCaseId ? 'text-blue-700' : 'text-slate-900'}`}>{item.specialty}</p>
                                <p className="text-xs text-slate-500 mt-1">{item.doctor}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{item.time}</p>
                            </div>
                            <button className={`mt-2 transition-colors ${item.id === selectedCaseId ? 'text-blue-500' : 'text-slate-300 hover:text-blue-600'}`}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 18l6-6-6-6" />
                                </svg>
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

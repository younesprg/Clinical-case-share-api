import { User, Droplet, Ruler, Activity } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface Patient {
    id: number;
    name: string;
    gender: string;
    date_of_birth: string;
    height: number;
    blood_type: string;
}

export default function PatientProfileCard({ patientId }: { patientId: string }) {
    const [patient, setPatient] = useState<Patient | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPatient = async () => {
            try {
                const response = await api.get(`/patients/${patientId}`);
                setPatient(response.data);
            } catch (error) {
                console.error("Failed to fetch patient details", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPatient();
    }, [patientId]);

    if (isLoading) {
        return (
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
                <Activity className="animate-spin text-blue-500 mb-4" size={32} />
                <p className="text-sm text-slate-500">Loading patient details...</p>
            </div>
        );
    }

    if (!patient) {
        return (
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
                <p className="text-sm text-slate-500">Patient not found</p>
            </div>
        );
    }

    const calculateAge = (dobString: string) => {
        if (!dobString) return 'N/A';
        const dob = new Date(dobString);
        const ageDifMs = Date.now() - dob.getTime();
        const ageDate = new Date(ageDifMs);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    return (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-slate-200 border-4 border-white shadow-md overflow-hidden mb-4">
                <img
                    src={`https://ui-avatars.com/api/?name=${patient.name.replace(' ', '+')}&background=f1f5f9&color=64748b`}
                    alt="Patient avatar"
                    className="w-full h-full object-cover"
                />
            </div>

            <h2 className="text-xl font-bold text-slate-900">{patient.name}</h2>
            <p className="text-sm text-slate-400 mb-6 bg-slate-50 px-3 py-1 rounded-full mt-2">ID: {patient.id}</p>

            <div className="w-full grid grid-cols-2 gap-y-6 gap-x-4 mb-8">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center font-bold">
                        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-medium">Gender</p>
                        <p className="text-sm font-semibold text-slate-900">{patient.gender || 'N/A'}</p>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center font-bold">
                        <User size={20} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-medium">Age</p>
                        <p className="text-sm font-semibold text-slate-900">{calculateAge(patient.date_of_birth)} {patient.date_of_birth ? 'y.o.' : ''}</p>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center font-bold">
                        <Ruler size={20} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-medium">Height</p>
                        <p className="text-sm font-semibold text-slate-900">{patient.height ? `${patient.height} cm` : 'N/A'}</p>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center font-bold">
                        <Droplet size={20} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-medium">Blood type</p>
                        <p className="text-sm font-semibold text-slate-900">{patient.blood_type || 'N/A'}</p>
                    </div>
                </div>
            </div>

            <button className="w-full py-2.5 bg-blue-50 text-blue-600 font-semibold rounded-xl hover:bg-blue-100 transition-colors text-sm">
                See all information
            </button>
        </div>
    );
}

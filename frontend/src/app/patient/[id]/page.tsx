"use client";

import { useParams, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import PatientProfileCard from '@/components/PatientProfileCard';
import AIDiagnosticEngine from '@/components/AIDiagnosticEngine';
import ECGWidget from '@/components/ECGWidget';
import VitalChartWidget from '@/components/VitalChartWidget';
import PatientHistoryList from '@/components/PatientHistoryList';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Activity, HeartPulse, ActivitySquare, Wind, Droplet, Microscope } from 'lucide-react';

export default function PatientDashboard() {
    const params = useParams();
    const searchParams = useSearchParams();
    const caseIdParam = searchParams.get('caseId');
    const patientId = params.id as string;
    const { user } = useAuth();
    const isDoctor = user?.role === 'doctor';
    const [patientCases, setPatientCases] = useState<any[]>([]);
    const [selectedCase, setSelectedCase] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPatientData = async () => {
            try {
                const response = await api.get('/cases/');
                const filteredCases = response.data.filter((c: any) => c.patient_id.toString() === patientId);
                // Sort cases by date descending
                filteredCases.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
                setPatientCases(filteredCases);
                if (filteredCases.length > 0) {
                    if (caseIdParam) {
                        const targetCase = filteredCases.find((c: any) => c.id.toString() === caseIdParam);
                        setSelectedCase(targetCase || filteredCases[0]);
                    } else {
                        setSelectedCase(filteredCases[0]);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch patient cases", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPatientData();
    }, [patientId]);

    const handleDeleteCase = (deletedCaseId: number) => {
        setPatientCases(prev => {
            const updated = prev.filter(c => c.id !== deletedCaseId);
            if (selectedCase?.id === deletedCaseId) {
                setSelectedCase(updated.length > 0 ? updated[0] : null);
            }
            return updated;
        });
    };

    const handleSelectCase = (caseObj: any) => {
        setSelectedCase(caseObj);
    };

    return (
        <DashboardLayout>
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 h-full">
                {/* Left Column: Profile & Appointments */}
                <div className="xl:col-span-1 flex flex-col space-y-6">
                    <PatientProfileCard patientId={patientId} />
                    <PatientHistoryList cases={patientCases} onSelectCase={handleSelectCase} onDeleteCase={handleDeleteCase} selectedCaseId={selectedCase?.id} isDoctor={isDoctor} />
                </div>

                {/* Middle/Right Column: Clinical Data */}
                <div className="xl:col-span-3 flex flex-col space-y-6">
                    {/* Vitals & Lab Results Grid */}
                    {selectedCase && (
                        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                            <h3 className="font-semibold text-slate-900 text-lg mb-6 flex items-center">
                                <Activity className="text-red-500 mr-2" size={20} />
                                Vitals & Lab Results
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                <div className="p-4 border border-slate-100 rounded-2xl flex flex-col justify-center items-center text-center hover:border-blue-200 transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-3">
                                        <HeartPulse size={20} />
                                    </div>
                                    <p className="text-xs text-slate-500 mb-1">Heart Rate</p>
                                    <p className="text-lg font-bold text-slate-900">{selectedCase.heart_rate || '--'} <span className="text-xs font-normal text-slate-500">bpm</span></p>
                                </div>

                                <div className="p-4 border border-slate-100 rounded-2xl flex flex-col justify-center items-center text-center hover:border-blue-200 transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mb-3">
                                        <ActivitySquare size={20} />
                                    </div>
                                    <p className="text-xs text-slate-500 mb-1">Blood Pressure</p>
                                    <p className="text-lg font-bold text-slate-900">{selectedCase.blood_pressure || '--'}</p>
                                </div>

                                <div className="p-4 border border-slate-100 rounded-2xl flex flex-col justify-center items-center text-center hover:border-blue-200 transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-3">
                                        <Wind size={20} />
                                    </div>
                                    <p className="text-xs text-slate-500 mb-1">SpO2</p>
                                    <p className="text-lg font-bold text-slate-900">{selectedCase.oxygen_saturation || '--'} <span className="text-xs font-normal text-slate-500">%</span></p>
                                </div>

                                <div className="p-4 border border-slate-100 rounded-2xl flex flex-col justify-center items-center text-center hover:border-blue-200 transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-3">
                                        <Droplet size={20} />
                                    </div>
                                    <p className="text-xs text-slate-500 mb-1">Glucose</p>
                                    <p className="text-lg font-bold text-slate-900">{selectedCase.blood_test?.glucose_level || '--'} <span className="text-xs font-normal text-slate-500">mg/dL</span></p>
                                </div>

                                <div className="p-4 border border-slate-100 rounded-2xl flex flex-col justify-center items-center text-center hover:border-blue-200 transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center mb-3">
                                        <Microscope size={20} />
                                    </div>
                                    <p className="text-xs text-slate-500 mb-1">WBC</p>
                                    <p className="text-lg font-bold text-slate-900">{selectedCase.blood_test?.wbc || '--'} <span className="text-xs font-normal text-slate-500">10^9/L</span></p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Latest/Selected Clinical Case Section */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-semibold text-slate-900 text-lg flex items-center">
                                <FileText className="text-blue-500 mr-2" size={20} />
                                {selectedCase && selectedCase.id === patientCases[0]?.id ? 'Latest Clinical Case' : 'Selected Clinical Case'}
                            </h3>
                            {selectedCase && (
                                <span className="text-xs font-medium bg-blue-50 text-blue-600 px-3 py-1 rounded-full">
                                    {new Date(selectedCase.created_at || Date.now()).toLocaleDateString()}
                                </span>
                            )}
                        </div>

                        {!selectedCase ? (
                            <div className="flex items-center justify-center py-10 text-slate-400">
                                <p>No clinical cases available for this patient.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Symptoms</p>
                                    <p className="text-sm text-slate-800">{selectedCase.symptoms}</p>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100">
                                    <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">Diagnosis</p>
                                    <p className="text-sm text-purple-900 font-medium">{selectedCase.diagnosis || 'Pending Analysis'}</p>
                                </div>
                                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                                    <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wider mb-2">Treatment Plan</p>
                                    <p className="text-sm text-emerald-900 font-medium">{selectedCase.treatment_plan || 'Pending Plan'}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* AI Engine Section */}
                    {selectedCase && (
                        <AIDiagnosticEngine caseId={selectedCase.id} />
                    )}

                    {/* ECG Chart Snapshot */}
                    {selectedCase && selectedCase.heart_rate && (
                        <ECGWidget heartRate={selectedCase.heart_rate} />
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { Activity, Thermometer, User, Pill, ActivitySquare, AlertCircle } from 'lucide-react';

export default function NewCasePage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Patient Dropdown State
    const [patients, setPatients] = useState<any[]>([]);
    const [isLoadingPatients, setIsLoadingPatients] = useState(true);

    const [formData, setFormData] = useState({
        patient_id: '',
        heart_rate: '',
        blood_pressure: '',
        body_temperature: '',
        symptoms: '',
        diagnosis: '',
        treatment_plan: '',
        hemoglobin: '',
        wbc: '',
        platelets: ''
    });

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const res = await api.get('/patients/');
                setPatients(res.data);
                if (res.data.length > 0) {
                    setFormData(prev => ({ ...prev, patient_id: res.data[0].id.toString() }));
                }
            } catch (err: any) {
                console.error("Failed to fetch patients", err);
                setError("Hastalar yüklenemedi. Lütfen önce bir hasta kaydı oluşturun.");
            } finally {
                setIsLoadingPatients(false);
            }
        };
        fetchPatients();
    }, []); // Removed dependency array on patients to prevent infinite loops, but ensure initial set works.

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        // Format for backend
        const payload = {
            patient_id: parseInt(formData.patient_id),
            heart_rate: formData.heart_rate ? parseInt(formData.heart_rate) : null,
            blood_pressure: formData.blood_pressure || null,
            body_temperature: formData.body_temperature ? parseFloat(formData.body_temperature) : null,
            symptoms: formData.symptoms,
            diagnosis: formData.diagnosis || null,
            treatment_plan: formData.treatment_plan || null,
            blood_test: (formData.hemoglobin || formData.wbc || formData.platelets) ? {
                hemoglobin: formData.hemoglobin ? parseFloat(formData.hemoglobin) : null,
                wbc: formData.wbc ? parseFloat(formData.wbc) : null,
                platelets: formData.platelets ? parseFloat(formData.platelets) : null,
            } : null
        };

        try {
            await api.post('/cases/', payload);
            router.push('/cases');
        } catch (err: any) {
            console.error("Case Submission Error Details:", err.response?.data || err);

            let errorMsg = "Failed to submit new case.";
            if (err.response?.data?.detail) {
                if (typeof err.response.data.detail === 'string') {
                    errorMsg = err.response.data.detail;
                } else if (Array.isArray(err.response.data.detail)) {
                    // Handle FastAPI validation error list
                    errorMsg = "Validation Error: " + err.response.data.detail.map((e: any) => e.msg).join(', ');
                }
            }

            setError(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">New Clinical Case</h1>
                    <p className="text-slate-500 mt-1">Submit patient data to trigger AI analysis</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100 font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                                <User className="text-blue-500 mr-2" size={20} />
                                Basic Information
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Select Patient *</label>
                                {isLoadingPatients ? (
                                    <div className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 text-sm flex items-center">
                                        <Activity className="animate-spin mr-2" size={16} /> Hastalar Yükleniyor...
                                    </div>
                                ) : patients.length === 0 ? (
                                    <div className="w-full px-4 py-2 border border-red-200 rounded-xl bg-red-50 text-red-600 text-sm">
                                        Sistemde kayıtlı hasta bulunamadı.
                                    </div>
                                ) : (
                                    <select
                                        required
                                        name="patient_id"
                                        value={formData.patient_id}
                                        onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 bg-white"
                                    >
                                        {patients.map((p: any) => (
                                            <option key={p.id} value={p.id.toString()}>
                                                ID: {p.id} - {p.full_name} ({p.age}y, {p.gender})
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Symptoms *</label>
                                <input required type="text" name="symptoms" value={formData.symptoms} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900" placeholder="Describe main symptoms" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center">
                            <ActivitySquare className="text-emerald-500 mr-2" size={20} />
                            Vitals
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Heart Rate (bpm)</label>
                                <input type="number" name="heart_rate" value={formData.heart_rate} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-900" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Blood Pressure</label>
                                <input type="text" name="blood_pressure" value={formData.blood_pressure} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-900" placeholder="e.g. 120/80" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Body Temperature (°C)</label>
                                <input type="number" step="0.1" name="body_temperature" value={formData.body_temperature} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-900" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center">
                            <Thermometer className="text-red-500 mr-2" size={20} />
                            Blood Test Results
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Hemoglobin (g/dL)</label>
                                <input type="number" step="0.1" name="hemoglobin" value={formData.hemoglobin} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-slate-900" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">WBC (10^9/L)</label>
                                <input type="number" step="0.1" name="wbc" value={formData.wbc} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-slate-900" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Platelets (10^9/L)</label>
                                <input type="number" step="0.1" name="platelets" value={formData.platelets} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-slate-900" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center">
                            <Pill className="text-purple-500 mr-2" size={20} />
                            Evaluation (Optional)
                        </h3>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Diagnosis</label>
                                <input type="text" name="diagnosis" value={formData.diagnosis} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none text-slate-900" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Treatment Plan</label>
                                <textarea rows={3} name="treatment_plan" value={formData.treatment_plan} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none text-slate-900"></textarea>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 pb-10">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors mr-4"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-8 py-3 bg-blue-600 text-white rounded-xl font-medium shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-75 flex items-center"
                        >
                            {isSubmitting ? (
                                <Activity className="animate-spin mr-2" size={20} />
                            ) : null}
                            {isSubmitting ? 'Sumitting Case...' : 'Submit Case to AI Engine'}
                        </button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}

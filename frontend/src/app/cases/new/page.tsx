"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { Activity, Thermometer, User, Pill, ActivitySquare } from 'lucide-react';

export default function NewCasePage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
            setError(err.response?.data?.detail || "Failed to submit new case.");
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
                        <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center">
                            <User className="text-blue-500 mr-2" size={20} />
                            Basic Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Patient ID *</label>
                                <input required type="number" name="patient_id" value={formData.patient_id} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900" placeholder="e.g. 1" />
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

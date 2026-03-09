"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { UserPlus, Activity, User, Calendar, Users } from 'lucide-react';

export default function NewPatientPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        full_name: '',
        age: '',
        gender: 'Erkek'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const payload = {
            full_name: formData.full_name,
            age: parseInt(formData.age),
            gender: formData.gender
        };

        try {
            await api.post('/patients/', payload);
            // Başarılı olunca doğrudan yeni vaka ekleme ekranına yönlendir 
            // ki hemen o hastayı seçip vaka girebilsin.
            router.push('/cases/new');
        } catch (err: any) {
            setError(err.response?.data?.detail || "Hasta eklenirken bir hata oluştu.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto h-full flex flex-col pt-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center">
                        <UserPlus className="mr-3 text-emerald-500" size={32} />
                        Yeni Hasta Kaydı
                    </h1>
                    <p className="text-slate-500 mt-2">Sisteme yeni bir hasta profili ekleyin. Tıbbi vakalar bu profile bağlanacaktır.</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100 font-medium">
                        {error}
                    </div>
                )}

                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex-1">
                    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Ad Soyad *</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User size={18} className="text-slate-400" />
                                </div>
                                <input
                                    required
                                    type="text"
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-900 bg-slate-50"
                                    placeholder="Örn: Ahmet Yılmaz"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Yaş *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Calendar size={18} className="text-slate-400" />
                                    </div>
                                    <input
                                        required
                                        type="number"
                                        min="0"
                                        max="120"
                                        name="age"
                                        value={formData.age}
                                        onChange={handleChange}
                                        className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-900 bg-slate-50"
                                        placeholder="35"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Cinsiyet *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Users size={18} className="text-slate-400" />
                                    </div>
                                    <select
                                        required
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-900 bg-slate-50 appearance-none"
                                    >
                                        <option value="Erkek">Erkek</option>
                                        <option value="Kadın">Kadın</option>
                                        <option value="Diğer">Diğer</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 mt-6 border-t border-slate-100 flex items-center gap-4">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-sm hover:bg-emerald-700 focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors disabled:opacity-75 flex items-center justify-center"
                            >
                                {isSubmitting ? (
                                    <Activity className="animate-spin mr-2" size={20} />
                                ) : <UserPlus className="mr-2" size={20} />}
                                {isSubmitting ? 'Kaydediliyor...' : 'Hastayı Kaydet'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}

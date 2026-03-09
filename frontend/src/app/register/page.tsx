"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Mail, Lock, Activity, User, ShieldCheck, Stethoscope } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        tc_kimlik: '',
        role: 'doctor', // Default role
        password: '',
        // Optional Fields
        date_of_birth: '',
        gender: '',
        height: '',
        weight: '',
        blood_type: ''
    });
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const router = useRouter();
    const { login } = useAuth();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const payload = {
                ...formData,
                date_of_birth: formData.date_of_birth || null,
                gender: formData.gender || null,
                height: formData.height ? parseFloat(formData.height) : null,
                weight: formData.weight ? parseFloat(formData.weight) : null,
                blood_type: formData.blood_type || null
            };

            await api.post('/register/', payload);
            // Registration successful! Now let's automatically log them in
            const loginData = new URLSearchParams();
            loginData.append('username', formData.email);
            loginData.append('password', formData.password);

            const res = await api.post('/login/', loginData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            await login(res.data.access_token);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.detail || "Kayıt işlemi başarısız oldu. Lütfen bilgilerinizi kontrol edin.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex text-slate-900 bg-slate-50 font-sans">
            {/* Left Form Side */}
            <div className="w-full lg:w-[55%] flex items-center justify-center p-8 bg-white overflow-y-auto">
                <div className="w-full max-w-lg">
                    <div className="text-center mb-10 pt-8">
                        <div className="lg:hidden flex items-center justify-center mb-8">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mr-3">
                                <Activity className="text-white" size={20} />
                            </div>
                            <h1 className="text-xl font-bold tracking-tight text-slate-900">MediCore<span className="text-blue-600">AI</span></h1>
                        </div>

                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Yeni Hesap Oluştur</h2>
                        <p className="text-slate-500 mt-2">Sağlık profesyonelleri için gizlilik odaklı vaka ağı.</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100 font-medium text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700">Ad Soyad</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <User size={18} className="text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="block w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl bg-slate-50/50 shadow-sm text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900"
                                        placeholder="Dr. Ayşe Yılmaz"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700">TC Kimlik No</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <ShieldCheck size={18} className="text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="tc_kimlik"
                                        value={formData.tc_kimlik}
                                        onChange={handleChange}
                                        className="block w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl bg-slate-50/50 shadow-sm text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900"
                                        placeholder="11111111111"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700">Email Adresi</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail size={18} className="text-slate-400" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="block w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl bg-slate-50/50 shadow-sm text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900"
                                    placeholder="doktor@hastane.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700">Rol</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Stethoscope size={18} className="text-slate-400" />
                                </div>
                                <select
                                    required
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="block w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl bg-slate-50/50 shadow-sm text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                                >
                                    <option value="doctor">Doktor</option>
                                    <option value="patient">Hasta</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700">Şifre</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock size={18} className="text-slate-400" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="block w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl bg-slate-50/50 shadow-sm text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900"
                                    placeholder="En az 8 karakter"
                                />
                            </div>
                        </div>

                        {/* Ek Bilgiler (Opsiyonel) */}
                        <div className="pt-4 border-t border-slate-100 mt-4 space-y-5">
                            <h3 className="text-sm font-semibold text-slate-800">Kişisel / Fiziksel Bilgiler (Opsiyonel)</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Doğum Tarihi</label>
                                    <input
                                        type="date"
                                        name="date_of_birth"
                                        value={formData.date_of_birth}
                                        onChange={handleChange}
                                        className="block w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50/50 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Cinsiyet</label>
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        className="block w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50/50 shadow-sm text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                                    >
                                        <option value="">Seçiniz</option>
                                        <option value="Erkek">Erkek</option>
                                        <option value="Kadın">Kadın</option>
                                        <option value="Diğer">Diğer</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Boy (cm)</label>
                                    <input
                                        type="number"
                                        name="height"
                                        value={formData.height}
                                        onChange={handleChange}
                                        className="block w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50/50 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900"
                                        placeholder="175"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Kilo (kg)</label>
                                    <input
                                        type="number"
                                        name="weight"
                                        value={formData.weight}
                                        onChange={handleChange}
                                        className="block w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50/50 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900"
                                        placeholder="70.5"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Kan Grubu</label>
                                    <select
                                        name="blood_type"
                                        value={formData.blood_type}
                                        onChange={handleChange}
                                        className="block w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50/50 shadow-sm text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                                    >
                                        <option value="">Seçiniz</option>
                                        <option value="A+">A+</option>
                                        <option value="A-">A-</option>
                                        <option value="B+">B+</option>
                                        <option value="B-">B-</option>
                                        <option value="AB+">AB+</option>
                                        <option value="AB-">AB-</option>
                                        <option value="O+">O+</option>
                                        <option value="O-">O-</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-2xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-75 mt-8"
                        >
                            {isSubmitting ? <Activity className="animate-spin mr-2" size={18} /> : null}
                            {isSubmitting ? 'Hesap Oluşturuluyor...' : 'Hemen Kayıt Ol'}
                        </button>
                    </form>

                    <div className="mt-8 mb-8 text-center text-sm font-medium text-slate-600">
                        Zaten bir hesabınız var mı?{' '}
                        <Link href="/login" className="text-blue-600 hover:text-blue-500 transition-colors">
                            Giriş Yapın
                        </Link>
                    </div>
                </div>
            </div>

            {/* Right Graphic Side */}
            <div className="hidden lg:flex lg:w-[45%] p-12 flex-col justify-end relative overflow-hidden bg-slate-900 border-l border-slate-800">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center opacity-20 filter grayscale"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent z-0"></div>

                <div className="z-10 absolute top-12 right-12 flex items-center opacity-50 hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mr-3 backdrop-blur-sm border border-white/10">
                        <Activity className="text-white" size={20} />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white">MediCore<span className="text-blue-400">AI</span></span>
                </div>

                <div className="z-10 relative">
                    <div className="flex gap-2 mb-6">
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-bold uppercase tracking-wider backdrop-blur-sm">Doktor Ağı</span>
                        <span className="px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg text-xs font-bold uppercase tracking-wider backdrop-blur-sm">Güvenli Veri</span>
                    </div>
                    <h2 className="text-3xl font-bold text-white leading-tight mb-4">
                        Klinik tecrübeyi,<br />yapay zeka analizleriyle<br />birleştirin.
                    </h2>
                    <p className="text-slate-400 leading-relaxed max-w-md">
                        Hasta verilerinizi güvenle paylaşın, global tıbbi literatür ile eğitilmiş büyük dil modellerinden anında fikir alın.
                    </p>
                </div>
            </div>
        </div>
    );
}

"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Mail, Lock, Activity, User, ShieldCheck, Stethoscope, HeartPulse } from 'lucide-react';
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
        <div className="min-h-screen flex text-slate-900 font-sans relative overflow-hidden bg-slate-900 bg-[url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center">
            {/* Global Overlay for entire image */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-900/70 to-blue-900/80 z-0"></div>
            
            {/* Subtle animated blobs */}
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDuration: "8s" }}></div>
            <div className="absolute top-48 -right-24 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDuration: "12s" }}></div>

            {/* Left Graphic Side */}
            <div className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-between relative z-10">
                <div className="flex items-center mb-8">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mr-4 shadow-lg shadow-blue-500/30">
                        <HeartPulse className="text-white" size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-white">Med<span className="text-blue-400">+</span></h1>
                        <p className="text-sm font-medium text-slate-400">Tıbbi Sosyal Medya & Vaka Paylaşımı</p>
                    </div>
                </div>

                <div className="max-w-lg mb-12">
                    <h2 className="text-4xl font-extrabold text-white leading-tight mb-6 tracking-tight">
                        Klinik tecrübeyi,<br />
                        <span className="text-blue-400">ortak akılla</span><br />birleştirin.
                    </h2>
                    <p className="text-lg text-slate-300 mb-8 border-l-2 border-blue-500 pl-4 py-1 leading-relaxed">
                        Sadece doğrulanmış doktorlardan oluşan bu ağda vakalarınızı güvenle paylaşın ve global meslektaşlarınızdan geri bildirim alın.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <div className="flex items-center text-sm font-medium text-slate-300 bg-white/5 px-4 py-2.5 rounded-xl border border-white/10 backdrop-blur-md">
                            <Activity size={18} className="text-blue-400 mr-2" /> Vaka Odaklı Klinik Akış
                        </div>
                        <div className="flex items-center text-sm font-medium text-slate-300 bg-white/5 px-4 py-2.5 rounded-xl border border-white/10 backdrop-blur-md">
                            <BookOpen size={18} className="text-purple-400 mr-2" /> Kapsamlı Klinik Literatür
                        </div>
                    </div>
                </div>
                <div className="text-slate-500 text-sm font-medium">
                    © 2026 Med+ Systems. Tüm hakları saklıdır.
                </div>
            </div>

            {/* Right Form Side (Full height frosted glass panel) */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10 bg-slate-900/10 backdrop-blur-xl border-l border-white/10 overflow-y-auto">
                <div className="w-full max-w-xl relative z-10 py-8">
                    <div className="text-center mb-10">
                        <div className="lg:hidden flex items-center justify-center mb-8">
                            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-blue-500/30">
                                <HeartPulse className="text-white" size={24} strokeWidth={2.5} />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight text-white">Med<span className="text-blue-400">+</span></h1>
                        </div>

                        <h2 className="text-3xl font-bold text-white tracking-tight">Yeni Hesap Oluştur</h2>
                        <p className="text-slate-300 mt-2 font-medium">Sağlık profesyonelleri için gizlilik odaklı klinik vaka ağı.</p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 text-red-400 p-4 rounded-xl mb-6 border border-red-500/20 font-medium text-sm flex items-start backdrop-blur-sm">
                            <ShieldCheck className="shrink-0 mr-2" size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl p-10 space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Ad Soyad</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                        <User size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl text-sm bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder-slate-500"
                                        placeholder="Dr. Ayşe Yılmaz"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-1.5">TC Kimlik No</label>
                                <input
                                    type="text"
                                    required
                                    name="tc_kimlik"
                                    value={formData.tc_kimlik}
                                    onChange={handleChange}
                                    className="block w-full px-4 py-3 border border-white/10 rounded-xl text-sm bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder-slate-500"
                                    placeholder="11111111111"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-1.5">Email Adresi</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl text-sm bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder-slate-500"
                                    placeholder="dr.isim@hastane.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-1.5">Şifre</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    required
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl text-sm bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder-slate-500"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <hr className="border-white/10 my-6" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Doğum Tarihi</label>
                                <input
                                    type="date"
                                    name="date_of_birth"
                                    value={formData.date_of_birth}
                                    onChange={handleChange}
                                    className="block w-full px-4 py-3 border border-white/10 rounded-xl text-sm bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Cinsiyet</label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    className="block w-full px-4 py-3 border border-white/10 rounded-xl text-sm bg-white/5 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all appearance-none"
                                >
                                    <option value="" className="text-slate-900">Seçiniz</option>
                                    <option value="Erkek" className="text-slate-900">Erkek</option>
                                    <option value="Kadın" className="text-slate-900">Kadın</option>
                                    <option value="Diğer" className="text-slate-900">Diğer</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Boy (cm)</label>
                                <input
                                    type="number"
                                    name="height"
                                    value={formData.height}
                                    onChange={handleChange}
                                    className="block w-full px-4 py-3 border border-white/10 rounded-xl text-sm bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder-slate-500"
                                    placeholder="175"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Kilo (kg)</label>
                                <input
                                    type="number"
                                    name="weight"
                                    value={formData.weight}
                                    onChange={handleChange}
                                    className="block w-full px-4 py-3 border border-white/10 rounded-xl text-sm bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder-slate-500"
                                    placeholder="70.5"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Kan Grubu</label>
                                <select
                                    name="blood_type"
                                    value={formData.blood_type}
                                    onChange={handleChange}
                                    className="block w-full px-4 py-3 border border-white/10 rounded-xl text-sm bg-white/5 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all appearance-none"
                                >
                                    <option value="" className="text-slate-900">Seçiniz</option>
                                    <option value="A+" className="text-slate-900">A+</option>
                                    <option value="A-" className="text-slate-900">A-</option>
                                    <option value="B+" className="text-slate-900">B+</option>
                                    <option value="B-" className="text-slate-900">B-</option>
                                    <option value="AB+" className="text-slate-900">AB+</option>
                                    <option value="AB-" className="text-slate-900">AB-</option>
                                    <option value="O+" className="text-slate-900">O+</option>
                                    <option value="O-" className="text-slate-900">O-</option>
                                </select>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full flex justify-center items-center py-3.5 px-4 mt-8 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                        >
                            {isSubmitting ? (
                                <Activity className="animate-spin" size={18} />
                            ) : (
                                'Hemen Kayıt Ol'
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm font-medium text-slate-400">
                        Zaten bir hesabınız var mı?{' '}
                        <Link href="/login" className="font-bold text-blue-400 hover:text-blue-300 transition-colors">
                            Giriş Yapın
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

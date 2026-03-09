"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Mail, Lock, Activity, ShieldCheck, User } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const router = useRouter();
    const { login } = useAuth(); // Has login(token)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        // FastAPI OAuth2PasswordRequestForm expects form-data URL encoded!
        const formData = new URLSearchParams();
        formData.append('username', email); // OAuth2 expects 'username' field for email
        formData.append('password', password);

        try {
            const res = await api.post('/login/', formData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            // Calling auth context login, which stores token and redirects to /cases
            await login(res.data.access_token);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.detail || "Giriş başarısız. Lütfen bilgilerinizi kontrol edin.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex text-slate-900 bg-slate-50 font-sans">
            {/* Left Graphic Side */}
            <div className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-between relative overflow-hidden bg-slate-900">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-purple-900/40 to-slate-900 z-0"></div>
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute top-48 -right-24 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

                <div className="z-10 flex items-center mb-8">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mr-4">
                        <Activity className="text-white" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-white">MediCore<span className="text-blue-400">AI</span></h1>
                        <p className="text-sm font-medium text-slate-400">Clinical Case Exchange Platform</p>
                    </div>
                </div>

                <div className="z-10 max-w-lg mb-12">
                    <h2 className="text-4xl font-bold text-white leading-tight mb-6">
                        Yapay Zeka Destekli <br />İkinci Görüş.
                    </h2>
                    <p className="text-lg text-slate-300 mb-8 border-l-2 border-blue-500 pl-4 py-1">
                        Sisteme giriş yaparak anonim vaka paylaşım ağına dahil olun, anında yapay zeka destekli tıbbi analizler alın.
                    </p>
                    <div className="flex gap-4">
                        <div className="flex items-center text-sm font-medium text-slate-300 bg-white/5 px-4 py-2 rounded-lg border border-white/10">
                            <ShieldCheck size={18} className="text-emerald-400 mr-2" /> 256-bit Şifreleme
                        </div>
                        <div className="flex items-center text-sm font-medium text-slate-300 bg-white/5 px-4 py-2 rounded-lg border border-white/10">
                            <Activity size={18} className="text-blue-400 mr-2" /> Gemini 3.1 Flash LLM
                        </div>
                    </div>
                </div>
                <div className="z-10 text-slate-500 text-sm">
                    © 2026 MediCore AI Systems. Tüm hakları saklıdır.
                </div>
            </div>

            {/* Right Form Side */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-md">
                    <div className="text-center mb-10">
                        <div className="lg:hidden flex items-center justify-center mb-8">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mr-3">
                                <Activity className="text-white" size={20} />
                            </div>
                            <h1 className="text-xl font-bold tracking-tight text-slate-900">MediCore<span className="text-blue-600">AI</span></h1>
                        </div>

                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Tekrar Hoş Geldiniz</h2>
                        <p className="text-slate-500 mt-2">Hesabınıza giriş yaparak vakalarınızı yönetin.</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100 font-medium text-sm flex items-start">
                            <AlertCircle size={18} className="mr-2 flex-shrink-0 mt-0.5" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700">Email Adresi</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail size={18} className="text-slate-400" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl bg-slate-50/50 shadow-sm text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900"
                                    placeholder="doktor@hastane.com"
                                />
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
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl bg-slate-50/50 shadow-sm text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center">
                                <input id="remember-me" type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600">
                                    Beni hatırla
                                </label>
                            </div>
                            <div className="text-sm text-blue-600 font-medium hover:text-blue-500 cursor-pointer transition-colors">
                                Şifremi unuttum?
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-2xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-75 disabled:cursor-not-allowed mt-4"
                        >
                            {isSubmitting ? <Activity className="animate-spin mr-2" size={18} /> : null}
                            {isSubmitting ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm font-medium text-slate-600">
                        Henüz hesabınız yok mu?{' '}
                        <Link href="/register" className="text-blue-600 hover:text-blue-500 transition-colors">
                            Hemen Kayıt Olun
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
// HACK for missing AlertCircle
const AlertCircle = ({ size, className }: { size: number, className: string }) => <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>;

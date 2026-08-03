"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Mail, Lock, Activity, ShieldCheck, User, HeartPulse, BookOpen } from 'lucide-react';
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
        <div className="min-h-screen flex text-slate-900 font-sans relative overflow-hidden bg-slate-900 bg-[url('/Clinical-decision-support.webp')] bg-cover bg-center">
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
                        Klinik Deneyimleri Birleştiren<br />
                        <span className="text-blue-400">Sosyal Ağ.</span>
                    </h2>
                    <p className="text-lg text-slate-300 mb-8 border-l-2 border-blue-500 pl-4 py-1 leading-relaxed">
                        Med+ ağına katılarak zorlu klinik vakaları inceleyin, anonim olarak kendi vakalarınızı paylaşın ve dünyanın dört bir yanındaki uzmanlarla anında fikir alışverişinde bulunun.
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
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10 bg-slate-900/10 backdrop-blur-xl border-l border-white/10">
                <div className="w-full max-w-lg relative z-10">
                    <div className="text-center mb-10">
                        <div className="lg:hidden flex items-center justify-center mb-8">
                            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-blue-500/30">
                                <HeartPulse className="text-white" size={24} strokeWidth={2.5} />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight text-white">Med<span className="text-blue-400">+</span></h1>
                        </div>

                        <h2 className="text-3xl font-bold text-white tracking-tight">Tekrar Hoş Geldiniz</h2>
                        <p className="text-slate-300 mt-2 font-medium">Hesabınıza giriş yaparak meslektaşlarınızla bağlantıda kalın.</p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 text-red-400 p-4 rounded-xl mb-6 border border-red-500/20 font-medium text-sm flex items-start backdrop-blur-sm">
                            <ShieldCheck className="shrink-0 mr-2" size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl p-10">
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Email Adresi</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                        <Mail size={18} />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl text-sm bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder-slate-500"
                                        placeholder="dr.isim@hastane.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={isSubmitting}
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
                                        className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl text-sm bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder-slate-500"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-6 mb-8">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-white/20 bg-white/5 rounded cursor-pointer"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-300 cursor-pointer select-none font-medium">
                                    Beni hatırla
                                </label>
                            </div>
                            <div className="text-sm">
                                <a href="#" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                                    Şifremi unuttum?
                                </a>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                        >
                            {isSubmitting ? (
                                <Activity className="animate-spin" size={18} />
                            ) : (
                                'Giriş Yap'
                            )}
                        </button>
                        
                        <div className="mt-8 text-center text-sm font-medium text-slate-400">
                            Henüz hesabınız yok mu?{' '}
                            <Link href="/register" className="font-bold text-blue-400 hover:text-blue-300 transition-colors">
                                Hemen Kayıt Olun
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
// HACK for missing AlertCircle
const AlertCircle = ({ size, className }: { size: number, className: string }) => <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>;

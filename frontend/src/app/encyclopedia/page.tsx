"use client";

import { useState, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { Search, BookOpen, Lightbulb, BookMarked, Loader2, AlertTriangle, Sparkles, Bookmark } from 'lucide-react';

interface EncyclopediaCase {
    baslik: string;
    ozet: string;
    ders: string;
    kaynak_baslik: string;
    yayin_tarihi: string;
    etiketler?: string[];
}

const SUGGESTED_QUERIES = [
    'myocardial infarction', 'pneumonia', 'diabetes', 'stroke',
    'appendicitis', 'sepsis', 'anemia', 'hypertension',
];

export default function EncyclopediaPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<EncyclopediaCase[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searched, setSearched] = useState(false);
    const [bookmarked, setBookmarked] = useState<Record<number, boolean>>({});
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSearch = async (q?: string) => {
        const term = q ?? query;
        if (!term.trim()) return;
        setIsLoading(true);
        setError(null);
        setSearched(true);
        if (q) setQuery(q);

        try {
            const res = await api.get('/api/encyclopedia/cases', { params: { query: term } });
            setResults(res.data.results || []);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Bir hata oluştu. Lütfen tekrar deneyin.');
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DashboardLayout>
            {/* Hero Header */}
            <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-sm font-semibold mb-4 border border-indigo-100">
                    <Sparkles size={14} />
                    RAG · Europe PMC · Med+ AI
                </div>
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
                    Tıbbi Vaka <span className="text-indigo-600">Arşivi</span>
                </h1>
                <p className="text-slate-500 max-w-xl mx-auto text-base">
                    Gerçek klinik vaka raporlarını Yapay Zeka ile keşfedin. Hastalık adı veya semptom girin, anında Türkçe özetler alın.
                </p>
            </div>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
                <div className="relative flex items-center bg-white border-2 border-slate-200 rounded-2xl shadow-sm focus-within:border-indigo-400 focus-within:shadow-md transition-all">
                    <Search className="absolute left-5 text-slate-400" size={20} />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-full pl-14 pr-4 py-4 rounded-2xl bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none text-base"
                        placeholder="Hastalık veya semptom ara... (örn: pneumonia, chest pain)"
                    />
                    <button
                        onClick={() => handleSearch()}
                        disabled={isLoading || !query.trim()}
                        className="mr-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 shrink-0"
                    >
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                        {isLoading ? 'Aranıyor...' : 'Ara'}
                    </button>
                </div>

                {/* Suggested Queries */}
                <div className="flex flex-wrap gap-2 mt-3 justify-center">
                    {SUGGESTED_QUERIES.map((sq) => (
                        <button
                            key={sq}
                            onClick={() => handleSearch(sq)}
                            className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-xs font-medium transition-colors border border-transparent hover:border-indigo-200"
                        >
                            {sq}
                        </button>
                    ))}
                </div>
            </div>

            {/* States */}
            {isLoading && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <div className="relative mb-6">
                        <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center">
                            <Loader2 className="animate-spin text-indigo-500" size={32} />
                        </div>
                    </div>
                    <p className="font-medium text-slate-600">Europe PMC'den vakalar yükleniyor...</p>
                    <p className="text-sm mt-1">Med+ AI özetleri hazırlıyor, bu 10-20 saniye sürebilir.</p>
                </div>
            )}

            {error && !isLoading && (
                <div className="max-w-xl mx-auto mt-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl p-4 flex items-start gap-3">
                    <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            {!isLoading && searched && results.length === 0 && !error && (
                <div className="text-center py-16 text-slate-400">
                    <BookOpen size={40} className="mx-auto mb-3 text-slate-300" />
                    <p className="font-medium text-slate-600">Sonuç bulunamadı</p>
                    <p className="text-sm mt-1">Farklı bir arama terimi deneyin (İngilizce terimler daha iyi sonuç verir).</p>
                </div>
            )}

            {!isLoading && !searched && (
                <div className="text-center py-16 text-slate-300">
                    <BookOpen size={48} className="mx-auto mb-3" />
                    <p className="text-slate-400 font-medium">Yukarıdaki arama çubuğunu kullanarak başlayın</p>
                </div>
            )}

            {/* Results Grid */}
            {!isLoading && results.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
                    {results.map((item, idx) => (
                        <div
                            key={idx}
                            className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4"
                        >
                            {/* Card Header */}
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5">
                                        <BookMarked size={18} className="text-indigo-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-slate-900 text-base leading-snug">{item.baslik}</h3>
                                        <p className="text-xs text-slate-400 mt-0.5 truncate">{item.kaynak_baslik} · {item.yayin_tarihi}</p>
                                    </div>
                                </div>

                                {/* Bookmark Button */}
                                <button
                                    onClick={() => setBookmarked(prev => ({ ...prev, [idx]: !prev[idx] }))}
                                    className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                                        bookmarked[idx]
                                            ? 'bg-indigo-100 text-indigo-600'
                                            : 'text-slate-300 hover:text-indigo-500 hover:bg-indigo-50'
                                    }`}
                                    title="Kaydet"
                                >
                                    <Bookmark size={16} fill={bookmarked[idx] ? 'currentColor' : 'none'} />
                                </button>
                            </div>

                            {/* Summary */}
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                <p className="text-sm text-slate-700 leading-relaxed">{item.ozet}</p>
                            </div>

                            {/* Medical Tags */}
                            {item.etiketler && item.etiketler.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {item.etiketler.map(tag => (
                                        <span
                                            key={tag}
                                            className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Takeaway */}
                            <div className="flex items-start gap-2 bg-amber-50 rounded-2xl p-3 border border-amber-100">
                                <Lightbulb size={16} className="text-amber-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-0.5">Klinik Çıkarım</p>
                                    <p className="text-sm text-amber-900">{item.ders}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </DashboardLayout>
    );
}

"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import {
    HeartPulse, LogOut, ChevronRight, Check, FileText,
    Users, Building, Image as ImageIcon, Tags, Loader2, AlertCircle, CheckCircle2,
    Stethoscope, Target
} from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';

// Shared styles matching the feed
const GLASS = "bg-white/40 backdrop-blur-2xl border-[1.5px] border-slate-400/30 shadow-[0_8px_30px_rgba(0,0,0,0.05)] rounded-[1.5rem] p-6";

export default function CreatePostPage() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [showDropdown, setShowDropdown] = useState(false);

    // Form states
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [currentTag, setCurrentTag] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [findings, setFindings] = useState('');
    const [diagnosis, setDiagnosis] = useState('');
    const [status, setStatus] = useState('tartışılıyor');

    // Submit states
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const branches = [
        "Kardiyoloji", "Nöroloji", "Dahiliye", "Pediatri",
        "Genel Cerrahi", "Ortopedi", "Göz Hastalıkları", "Psikiyatri",
        "Romatoloji", "Endokrinoloji", "Gastroenteroloji", "Pulmoloji"
    ];

    const toggleBranch = (branch: string) => {
        if (selectedBranches.includes(branch)) {
            setSelectedBranches(selectedBranches.filter(b => b !== branch));
        } else {
            setSelectedBranches([...selectedBranches, branch]);
        }
    };

    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && currentTag.trim() !== '') {
            e.preventDefault();
            const formatted = currentTag.trim().startsWith('#') ? currentTag.trim() : `#${currentTag.trim()}`;
            if (!tags.includes(formatted)) {
                setTags([...tags, formatted]);
            }
            setCurrentTag('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    // Strip HTML from RichTextEditor output to get clean plain text
    const getPlainText = (html: string) => {
        return html
            .replace(new RegExp('</?(?:p|div|br|h[1-6])[^>]*>', 'gi'), '\n')
            .replace(new RegExp('<[^>]*>', 'g'), '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    };

    const getPlainContent = () => {
        const plainBody = getPlainText(content);
        const parts: string[] = [];

        // Title as a clean first paragraph
        if (title.trim()) parts.push(title.trim());
        if (plainBody) parts.push(plainBody);

        // Patient demographics as a separate labeled paragraph
        if (age || gender) {
            const demographics: string[] = [];
            if (age) demographics.push(`Yaş: ${age}`);
            if (gender) demographics.push(`Cinsiyet: ${gender}`);
            parts.push(`[Hasta Bilgileri: ${demographics.join(', ')}]`);
        }
        
        // Findings
        if (findings.trim()) {
            parts.push(`*Muayene Bulguları:*\n${findings.trim()}`);
        }
        
        // Diagnosis / Conclusion
        if (diagnosis.trim()) {
            parts.push(`*Sonuç / Teşhis:*\n${diagnosis.trim()}`);
        }

        return parts.join('\n\n');
    };

    const handlePublish = async () => {
        const finalContent = getPlainContent();

        // Validation
        if (!finalContent.trim() || finalContent.trim() === '**' || content.trim() === '<p></p>' || content.trim() === '') {
            setError('Lütfen vaka içeriği girin.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Include pending tag if user didn't press enter
            const allTags = [...tags];
            if (currentTag.trim()) {
                const formatted = currentTag.trim().startsWith('#') ? currentTag.trim() : `#${currentTag.trim()}`;
                if (!allTags.includes(formatted)) allTags.push(formatted);
            }

            const payload = {
                content: finalContent,
                category: selectedBranches.length > 0 ? selectedBranches.join(', ') : null,
                tags: allTags.length > 0 ? allTags.join(',') : null,
                image_url: imageUrl.trim() || null,
                status: status,
            };

            await api.post('/feed/posts/', payload);

            setSuccess(true);

            // Redirect to feed after short delay
            setTimeout(() => {
                router.push('/feed');
            }, 1500);

        } catch (err: any) {
            const msg = err?.response?.data?.detail || 'Bir hata oluştu. Lütfen tekrar deneyin.';
            setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 relative font-sans text-slate-800"
             style={{ background: "linear-gradient(135deg, #ede9fe 0%, #f5f3ff 20%, #faf5ff 40%, #ecfeff 70%, #f0fdfa 100%)" }}
        >
            {/* Animated Background Blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-violet-300/30 blur-3xl animate-pulse" style={{ animationDuration: "7s" }} />
                <div className="absolute top-1/3 -right-20 w-[400px] h-[400px] rounded-full bg-cyan-300/30 blur-3xl animate-pulse" style={{ animationDuration: "9s" }} />
                <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] rounded-full bg-fuchsia-200/20 blur-3xl animate-pulse" style={{ animationDuration: "11s" }} />
            </div>

            {/* Success Overlay */}
            {success && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/60 backdrop-blur-md">
                    <div className="flex flex-col items-center gap-4 bg-white rounded-3xl shadow-2xl p-10 border border-green-100">
                        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                            <CheckCircle2 size={40} className="text-green-500" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">Vaka Başarıyla Yayınlandı!</h2>
                        <p className="text-slate-500 text-sm">Sosyal akışa yönlendiriliyorsunuz...</p>
                        <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full animate-[progress_1.5s_linear_forwards]" />
                        </div>
                    </div>
                </div>
            )}

            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 w-full bg-white/40 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
                <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
                    {/* Left: Breadcrumb */}
                    <div className="flex items-center gap-2">
                        <Link href="/feed" className="flex items-center gap-2.5 font-bold text-slate-800 hover:text-blue-600 transition-colors mr-4">
                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                <HeartPulse size={22} className="text-white" strokeWidth={2.5} />
                            </div>
                            <span className="text-2xl tracking-tight hidden sm:block">Med<span className="text-blue-600">+</span></span>
                        </Link>

                        <div className="h-6 w-px bg-slate-300 mx-2 hidden sm:block"></div>

                        <div className="flex items-center text-sm font-medium text-slate-500 gap-1.5">
                            <Link href="/feed" className="hover:text-blue-600 transition-colors">Sosyal Akış</Link>
                            <ChevronRight size={14} className="text-slate-400" />
                            <span className="text-slate-800 font-semibold">Yeni Vaka Paylaş</span>
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.push('/feed')}
                            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 bg-white/60 hover:bg-white/80 border border-slate-200/60 shadow-sm transition-all hidden sm:block"
                        >
                            İptal
                        </button>
                        <button
                            onClick={handlePublish}
                            disabled={isSubmitting || success}
                            className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed shadow-md transition-all flex items-center gap-1.5"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Yayınlanıyor...
                                </>
                            ) : (
                                <>
                                    <Check size={16} />
                                    Yayınla
                                </>
                            )}
                        </button>

                        <div className="w-px h-6 bg-slate-200 mx-1"></div>

                        {/* Avatar */}
                        <div className="relative">
                            <button
                                onClick={() => setShowDropdown(!showDropdown)}
                                className="flex items-center hover:opacity-80 transition-opacity"
                            >
                                <img
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=c7d2fe&color=3730a3&bold=true`}
                                    alt="Avatar"
                                    className="w-9 h-9 rounded-full border-2 border-white shadow-sm"
                                />
                            </button>

                            {showDropdown && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 py-1 z-50">
                                    <div className="px-4 py-3 border-b border-slate-50">
                                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Hesap</p>
                                        <p className="text-sm font-medium text-slate-900 truncate mt-0.5">{user?.email}</p>
                                    </div>
                                    <button
                                        onClick={() => { logout(); setShowDropdown(false); router.push('/login'); }}
                                        className="w-full flex items-center text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        <LogOut size={15} className="mr-2" />
                                        Çıkış Yap
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="relative z-10 max-w-4xl mx-auto px-4 pt-24 pb-12 space-y-6">

                {/* Error Banner */}
                {error && (
                    <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-red-700">
                        <AlertCircle size={20} className="shrink-0" />
                        <p className="text-sm font-medium">{error}</p>
                        <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                    </div>
                )}

                {/* 1. Main Editor Block */}
                <div className={`${GLASS} space-y-4`}>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-slate-500 font-semibold text-sm uppercase tracking-wider">
                            <FileText size={16} className="text-blue-500" />
                            Vaka Öyküsü
                        </div>
                        {/* Status Toggle */}
                        <div className="flex items-center gap-2 bg-slate-100/80 p-1 rounded-xl border border-slate-200/50">
                            <button
                                onClick={() => setStatus('tartışılıyor')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${status === 'tartışılıyor' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Tartışılıyor
                            </button>
                            <button
                                onClick={() => setStatus('teşhis kondu')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${status === 'teşhis kondu' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Teşhis Kondu
                            </button>
                        </div>
                    </div>

                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Vaka Başlığı (Örn: İdiyopatik Pulmoner Fibrozis Olgusu)..."
                        className="w-full bg-white/70 border-b-2 border-slate-200/60 px-4 py-4 text-2xl font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors rounded-t-xl"
                    />

                    <RichTextEditor content={content} onChange={setContent} />
                </div>

                {/* 1.5 Clinical Findings & Diagnosis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className={`${GLASS}`}>
                        <div className="flex items-center gap-2 mb-4 text-slate-500 font-semibold text-sm uppercase tracking-wider">
                            <Stethoscope size={16} className="text-blue-500" />
                            Muayene Bulguları <span className="text-slate-400 text-xs normal-case font-medium">(Opsiyonel)</span>
                        </div>
                        <textarea
                            value={findings}
                            onChange={(e) => setFindings(e.target.value)}
                            placeholder="Laboratuvar sonuçları, fizik muayene bulguları..."
                            className="w-full h-32 bg-white/70 border border-slate-200/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 resize-none"
                        />
                    </div>
                    <div className={`${GLASS}`}>
                        <div className="flex items-center gap-2 mb-4 text-slate-500 font-semibold text-sm uppercase tracking-wider">
                            <Target size={16} className="text-blue-500" />
                            Sonuç / Teşhis <span className="text-slate-400 text-xs normal-case font-medium">(Opsiyonel)</span>
                        </div>
                        <textarea
                            value={diagnosis}
                            onChange={(e) => setDiagnosis(e.target.value)}
                            placeholder={status === 'teşhis kondu' ? "Konulan kesin teşhis ve tedavi yaklaşımı..." : "Ön tanılar veya beklenen laboratuvar sonuçları..."}
                            className="w-full h-32 bg-white/70 border border-slate-200/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 resize-none"
                        />
                    </div>
                </div>

                {/* 2. Demographics (Optional) */}
                <div className={`${GLASS}`}>
                    <div className="flex items-center gap-2 mb-4 text-slate-500 font-semibold text-sm uppercase tracking-wider">
                        <Users size={16} className="text-blue-500" />
                        Hasta Demografik Bilgileri <span className="text-slate-400 text-xs normal-case font-medium">(Opsiyonel)</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Yaş</label>
                            <input
                                type="number"
                                value={age}
                                onChange={(e) => setAge(e.target.value)}
                                placeholder="Hastanın Yaşı"
                                className="w-full bg-white/70 border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Cinsiyet</label>
                            <select
                                value={gender}
                                onChange={(e) => setGender(e.target.value)}
                                className="w-full bg-white/70 border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 appearance-none"
                            >
                                <option value="">Seçiniz</option>
                                <option value="Erkek">Erkek</option>
                                <option value="Kadın">Kadın</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* 3. Category & Tags */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className={`${GLASS}`}>
                        <div className="flex items-center gap-2 mb-4 text-slate-500 font-semibold text-sm uppercase tracking-wider">
                            <Building size={16} className="text-blue-500" />
                            Klinik Branşlar
                        </div>
                        <p className="text-xs text-slate-500 mb-3">Vakanın ilgili olduğu branşları seçin (Çoklu seçim yapabilirsiniz).</p>

                        <div className="flex flex-wrap gap-2">
                            {branches.map(branch => (
                                <button
                                    key={branch}
                                    onClick={() => toggleBranch(branch)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                                        selectedBranches.includes(branch)
                                        ? 'bg-blue-100 border-blue-200 text-blue-700 shadow-sm'
                                        : 'bg-white/60 border-slate-200/60 text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    {branch}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={`${GLASS}`}>
                        <div className="flex items-center gap-2 mb-4 text-slate-500 font-semibold text-sm uppercase tracking-wider">
                            <Tags size={16} className="text-blue-500" />
                            Etiketler
                        </div>
                        <p className="text-xs text-slate-500 mb-3">Etiket yazıp Enter&apos;a basın (Örn: #Kardiyoloji, #EKG).</p>

                        <div className="bg-white/70 border border-slate-200/60 rounded-xl p-2.5 min-h-[50px] flex flex-wrap gap-2 items-center focus-within:ring-2 focus-within:ring-blue-400/50 transition-all">
                            {tags.map(tag => (
                                <span key={tag} className="flex items-center gap-1 bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-1 rounded-md text-xs font-semibold">
                                    {tag}
                                    <button onClick={() => removeTag(tag)} className="hover:text-indigo-800 ml-1">
                                        &times;
                                    </button>
                                </span>
                            ))}
                            <input
                                type="text"
                                value={currentTag}
                                onChange={(e) => setCurrentTag(e.target.value)}
                                onKeyDown={handleAddTag}
                                onBlur={() => {
                                    if (currentTag.trim() !== '') {
                                        const formatted = currentTag.trim().startsWith('#') ? currentTag.trim() : `#${currentTag.trim()}`;
                                        if (!tags.includes(formatted)) {
                                            setTags([...tags, formatted]);
                                        }
                                        setCurrentTag('');
                                    }
                                }}
                                placeholder="Etiket ekle..."
                                className="flex-1 bg-transparent border-none text-sm outline-none placeholder-slate-400 min-w-[120px]"
                            />
                        </div>
                    </div>
                </div>

                {/* 4. Image URL */}
                <div className={`${GLASS}`}>
                    <div className="flex items-center gap-2 mb-4 text-slate-500 font-semibold text-sm uppercase tracking-wider">
                        <ImageIcon size={16} className="text-blue-500" />
                        Görüntü Ekle <span className="text-slate-400 text-xs normal-case font-medium">(Opsiyonel)</span>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Görüntü URL&apos;si</label>
                            <input
                                type="url"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                placeholder="https://örnek.com/radyoloji-goruntusu.jpg"
                                className="w-full bg-white/70 border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                            />
                            <p className="text-xs text-slate-400 mt-1.5">Radyoloji görüntüsü, lezyon fotoğrafı veya herhangi bir klinik görsel URL&apos;si girin.</p>
                        </div>

                        {/* Preview */}
                        {imageUrl.trim() && (
                            <div className="relative rounded-2xl overflow-hidden border border-slate-200/60 bg-slate-50 max-h-64">
                                <img
                                    src={imageUrl}
                                    alt="Önizleme"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                                <div className="absolute top-2 right-2">
                                    <span className="text-xs bg-black/50 text-white px-2 py-1 rounded-lg">Önizleme</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Publish Button */}
                <div className="flex justify-end gap-3 pt-2">
                    <button
                        onClick={() => router.push('/feed')}
                        className="px-6 py-3 rounded-xl text-sm font-semibold text-slate-600 bg-white/60 hover:bg-white/80 border border-slate-200/60 shadow-sm transition-all"
                    >
                        İptal
                    </button>
                    <button
                        onClick={handlePublish}
                        disabled={isSubmitting || success}
                        className="px-8 py-3 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Yayınlanıyor...
                            </>
                        ) : (
                            <>
                                <Check size={18} strokeWidth={2.5} />
                                Vakayı Yayınla
                            </>
                        )}
                    </button>
                </div>

            </main>
        </div>
    );
}

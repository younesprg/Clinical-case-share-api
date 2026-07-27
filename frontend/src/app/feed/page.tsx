"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import {
    HeartPulse, LogOut, Heart, MessageCircle, Bookmark, Image as ImageIcon,
    LinkIcon, Send, BadgeCheck, Globe, FolderOpen, BookmarkCheck, Settings,
    Zap, Bot, Trophy, Newspaper, Loader2, ChevronDown, Sparkles
} from 'lucide-react';

// ═══════════════════════════════════════════════════
// SHARED STYLES
// ═══════════════════════════════════════════════════

const GLASS = "bg-white/40 backdrop-blur-2xl border-[1.5px] border-slate-400/30 shadow-[0_8px_30px_rgba(0,0,0,0.05)] rounded-[1.5rem] p-6";
const GLASS_COMPACT = "bg-white/40 backdrop-blur-2xl border-[1.5px] border-slate-400/30 shadow-[0_8px_30px_rgba(0,0,0,0.05)] rounded-[1.5rem] p-4";

// ═══════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════

const MOCK_POSTS = [
    {
        id: 1,
        author: "Dr. Ayşe Kara",
        specialty: "Nörolog",
        verified: true,
        avatar: "Ayşe+Kara",
        content: "35 yaşında erkek hasta, ani başlayan şiddetli baş ağrısı ve bulanık görme ile başvurdu. BT normal, LP'de artmış basınç saptandı. İdyopatik intrakraniyal hipertansiyon tanısı konularak asetazolamid tedavisi başlandı.",
        category: "Nöroloji",
        tags: ["#NadirVaka", "#İdyopatikİntrakraniyalHipertansiyon"],
        likes: 24,
        comments: 8,
        time: "2 saat önce",
    },
    {
        id: 2,
        author: "Dr. Mehmet Demir",
        specialty: "Kardiyolog",
        verified: true,
        avatar: "Mehmet+Demir",
        content: "Genç sporcularda ani kardiyak arrest: yeni EKG tarama protokolümüzün 6 aylık sonuçları umut verici. 450 sporcuda yapılan taramada 3 yüksek riskli vaka erken teşhis edildi. Detaylı raporu yakında paylaşacağım.",
        category: "Kardiyoloji",
        tags: ["#SporKardiyolojisi", "#EKG"],
        likes: 42,
        comments: 15,
        time: "5 saat önce",
    },
];

const MOCK_LEADERBOARD = [
    { rank: "🥇", name: "Dr. Ayşe Kara", likes: 48 },
    { rank: "🥈", name: "Dr. Mehmet Demir", likes: 35 },
    { rank: "🥉", name: "Dr. Zeynep Aksoy", likes: 27 },
];

// ═══════════════════════════════════════════════════
// MINI NAVBAR
// ═══════════════════════════════════════════════════

function FeedNavbar() {
    const { user, logout } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);

    return (
        <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
            <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
                {/* Left: Logo */}
                <Link href="/dashboard" className="flex items-center gap-2 font-bold text-slate-800 hover:text-blue-600 transition-colors">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <HeartPulse size={18} className="text-white" strokeWidth={2.5} />
                    </div>
                    <span className="text-base tracking-tight">Med<span className="text-blue-600">+</span></span>
                </Link>

                {/* Center: Title */}
                <div className="hidden sm:flex items-center gap-2 text-sm font-semibold text-slate-600">
                    <Globe size={15} className="text-blue-500" />
                    Sosyal Akış
                </div>

                {/* Right: Avatar + Logout */}
                <div className="relative">
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="flex items-center gap-2.5 hover:bg-slate-50/80 px-2 py-1.5 rounded-xl transition-colors"
                    >
                        <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=c7d2fe&color=3730a3&bold=true`}
                            alt="Avatar"
                            className="w-8 h-8 rounded-full border-2 border-slate-200"
                        />
                        <div className="text-left hidden sm:block">
                            <p className="text-xs font-semibold text-slate-800 leading-none">
                                {user?.role === 'doctor' ? (user?.title || 'Dr.') + ' ' : ''}{user?.name}
                            </p>
                            <p className="text-[11px] text-slate-400 capitalize mt-0.5">{user?.specialty || user?.role}</p>
                        </div>
                        <ChevronDown size={14} className="text-slate-400" />
                    </button>

                    {showDropdown && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 py-1 z-50">
                            <div className="px-4 py-3 border-b border-slate-50">
                                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Hesap</p>
                                <p className="text-sm font-medium text-slate-900 truncate mt-0.5">{user?.email}</p>
                            </div>
                            <button
                                onClick={() => { logout(); setShowDropdown(false); }}
                                className="w-full flex items-center text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <LogOut size={15} className="mr-2" />
                                Çıkış Yap
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}

// ═══════════════════════════════════════════════════
// LEFT SIDEBAR — Fixed, flush with navbar
// ═══════════════════════════════════════════════════

function SidePanel() {
    const { user } = useAuth();

    const displayName = user?.role === 'doctor'
        ? `${user?.title || 'Dr.'} ${user?.name}`
        : user?.name || 'Kullanıcı';

    const displayRole = user?.specialty || 'Tıp Profesyoneli';

    const menuItems = [
        { icon: Globe, label: "Sosyal Akış", active: true, href: "/feed" },
        { icon: FolderOpen, label: "Klinik Vakalar", active: false, href: "/dashboard" },
        { icon: BookmarkCheck, label: "Kaydedilenler", active: false, href: "#" },
        { icon: Sparkles, label: "Klinik Arşiv", active: false, href: "/encyclopedia" },
        { icon: Zap, label: "Hızlı Teşhis", active: false, href: "#" },
        { icon: Settings, label: "Ayarlar", active: false, href: "#" },
    ];

    return (
        <aside className="hidden lg:flex fixed left-0 top-[3.5rem] bottom-0 w-64 bg-white/60 backdrop-blur-2xl border-r border-slate-200/50 flex-col z-40">
            {/* Profile Section */}
            <div className="flex flex-col items-center text-center px-5 pt-6 pb-4 border-b border-slate-200/40">
                <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=c7d2fe&color=3730a3&bold=true&size=80`}
                    alt="Avatar"
                    className="w-14 h-14 rounded-full border-[3px] border-white shadow-md mb-3"
                />
                <div className="flex items-center gap-1.5 mb-0.5">
                    <h3 className="font-bold text-slate-900 text-sm">{displayName}</h3>
                    <BadgeCheck size={15} className="text-blue-500 fill-blue-100" />
                </div>
                <p className="text-xs text-slate-500 mb-3">{displayRole}</p>

                <div className="flex gap-6 text-center border-t border-slate-200/40 pt-3 w-full justify-center">
                    <div>
                        <p className="text-base font-bold text-slate-800">12</p>
                        <p className="text-[11px] text-slate-400">Vaka</p>
                    </div>
                    <div className="w-px bg-slate-200/60" />
                    <div>
                        <p className="text-base font-bold text-slate-800">145</p>
                        <p className="text-[11px] text-slate-400">Beğeni</p>
                    </div>
                </div>
            </div>

            {/* Navigation Section */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {menuItems.map((item) => (
                    <Link
                        key={item.label}
                        href={item.href}
                        className={`flex items-center gap-3 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
                            item.active
                                ? 'bg-blue-500/10 text-blue-700 shadow-sm border border-blue-200/40'
                                : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
                        }`}
                    >
                        <item.icon size={18} strokeWidth={item.active ? 2.5 : 2} />
                        {item.label}
                    </Link>
                ))}
            </nav>

            {/* Bottom branding */}
            <div className="px-5 py-4 border-t border-slate-200/40">
                <p className="text-[10px] text-slate-400 text-center">© 2026 Med+ AI Systems</p>
            </div>
        </aside>
    );
}

// ═══════════════════════════════════════════════════
// MIDDLE COLUMN — Create Post + Feed
// ═══════════════════════════════════════════════════

function CreatePostBlock() {
    const { user } = useAuth();
    const [content, setContent] = useState('');

    return (
        <div className={`${GLASS_COMPACT} !py-3 !px-4`}>
            <div className="flex items-center gap-3">
                <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=c7d2fe&color=3730a3&bold=true`}
                    alt="Avatar"
                    className="w-9 h-9 rounded-full border-2 border-white shadow-sm shrink-0"
                />
                <div className="relative flex-1">
                    <input
                        type="text"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Yeni bir klinik vaka veya düşünce paylaş..."
                        className="w-full bg-white/50 border border-slate-200/60 rounded-full pl-4 pr-20 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition-all"
                    />
                    {/* Icon buttons inside input, right side */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button className="p-1.5 rounded-full text-slate-400 hover:text-blue-500 hover:bg-blue-50/60 transition-all" title="Görsel Ekle">
                            <ImageIcon size={15} />
                        </button>
                        <button className="p-1.5 rounded-full text-slate-400 hover:text-blue-500 hover:bg-blue-50/60 transition-all" title="Vaka Bağla">
                            <LinkIcon size={15} />
                        </button>
                    </div>
                </div>
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow-md transition-all shrink-0">
                    <Send size={14} />
                    Paylaş
                </button>
            </div>
        </div>
    );
}

function PostCard({ post }: { post: typeof MOCK_POSTS[0] }) {
    const [liked, setLiked] = useState(false);
    const [saved, setSaved] = useState(false);

    return (
        <div className={`${GLASS} hover:shadow-[0_8px_40px_rgba(0,0,0,0.08)] transition-all duration-300`}>
            {/* Author header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(post.avatar)}&background=c7d2fe&color=3730a3&bold=true`}
                        alt={post.author}
                        className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                    />
                    <div>
                        <div className="flex items-center gap-1.5">
                            <h4 className="font-semibold text-slate-900 text-sm">{post.author}</h4>
                            {post.verified && <BadgeCheck size={14} className="text-blue-500 fill-blue-100" />}
                        </div>
                        <p className="text-xs text-slate-400">{post.specialty} · {post.time}</p>
                    </div>
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-50/80 text-blue-600 border border-blue-100/60">
                    {post.category}
                </span>
            </div>

            {/* Content */}
            <p className="text-sm text-slate-700 leading-relaxed mb-4">{post.content}</p>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map((tag) => (
                    <span key={tag} className="text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-50/80 text-indigo-600 border border-indigo-100/50">
                        {tag}
                    </span>
                ))}
            </div>

            {/* Actions bar */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200/40">
                <button
                    onClick={() => setLiked(!liked)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        liked
                            ? 'text-red-500 bg-red-50/80'
                            : 'text-slate-500 hover:text-red-500 hover:bg-red-50/50'
                    }`}
                >
                    <Heart size={15} fill={liked ? 'currentColor' : 'none'} />
                    {liked ? post.likes + 1 : post.likes}
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-blue-500 hover:bg-blue-50/50 transition-all">
                    <MessageCircle size={15} />
                    {post.comments}
                </button>
                <button
                    onClick={() => setSaved(!saved)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        saved
                            ? 'text-amber-500 bg-amber-50/80'
                            : 'text-slate-500 hover:text-amber-500 hover:bg-amber-50/50'
                    }`}
                >
                    <Bookmark size={15} fill={saved ? 'currentColor' : 'none'} />
                    {saved ? 'Kaydedildi' : 'Kaydet'}
                </button>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════
// RIGHT COLUMN — News + AI + Leaderboard
// ═══════════════════════════════════════════════════

interface NewsArticle {
    baslik: string;
    ozet: string;
    etiketler?: string[];
}

function EuropePMCRadar() {
    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const res = await api.get('/api/encyclopedia/cases', {
                    params: { query: 'clinical case report 2024' }
                });
                if (res.data?.results && res.data.results.length > 0) {
                    setArticles(res.data.results.slice(0, 3));
                }
            } catch (err) {
                console.error('Europe PMC fetch failed:', err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchNews();
    }, []);

    return (
        <div className={GLASS_COMPACT}>
            <div className="flex items-center gap-2 mb-4">
                <Newspaper size={16} className="text-orange-500" />
                <h3 className="font-bold text-slate-800 text-sm">Günlük Sağlık Haberleri</h3>
            </div>

            {loading ? (
                <div className="flex justify-center py-6">
                    <Loader2 className="animate-spin text-blue-400" size={20} />
                </div>
            ) : error ? (
                <p className="text-xs text-slate-400 text-center py-4">Haberler yüklenemedi.</p>
            ) : articles.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">Henüz haber bulunamadı.</p>
            ) : (
                <div className="space-y-3">
                    {articles.map((article, i) => (
                        <div key={i} className="p-3 rounded-xl bg-white/50 border border-slate-200/40 hover:bg-white/70 transition-colors">
                            <h4 className="text-xs font-semibold text-slate-800 leading-snug mb-1.5 line-clamp-2">
                                {article.baslik}
                            </h4>
                            <p className="text-[11px] text-slate-500 line-clamp-2 mb-2">{article.ozet}</p>
                            {article.etiketler && article.etiketler.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {article.etiketler.slice(0, 2).map((tag, j) => (
                                        <span key={j} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-100/50">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function MedAIAssistant() {
    return (
        <div className="bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 backdrop-blur-2xl border-[1.5px] border-blue-400/30 shadow-[0_8px_30px_rgba(59,130,246,0.1)] rounded-[1.5rem] p-5">
            <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                    <Bot size={16} className="text-white" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Med+ AI Asistan</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Klinik vakalarınızı yapay zeka ile analiz edin, ayırıcı tanı ve tedavi önerileri alın.
            </p>
            <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all">
                <Sparkles size={14} />
                Konsültasyon Başlat
            </button>
        </div>
    );
}

function Leaderboard() {
    return (
        <div className={`${GLASS} h-full flex flex-col`}>
            <div className="flex items-center gap-2 mb-4">
                <Trophy size={16} className="text-amber-500" />
                <h3 className="font-bold text-slate-800 text-sm">Haftanın Hekimleri</h3>
            </div>
            <div className="space-y-4 flex-1 mt-2">
                {MOCK_LEADERBOARD.map((doc, i) => (
                    <div key={i} className="flex items-center gap-3 px-1 transition-colors">
                        <span className="text-lg shrink-0">{doc.rank}</span>
                        <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(doc.name.replace('Dr. ', ''))}&background=c7d2fe&color=3730a3&bold=true&size=36`}
                            alt={doc.name}
                            className="w-9 h-9 rounded-full border-2 border-white shadow-sm shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-slate-800 truncate">{doc.name}</p>
                            <p className="text-[11px] text-slate-400">{doc.likes} beğeni</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════
// MAIN FEED PAGE
// ═══════════════════════════════════════════════════

export default function FeedPage() {
    const { loading } = useAuth();

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/80 to-sky-100/50">
                <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/80 to-sky-100/50">
            <FeedNavbar />
            <SidePanel />

            {/* Main content area — offset by sidebar width on lg */}
            <div className="lg:ml-64">
                <div className="max-w-6xl mx-auto p-4 md:p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-9 gap-6">

                        {/* ── Middle Column: The Feed ── */}
                        <main className="lg:col-span-5 space-y-5">
                            <CreatePostBlock />
                            {MOCK_POSTS.map((post) => (
                                <PostCard key={post.id} post={post} />
                            ))}
                        </main>

                        {/* ── Right Column: Insights + Leaderboard ── */}
                        <aside className="lg:col-span-4">
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 h-full">
                                {/* Left sub-column: PMC + AI */}
                                <div className="space-y-5">
                                    <MedAIAssistant />
                                    <EuropePMCRadar />
                                </div>
                                {/* Right sub-column: Leaderboard (full height) */}
                                <div className="h-full">
                                    <Leaderboard />
                                </div>
                            </div>
                        </aside>

                    </div>
                </div>
            </div>
        </div>
    );
}

"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import {
    HeartPulse, LogOut, Heart, MessageCircle, Bookmark, Image as ImageIcon,
    LinkIcon, Send, BadgeCheck, Globe, FolderOpen, BookmarkCheck, Settings,
    Trophy, Newspaper, Loader2, ChevronDown, Plus
} from 'lucide-react';
import SidePanel from '@/components/SidePanel';

// ═══════════════════════════════════════════════════
// UNIFIED POST TYPE (covers mock + API responses)
// ═══════════════════════════════════════════════════

interface UnifiedPost {
    id: number;
    author: string;
    specialty: string;
    verified: boolean;
    avatar: string;
    content: string;
    category: string;
    tags: string[];
    imageUrl?: string;
    likes: number;
    comments: number;
    time: string;
    isReal?: boolean; // true = came from API
}

// ═══════════════════════════════════════════════════
// SHARED STYLES
// ═══════════════════════════════════════════════════

const GLASS = "bg-white/40 backdrop-blur-2xl border-[1.5px] border-slate-400/30 shadow-[0_8px_30px_rgba(0,0,0,0.05)] rounded-[1.5rem] p-6";
const GLASS_COMPACT = "bg-white/40 backdrop-blur-2xl border-[1.5px] border-slate-400/30 shadow-[0_8px_30px_rgba(0,0,0,0.05)] rounded-[1.5rem] p-4";

// ═══════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════

const MOCK_POSTS: UnifiedPost[] = [
    {
        id: 1,
        author: "Dr. Ayşe Kara",
        specialty: "Nörolog",
        verified: true,
        avatar: "Ayşe+Kara",
        content: "35 yaşında erkek hasta, ani başlayan şiddetli baş ağrısı ve bulanık görme ile başvurdu. BT normal, LP'de artmış basınç saptandı. İdyopatik intrakraniyal hipertansiyon tanısı konularak asetazolamid tedavisi başlandı.",
        category: "Nöroloji",
        tags: ["#NadirVaka", "#İdyopatikİntrakraniyalHipertansiyon"],
        imageUrl: "https://images.unsplash.com/photo-1559757175-5700dde675bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
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

// ── Helper: format API post date relative ──────────
function timeAgo(dateStr: string): string {
    const now = new Date();
    const past = new Date(dateStr);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dakika önce`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} saat önce`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} gün önce`;
}

// ── Helper: map API PostResponse → UnifiedPost ─────
function mapApiPost(p: any): UnifiedPost {
    const authorName = p.author?.name || 'Bilinmeyen Kullanıcı';
    const specialty = p.author?.specialty || p.author?.medical_role || 'Tıp Uzmanı';
    return {
        id: p.id,
        author: authorName,
        specialty,
        verified: p.author?.is_verified ?? false,
        avatar: authorName.replace('Dr. ', ''),
        content: p.content,
        category: p.category || 'Genel',
        tags: p.tags ? p.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
        imageUrl: p.image_url ?? undefined,
        likes: p.likes_count ?? 0,
        comments: p.comments?.length ?? 0,
        time: timeAgo(p.created_at),
        isReal: true,
    };
}

const MOCK_LEADERBOARD = [
    { rank: "🥇", name: "Dr. Ayşe Kara", specialty: "Nörolog", likes: 48 },
    { rank: "🥈", name: "Dr. Mehmet Demir", specialty: "Kardiyolog", likes: 35 },
    { rank: "🥉", name: "Dr. Zeynep Aksoy", specialty: "Pediatrist", likes: 27 },
    { rank: "4️⃣", name: "Dr. Ali Şahin", specialty: "Dahiliye", likes: 21 },
    { rank: "5️⃣", name: "Dr. Fatma Yıldız", specialty: "Romatoloji", likes: 17 },
];

// ═══════════════════════════════════════════════════
// MINI NAVBAR
// ═══════════════════════════════════════════════════

function FeedNavbar() {
    const { user, logout } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 w-full bg-white/40 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
            <div className="max-w-screen-2xl mx-auto px-6 h-14 flex items-center justify-between">
                {/* Left: Logo */}
                <Link href="/feed" className="flex items-center gap-2.5 font-bold text-slate-800 hover:text-blue-600 transition-colors">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <HeartPulse size={22} className="text-white" strokeWidth={2.5} />
                    </div>
                    <span className="text-2xl tracking-tight">Med<span className="text-blue-600">+</span></span>
                </Link>

                {/* Center: Title */}
                <div className="hidden sm:flex items-center gap-2 text-sm font-semibold text-slate-600">
                    <Globe size={15} className="text-blue-500" />
                    Sosyal Akış
                </div>

                {/* Right: Actions + Avatar */}
                <div className="flex items-center gap-3">
                    <Link href="/feed/create" className="hidden sm:flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] transition-all">
                        <Send size={16} strokeWidth={2.5} />
                        Paylaş
                    </Link>
                    
                    <div className="w-px h-5 bg-slate-200 hidden sm:block"></div>

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
            </div>
        </nav>
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

function PostCard({ post }: { post: UnifiedPost }) {
    const [liked, setLiked] = useState(false);
    const [saved, setSaved] = useState(false);
    const [imageError, setImageError] = useState(false);

    // Parse content: first paragraph (up to first \n\n) is the title if it's short
    // Strip any stray HTML tags or markdown artifacts from API content
    const cleanContent = post.content
        .replace(/<\/?(p|div|br|span|h[1-6])[^>]*>/gi, '\n') // block-level tags → newline
        .replace(/<[^>]*>/g, '')                               // strip remaining tags
        .replace(/\*\*(.*?)\*\*/g, '$1')                      // strip **bold** markdown
        .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/\n{3,}/g, '\n\n')                           // collapse excess newlines
        .trim();

    const paragraphs = cleanContent.split('\n\n').map(p => p.trim()).filter(Boolean);
    const hasTitle = paragraphs.length > 1 && paragraphs[0].length <= 120;
    const title = hasTitle ? paragraphs[0] : null;
    const bodyParagraphs = hasTitle ? paragraphs.slice(1) : paragraphs;

    return (
        <div className={`${GLASS} !p-8 hover:shadow-[0_8px_40px_rgba(0,0,0,0.08)] transition-all duration-300 ${post.isReal ? 'ring-1 ring-blue-200/50' : ''}`}>
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
                            {post.isReal && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-600 text-white">YENİ</span>}
                        </div>
                        <p className="text-xs text-slate-400">{post.specialty} · {post.time}</p>
                    </div>
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-50/80 text-blue-600 border border-blue-100/60">
                    {post.category}
                </span>
            </div>

            {/* Title (if distinct from body) */}
            {title && (
                <h3 className="font-bold text-slate-900 text-base leading-snug mb-2">
                    {title}
                </h3>
            )}

            {/* Body paragraphs */}
            <div className="space-y-2 mb-4">
                {bodyParagraphs.map((para, i) => (
                    <p key={i} className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{para}</p>
                ))}
            </div>

            {/* Media (if exists and loads successfully) */}
            {post.imageUrl && !imageError && (
                <div className="mb-4 w-full">
                    <img
                        src={post.imageUrl}
                        alt="Klinik Görsel"
                        className="w-full max-h-[520px] object-cover rounded-2xl border border-slate-200/50 shadow-sm"
                        onError={() => setImageError(true)}
                        onLoad={() => setImageError(false)}
                    />
                </div>
            )}

            {/* Tags */}
            {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map((tag) => (
                        <span key={tag} className="text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-50/80 text-indigo-600 border border-indigo-100/50">
                            {tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Actions bar */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200/40">
                <button
                    onClick={() => setLiked(!liked)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${liked
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
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${saved
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
                    setArticles(res.data.results.slice(0, 4));
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





function Leaderboard() {
    return (
        <div className={GLASS_COMPACT}>
            <div className="flex items-center gap-2 mb-4">
                <Trophy size={16} className="text-amber-500" />
                <h3 className="font-bold text-slate-800 text-sm">Haftanın Hekimleri</h3>
            </div>
            <div className="space-y-3">
                {MOCK_LEADERBOARD.map((doc, i) => (
                    <div key={i} className="flex items-center gap-3 px-1 py-1 rounded-xl hover:bg-white/50 transition-colors">
                        <span className="text-base shrink-0 w-6 text-center">{doc.rank}</span>
                        <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(doc.name.replace('Dr. ', ''))}&background=c7d2fe&color=3730a3&bold=true&size=36`}
                            alt={doc.name}
                            className="w-8 h-8 rounded-full border-2 border-white shadow-sm shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-slate-800 truncate">{doc.name}</p>
                            <p className="text-[11px] text-slate-400">{doc.specialty} · {doc.likes} beğeni</p>
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
    const [apiPosts, setApiPosts] = useState<UnifiedPost[]>([]);
    const [feedLoading, setFeedLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const res = await api.get('/feed/posts/', { params: { limit: 50 } });
                if (Array.isArray(res.data)) {
                    setApiPosts(res.data.map(mapApiPost));
                }
            } catch (err) {
                console.error('Feed posts fetch failed:', err);
            } finally {
                setFeedLoading(false);
            }
        };
        if (!loading) fetchPosts();
    }, [loading]);

    // Merge: real API posts first (newest at top), then mock posts
    const allPosts: UnifiedPost[] = [...apiPosts, ...MOCK_POSTS];

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/80 to-sky-100/50">
                <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    return (
        <div 
            className="min-h-screen flex flex-col relative overflow-hidden"
            style={{
                background: "linear-gradient(135deg, #ede9fe 0%, #f5f3ff 20%, #faf5ff 40%, #ecfeff 70%, #f0fdfa 100%)",
            }}
        >
            {/* Animated mesh blobs — soft pastel, low opacity */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-violet-300/20 blur-3xl animate-pulse" style={{ animationDuration: "6s" }} />
                <div className="absolute -bottom-40 -right-20 w-[500px] h-[500px] rounded-full bg-cyan-300/20 blur-3xl animate-pulse" style={{ animationDuration: "8s" }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-fuchsia-200/15 blur-3xl animate-pulse" style={{ animationDuration: "5s" }} />
            </div>
            <FeedNavbar />
            <SidePanel />

            {/* Main content area — offset by sidebar width on lg */}
            <div className="lg:ml-64 relative z-10 flex-1 pt-14">
                <div className="max-w-[1550px] mx-auto p-4 md:p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">

                        {/* ── Middle Column: The Feed ── */}
                        <main className="lg:col-span-6 space-y-5">
                            <CreatePostBlock />
                            {feedLoading ? (
                                <div className="flex items-center justify-center py-10">
                                    <Loader2 className="animate-spin text-blue-400" size={28} />
                                </div>
                            ) : (
                                allPosts.map((post) => (
                                    <PostCard key={`${post.isReal ? 'api' : 'mock'}-${post.id}`} post={post} />
                                ))
                            )}
                        </main>

                        {/* ── Right Column: Leaderboard + News (single vertical stack) ── */}
                        <aside className="lg:col-span-4 space-y-5">
                            <Leaderboard />
                            <EuropePMCRadar />
                        </aside>

                    </div>
                </div>
            </div>
        </div>
    );
}

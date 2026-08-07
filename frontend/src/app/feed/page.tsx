"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ToastProvider';
import api from '@/lib/api';
import {
    HeartPulse, LogOut, MessageCircle, Bookmark, Image as ImageIcon,
    LinkIcon, Send, BadgeCheck, Globe, BookmarkCheck, Settings,
    Trophy, Newspaper, Loader2, ChevronDown, CheckCircle2, Microscope,
    ThumbsUp, Coins, CornerDownRight, Plus, X, ChevronUp,
} from 'lucide-react';
import SidePanel from '@/components/SidePanel';
import MedTokenWidget from '@/components/MedTokenWidget';

// ═══════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════

interface UnifiedPost {
    id: number;
    author_id: number;
    author: string;
    specialty: string;
    verified: boolean;
    avatar: string;
    content: string;
    category: string;
    tags: string[];
    imageUrl?: string;
    validation_count: number;
    rare_vote_count: number;
    is_rare_case: boolean;
    agree_count: number;
    comments: number;
    time: string;
    isReal?: boolean;
}

interface PostComment {
    id: number;
    author_id: number;
    author_name: string;
    author_specialty: string;
    content: string;
    agree_count: number;
    time: string;
    replies: PostComment[];
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
        author_id: 999,
        author: "Dr. Ayşe Kara",
        specialty: "Nörolog",
        verified: true,
        avatar: "Ayşe+Kara",
        content: "35 yaşında erkek hasta, ani başlayan şiddetli baş ağrısı ve bulanık görme ile başvurdu. BT normal, LP'de artmış basınç saptandı. İdyopatik intrakraniyal hipertansiyon tanısı konularak asetazolamid tedavisi başlandı.",
        category: "Nöroloji",
        tags: ["#NadirVaka", "#İdyopatikİntrakraniyalHipertansiyon"],
        imageUrl: "https://images.unsplash.com/photo-1559757175-5700dde675bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
        validation_count: 3,
        rare_vote_count: 1,
        is_rare_case: false,
        agree_count: 12,
        comments: 8,
        time: "2 saat önce",
    },
    {
        id: 2,
        author_id: 998,
        author: "Dr. Mehmet Demir",
        specialty: "Kardiyolog",
        verified: true,
        avatar: "Mehmet+Demir",
        content: "Genç sporcularda ani kardiyak arrest: yeni EKG tarama protokolümüzün 6 aylık sonuçları umut verici. 450 sporcuda yapılan taramada 3 yüksek riskli vaka erken teşhis edildi. Detaylı raporu yakında paylaşacağım.",
        category: "Kardiyoloji",
        tags: ["#SporKardiyolojisi", "#EKG"],
        validation_count: 7,
        rare_vote_count: 0,
        is_rare_case: false,
        agree_count: 24,
        comments: 15,
        time: "5 saat önce",
    },
];

const MOCK_LEADERBOARD = [
    { rank: "🥇", name: "Dr. Ayşe Kara", specialty: "Nörolog", likes: 48 },
    { rank: "🥈", name: "Dr. Mehmet Demir", specialty: "Kardiyolog", likes: 35 },
    { rank: "🥉", name: "Dr. Zeynep Aksoy", specialty: "Pediatrist", likes: 27 },
    { rank: "4️⃣", name: "Dr. Ali Şahin", specialty: "Dahiliye", likes: 21 },
    { rank: "5️⃣", name: "Dr. Fatma Yıldız", specialty: "Romatoloji", likes: 17 },
];

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

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

function mapApiPost(p: any): UnifiedPost {
    const authorName = p.author?.name || 'Bilinmeyen Kullanıcı';
    const specialty = p.author?.specialty || p.author?.medical_role || 'Tıp Uzmanı';
    return {
        id: p.id,
        author_id: p.author_id ?? p.author?.id ?? 0,
        author: authorName,
        specialty,
        verified: p.author?.is_verified ?? false,
        avatar: authorName.replace('Dr. ', ''),
        content: p.content,
        category: p.category || 'Genel',
        tags: p.tags ? p.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
        imageUrl: p.image_url ?? undefined,
        validation_count: p.validation_count ?? 0,
        rare_vote_count: p.rare_vote_count ?? 0,
        is_rare_case: p.is_rare_case ?? false,
        agree_count: p.agree_count ?? 0,
        comments: p.comments?.length ?? 0,
        time: timeAgo(p.created_at),
        isReal: true,
    };
}

function mapApiComment(c: any): PostComment {
    return {
        id: c.id,
        author_id: c.author_id ?? c.author?.id ?? 0,
        author_name: c.author?.name || 'Bilinmeyen',
        author_specialty: c.author?.specialty || '',
        content: c.content,
        agree_count: c.agree_count ?? 0,
        time: timeAgo(c.created_at),
        replies: (c.replies || []).map(mapApiComment),
    };
}

// Token refresh event
function emitTokenUpdate() {
    window.dispatchEvent(new Event('med-token-update'));
}

// ═══════════════════════════════════════════════════
// NAVBAR
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

                    <div className="w-px h-5 bg-slate-200 hidden sm:block" />

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
// CREATE POST BLOCK
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

// ═══════════════════════════════════════════════════
// COMMENT ITEM (with Katılıyorum + Teşekkür Et)
// ═══════════════════════════════════════════════════

function CommentItem({
    comment,
    postAuthorId,
    onReply,
}: {
    comment: PostComment;
    postAuthorId: number;
    onReply?: (commentId: number, authorName: string) => void;
}) {
    const { user } = useAuth();
    const { showTokenToast, showError, showSuccess } = useToast();
    const [agreeCount, setAgreeCount] = useState(comment.agree_count);
    const [hasAgreed, setHasAgreed] = useState(false);
    const [agreeLoading, setAgreeLoading] = useState(false);
    const [thankLoading, setThankLoading] = useState(false);

    const isDoctor = user?.role === 'doctor';
    const isOwnComment = user?.id === comment.author_id;
    // "Teşekkür Et" sadece vakanın sahibinin (postAuthorId) başka birinin yorumunda görünür
    const isPostOwner = user?.id === postAuthorId;
    const canThank = isPostOwner && !isOwnComment;

    const handleAgree = async () => {
        if (!isDoctor) {
            showError('Yetki Gerekli', 'Sadece doktorlar yorum onaylayabilir.');
            return;
        }
        if (isOwnComment) {
            showError('Kendi yorumunuzu onaylayamazsınız.');
            return;
        }
        if (hasAgreed) return;
        setAgreeLoading(true);
        try {
            const res = await api.post(`/feed/comments/${comment.id}/agree`);
            setAgreeCount((prev) => prev + 1);
            setHasAgreed(true);
            const rewards: string[] = res.data?.rewards_granted || [];
            if (rewards.length > 0) {
                showTokenToast(10, rewards[0]);
                emitTokenUpdate();
            } else {
                showSuccess('Katılıyorum!', `${comment.author_name} adlı hekimin yorumu onaylandı.`);
            }
        } catch (err: any) {
            const detail = err?.response?.data?.detail;
            if (detail === 'Bu yorumu zaten onayladınız.') {
                setHasAgreed(true);
            }
            showError('Onay başarısız', detail || 'Bir hata oluştu.');
        } finally {
            setAgreeLoading(false);
        }
    };

    const handleThankYou = async () => {
        if (thankLoading) return;
        setThankLoading(true);
        try {
            const res = await api.post(`/api/tokens/thank-you/${comment.author_id}`);
            showTokenToast(-5, `${comment.author_name} adlı hekime teşekkür gönderildi.`);
            emitTokenUpdate();
        } catch (err: any) {
            const detail = err?.response?.data?.detail;
            showError('Teşekkür gönderilemedi', detail || 'Bir hata oluştu.');
        } finally {
            setThankLoading(false);
        }
    };

    return (
        <div className="pl-0">
            {/* Comment card */}
            <div className="bg-white/50 border border-slate-200/40 rounded-2xl p-3.5">
                {/* Author row */}
                <div className="flex items-center gap-2 mb-2">
                    <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author_name.replace('Dr. ', ''))}&background=ddd6fe&color=5b21b6&bold=true&size=32`}
                        alt={comment.author_name}
                        className="w-7 h-7 rounded-full border border-white shadow-sm shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold text-slate-800">{comment.author_name}</span>
                        {comment.author_specialty && (
                            <span className="text-[11px] text-slate-400 ml-1">· {comment.author_specialty}</span>
                        )}
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">{comment.time}</span>
                </div>

                {/* Content */}
                <p className="text-sm text-slate-700 leading-relaxed mb-3">{comment.content}</p>

                {/* Action bar */}
                <div className="flex items-center gap-1 flex-wrap">
                    {/* Yanıtla — en solda */}
                    {onReply && (
                        <button
                            onClick={() => onReply(comment.id, comment.author_name)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-blue-600 hover:bg-blue-50/60 transition-all"
                        >
                            <CornerDownRight size={13} />
                            Yanıtla
                        </button>
                    )}

                    {/* Katılıyorum */}
                    <button
                        onClick={handleAgree}
                        disabled={agreeLoading || hasAgreed || isOwnComment || !isDoctor}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                            hasAgreed
                                ? 'text-emerald-600 bg-emerald-50/80'
                                : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50/50'
                        }`}
                        title={!isDoctor ? 'Sadece doktorlar onaylayabilir' : isOwnComment ? 'Kendi yorumunuz' : ''}
                    >
                        {agreeLoading
                            ? <Loader2 size={13} className="animate-spin" />
                            : <ThumbsUp size={13} fill={hasAgreed ? 'currentColor' : 'none'} />
                        }
                        Katılıyorum {agreeCount > 0 && <span className="font-bold">({agreeCount})</span>}
                    </button>

                    {/* Teşekkür Et — sadece vaka sahibi görür */}
                    {canThank && (
                        <button
                            onClick={handleThankYou}
                            disabled={thankLoading}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-600 bg-amber-50/60 hover:bg-amber-50 border border-amber-200/60 transition-all disabled:opacity-50 ml-auto"
                        >
                            {thankLoading
                                ? <Loader2 size={13} className="animate-spin" />
                                : <Coins size={13} />
                            }
                            Teşekkür Et
                        </button>
                    )}
                </div>
            </div>

            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="ml-6 mt-2 space-y-2 border-l-2 border-slate-200/60 pl-3">
                    {comment.replies.map((reply) => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            postAuthorId={postAuthorId}
                            onReply={onReply}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════
// COMMENT PANEL (expandable under PostCard)
// ═══════════════════════════════════════════════════

function CommentPanel({ postId, postAuthorId }: { postId: number; postAuthorId: number }) {
    const { user } = useAuth();
    const { showSuccess, showError } = useToast();
    const [comments, setComments] = useState<PostComment[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [replyTo, setReplyTo] = useState<{ id: number; name: string } | null>(null);

    useEffect(() => {
        const fetchComments = async () => {
            try {
                const res = await api.get(`/feed/posts/${postId}/comments/`);
                setComments((res.data || []).map(mapApiComment));
            } catch {
                setComments([]);
            } finally {
                setLoading(false);
            }
        };
        fetchComments();
    }, [postId]);

    const handleSubmit = async () => {
        if (!newComment.trim()) return;
        setSubmitting(true);
        try {
            const payload: any = { content: newComment.trim() };
            if (replyTo) payload.parent_comment_id = replyTo.id;
            const res = await api.post(`/feed/posts/${postId}/comments/`, payload);
            const mapped = mapApiComment(res.data);
            if (replyTo) {
                setComments((prev) => prev.map((c) => {
                    if (c.id === replyTo.id) return { ...c, replies: [...c.replies, mapped] };
                    return c;
                }));
            } else {
                setComments((prev) => [...prev, mapped]);
            }
            setNewComment('');
            setReplyTo(null);
            showSuccess('Yorum eklendi!');
        } catch (err: any) {
            showError('Yorum gönderilemedi', err?.response?.data?.detail);
        } finally {
            setSubmitting(false);
        }
    };

    const handleReply = (commentId: number, authorName: string) => {
        setReplyTo({ id: commentId, name: authorName });
    };

    return (
        <div className="mt-3 pt-3 border-t border-slate-200/40">
            {/* New comment input */}
            <div className="flex items-start gap-2.5 mb-4">
                <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=c7d2fe&color=3730a3&bold=true&size=32`}
                    alt="Avatar"
                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm shrink-0 mt-0.5"
                />
                <div className="flex-1">
                    {replyTo && (
                        <div className="flex items-center justify-between mb-1.5 px-3 py-1.5 bg-blue-50/60 rounded-lg border border-blue-200/40">
                            <span className="text-xs text-blue-600 font-medium">
                                <CornerDownRight size={11} className="inline mr-1" />
                                {replyTo.name} adlı hekime yanıt
                            </span>
                            <button onClick={() => setReplyTo(null)} className="text-slate-400 hover:text-slate-600">
                                <X size={12} />
                            </button>
                        </div>
                    )}
                    <div className="flex gap-2">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Yorumunuzu yazın..."
                            rows={2}
                            className="flex-1 bg-white/50 border border-slate-200/60 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 resize-none transition-all"
                        />
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || !newComment.trim()}
                            className="self-end flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            {submitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Comments list */}
            {loading ? (
                <div className="flex justify-center py-4">
                    <Loader2 size={18} className="animate-spin text-blue-400" />
                </div>
            ) : comments.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-3">Henüz yorum yok. İlk yorumu sen yap!</p>
            ) : (
                <div className="space-y-3">
                    {comments.map((c) => (
                        <CommentItem
                            key={c.id}
                            comment={c}
                            postAuthorId={postAuthorId}
                            onReply={handleReply}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════
// POST CARD
// ═══════════════════════════════════════════════════

function PostCard({ post }: { post: UnifiedPost }) {
    const { user } = useAuth();
    const { showTokenToast, showError, showSuccess } = useToast();

    const [saved, setSaved] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [showComments, setShowComments] = useState(false);

    // DeSci state
    const [validationCount, setValidationCount] = useState(post.validation_count);
    const [rareCount, setRareCount] = useState(post.rare_vote_count);
    const [isRareCase, setIsRareCase] = useState(post.is_rare_case);
    const [hasValidated, setHasValidated] = useState(false);
    const [hasVotedRare, setHasVotedRare] = useState(false);
    const [validateLoading, setValidateLoading] = useState(false);
    const [rareLoading, setRareLoading] = useState(false);

    const isDoctor = user?.role === 'doctor';
    const isOwnPost = user?.id === post.author_id;

    // Parse content
    const cleanContent = post.content
        .replace(/<\/?(p|div|br|span|h[1-6])[^>]*>/gi, '\n')
        .replace(/<[^>]*>/g, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    const paragraphs = cleanContent.split('\n\n').map((p) => p.trim()).filter(Boolean);
    const hasTitle = paragraphs.length > 1 && paragraphs[0].length <= 120;
    const title = hasTitle ? paragraphs[0] : null;
    const bodyParagraphs = hasTitle ? paragraphs.slice(1) : paragraphs;

    const handleValidate = async (withRare = false) => {
        if (!isDoctor) {
            showError('Yetki Gerekli', 'Sadece doktorlar vaka doğrulayabilir.');
            return;
        }
        if (isOwnPost) {
            showError('Kendi vakasını doğrulayamazsınız.');
            return;
        }

        // If already validated, prevent re-sending
        if (!withRare && hasValidated) return;
        if (withRare && hasVotedRare) return;

        const setLoading = withRare ? setRareLoading : setValidateLoading;
        setLoading(true);
        try {
            const res = await api.post(`/feed/posts/${post.id}/validate`, null, {
                params: { is_rare: withRare },
            });

            const newValidationCount = res.data.validation_count ?? validationCount + 1;
            setValidationCount(newValidationCount);
            if (res.data.is_rare_case) setIsRareCase(true);

            if (withRare) {
                setHasVotedRare(true);
                setRareCount((prev) => prev + 1);
            } else {
                setHasValidated(true);
            }

            const rewards: string[] = res.data.rewards_granted || [];
            if (rewards.length > 0) {
                rewards.forEach((r) => {
                    // Ödülü işlemi yapan değil, vakanın yazarı (karşı taraf) alır.
                    showSuccess(
                        '🏆 Yazar Ödül Kazandı!',
                        `Bu onayınız sayesinde vaka sahibi ${r}`
                    );
                });
                
                if (res.data.blockchain === "queued") {
                    showSuccess(
                        "🔗 Blokzincire Yazılıyor...",
                        "İşleminiz Polygon Amoy ağına iletildi. Birkaç saniye içinde onaylanacak."
                    );
                }

                emitTokenUpdate();
            } else {
                showSuccess(
                    withRare ? '🔬 Nadir Vaka oyu verildi!' : '✅ Vaka doğrulandı!',
                    `${post.author} adlı hekimin vakası onaylandı.`
                );
            }
        } catch (err: any) {
            const detail = err?.response?.data?.detail;
            if (detail === 'Bu vakayı zaten doğruladınız.') {
                setHasValidated(true);
            }
            showError(withRare ? 'Nadir Vaka oyu verilemedi' : 'Doğrulama başarısız', detail || 'Bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`${GLASS} !p-8 hover:shadow-[0_8px_40px_rgba(0,0,0,0.08)] transition-all duration-300 ${post.isReal ? 'ring-1 ring-blue-200/50' : ''} ${isRareCase ? 'ring-1 ring-violet-300/60' : ''}`}>

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
                            {isRareCase && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-600 text-white flex items-center gap-0.5">
                                    <Microscope size={9} />
                                    NADİR
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-400">{post.specialty} · {post.time}</p>
                    </div>
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-50/80 text-blue-600 border border-blue-100/60">
                    {post.category}
                </span>
            </div>

            {/* Title */}
            {title && (
                <h3 className="font-bold text-slate-900 text-base leading-snug mb-2">{title}</h3>
            )}

            {/* Body */}
            <div className="space-y-2 mb-4">
                {bodyParagraphs.map((para, i) => (
                    <p key={i} className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{para}</p>
                ))}
            </div>

            {/* Image */}
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

            {/* ── DeSci Action Bar ── */}
            <div className="flex items-center gap-1 flex-wrap pt-3 border-t border-slate-200/40">

                {/* ✅ Doğrula */}
                <button
                    onClick={() => handleValidate(false)}
                    disabled={validateLoading || hasValidated || isOwnPost || !isDoctor}
                    title={
                        !isDoctor ? 'Sadece doktorlar doğrulayabilir' :
                        isOwnPost ? 'Kendi vakanızı doğrulayamazsınız' :
                        hasValidated ? 'Zaten doğruladınız' : 'Vakayı Doğrula'
                    }
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:cursor-not-allowed
                        ${hasValidated
                            ? 'bg-emerald-100/80 text-emerald-700 border border-emerald-300/60'
                            : isOwnPost || !isDoctor
                                ? 'text-slate-400 bg-slate-100/60 opacity-60'
                                : 'text-slate-600 bg-white/50 border border-slate-200/60 hover:bg-emerald-50/60 hover:text-emerald-700 hover:border-emerald-300/60'
                        }`}
                >
                    {validateLoading
                        ? <Loader2 size={13} className="animate-spin" />
                        : <CheckCircle2 size={13} fill={hasValidated ? 'currentColor' : 'none'} />
                    }
                    Doğrula
                    <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${hasValidated ? 'bg-emerald-200/60 text-emerald-800' : 'bg-slate-200/60 text-slate-600'}`}>
                        {validationCount}
                    </span>
                </button>

                {/* 🔬 Nadir Vaka */}
                <button
                    onClick={() => handleValidate(true)}
                    disabled={rareLoading || hasVotedRare || isRareCase || isOwnPost || !isDoctor}
                    title={
                        !isDoctor ? 'Sadece doktorlar oy verebilir' :
                        isOwnPost ? 'Kendi vakanızı etiketleyemezsiniz' :
                        isRareCase ? 'Nadir Vaka onaylandı!' :
                        hasVotedRare ? 'Zaten oyladınız' : 'Nadir Vaka olarak etiketle'
                    }
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:cursor-not-allowed
                        ${isRareCase
                            ? 'bg-violet-100/80 text-violet-700 border border-violet-300/60'
                            : hasVotedRare
                                ? 'bg-purple-100/60 text-purple-600 border border-purple-200/60'
                                : isOwnPost || !isDoctor
                                    ? 'text-slate-400 bg-slate-100/60 opacity-60'
                                    : 'text-slate-600 bg-white/50 border border-slate-200/60 hover:bg-violet-50/60 hover:text-violet-700 hover:border-violet-300/60'
                        }`}
                >
                    {rareLoading
                        ? <Loader2 size={13} className="animate-spin" />
                        : <Microscope size={13} />
                    }
                    {isRareCase ? '🔬 Nadir Vaka' : 'Nadir Vaka'}
                    <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${isRareCase ? 'bg-violet-200/60 text-violet-800' : 'bg-slate-200/60 text-slate-600'}`}>
                        {rareCount}
                    </span>
                </button>

                {/* Spacer */}
                <div className="flex-1" />

                {/* 💬 Yanıtla / Yorumlar */}
                <button
                    onClick={() => setShowComments(!showComments)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        showComments
                            ? 'text-blue-700 bg-blue-50/80 border border-blue-200/60'
                            : 'text-slate-500 bg-white/50 border border-slate-200/60 hover:text-blue-600 hover:bg-blue-50/50'
                    }`}
                >
                    <MessageCircle size={13} fill={showComments ? 'currentColor' : 'none'} />
                    Yanıtla
                    {post.comments > 0 && (
                        <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200/60 text-slate-600">
                            {post.comments}
                        </span>
                    )}
                    {showComments ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>

                {/* 🔖 Kaydet */}
                <button
                    onClick={() => setSaved(!saved)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${saved
                        ? 'text-amber-600 bg-amber-50/80 border-amber-200/60'
                        : 'text-slate-500 bg-white/50 border-slate-200/60 hover:text-amber-600 hover:bg-amber-50/50'
                    }`}
                >
                    {saved
                        ? <BookmarkCheck size={13} fill="currentColor" />
                        : <Bookmark size={13} />
                    }
                    {saved ? 'Kaydedildi' : 'Kaydet'}
                </button>
            </div>

            {/* ── Comment Panel (expandable) ── */}
            {showComments && post.isReal && (
                <CommentPanel postId={post.id} postAuthorId={post.author_id} />
            )}
            {showComments && !post.isReal && (
                <div className="mt-3 pt-3 border-t border-slate-200/40 text-center text-xs text-slate-400 py-3">
                    Bu örnek vaka için yorumlar gösterilemiyor.
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════
// NEWS WIDGET
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
                            <h4 className="text-xs font-semibold text-slate-800 leading-snug mb-1.5 line-clamp-2">{article.baslik}</h4>
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

// ═══════════════════════════════════════════════════
// LEADERBOARD
// ═══════════════════════════════════════════════════

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
            {/* Animated mesh blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-violet-300/20 blur-3xl animate-pulse" style={{ animationDuration: "6s" }} />
                <div className="absolute -bottom-40 -right-20 w-[500px] h-[500px] rounded-full bg-cyan-300/20 blur-3xl animate-pulse" style={{ animationDuration: "8s" }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-fuchsia-200/15 blur-3xl animate-pulse" style={{ animationDuration: "5s" }} />
            </div>

            <FeedNavbar />
            <SidePanel />

            {/* Main content */}
            <div className="lg:ml-64 relative z-10 flex-1 pt-14">
                <div className="max-w-[1550px] mx-auto p-4 md:p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">

                        {/* ── Middle Column: Feed ── */}
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

                        {/* ── Right Column ── */}
                        <aside className="lg:col-span-4 space-y-5">
                            {/* 💰 MedToken Cüzdan Widget */}
                            <MedTokenWidget />
                            <Leaderboard />
                            <EuropePMCRadar />
                        </aside>

                    </div>
                </div>
            </div>
        </div>
    );
}

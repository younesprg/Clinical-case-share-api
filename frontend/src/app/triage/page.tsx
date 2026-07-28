"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import {
    HeartPulse, Send, Zap, Stethoscope, Pill, FlaskConical,
    Brain, AlertTriangle, X, ChevronDown, LogOut, Loader2,
    MessageCircle, Shield, SquarePen
} from "lucide-react";
import TopNavbar from "@/components/TopNavbar";

// ─────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
    created_at?: string;
}

// ─────────────────────────────────────────────────────
// Disclaimer Modal
// ─────────────────────────────────────────────────────

function DisclaimerModal({ onAccept }: { onAccept: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-purple-900/20 backdrop-blur-sm p-4">
            <div className="relative max-w-md w-full rounded-3xl overflow-hidden shadow-2xl">
                {/* Gradient border shimmer */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-300 via-fuchsia-200 to-cyan-200 rounded-3xl" />
                <div className="relative m-[1.5px] bg-white rounded-[calc(1.5rem-1.5px)] p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-400 flex items-center justify-center shadow-lg shadow-violet-300/50">
                            <Shield size={22} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-slate-900 font-bold text-lg leading-tight">Önemli Uyarı</h2>
                            <p className="text-violet-500 text-xs">Med+ Triyaj Asistanı</p>
                        </div>
                    </div>

                    <div className="space-y-4 text-sm text-slate-600 leading-relaxed mb-8">
                        <p className="flex gap-2">
                            <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                            Bu uygulama, yapay zeka destekli bir <strong className="text-slate-900">ön değerlendirme asistanıdır</strong>. Kesin tıbbi tanı koymaz.
                        </p>
                        <p className="flex gap-2">
                            <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                            Sunulan bilgiler, bir sağlık uzmanının muayenesinin <strong className="text-slate-900">yerini tutmaz</strong>.
                        </p>
                        <p className="flex gap-2">
                            <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                            <strong className="text-red-600">Acil durumlarda hemen 112&apos;yi arayın.</strong>
                        </p>
                    </div>

                    <button
                        onClick={onAccept}
                        className="w-full py-3.5 rounded-2xl font-bold text-sm text-white
                            bg-gradient-to-r from-purple-600 via-fuchsia-600 to-cyan-500
                            hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/30
                            active:scale-[0.98]"
                    >
                        Anladım, Devam Et
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────
// Animated Orb
// ─────────────────────────────────────────────────────

function AIOrb({ isTyping }: { isTyping: boolean }) {
    return (
        <div className="relative flex items-center justify-center">
            {/* Outer glow rings */}
            <div className={`absolute w-40 h-40 rounded-full bg-gradient-to-r from-purple-600/20 to-cyan-500/20 blur-xl ${isTyping ? "animate-ping" : "animate-pulse"}`} style={{ animationDuration: "3s" }} />
            <div className="absolute w-32 h-32 rounded-full bg-gradient-to-br from-purple-500/30 via-fuchsia-500/20 to-cyan-400/30 blur-lg animate-pulse" style={{ animationDuration: "2s" }} />

            {/* Core orb */}
            <div className={`relative w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 ${isTyping ? "scale-110" : "scale-100"}`}
                style={{
                    background: "radial-gradient(circle at 35% 35%, #c084fc, #a855f7, #7c3aed, #4f46e5, #06b6d4)",
                    boxShadow: "0 0 60px rgba(168, 85, 247, 0.6), 0 0 120px rgba(168, 85, 247, 0.3), inset 0 2px 4px rgba(255,255,255,0.2)",
                }}
            >
                {isTyping ? (
                    <div className="flex gap-1.5">
                        {[0, 1, 2].map(i => (
                            <div key={i} className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                    </div>
                ) : (
                    <Brain size={36} className="text-white drop-shadow-lg" />
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────
// Quick Suggestion Chips
// ─────────────────────────────────────────────────────

const QUICK_SUGGESTIONS = [
    { icon: Stethoscope, label: "Baş ağrım ve ateşim var", prompt: "Şiddetli baş ağrısı ve 38.5 derece ateşim var, olası nedenler neler olabilir?" },
    { icon: FlaskConical, label: "Kan tahlilimi yorumla", prompt: "Kan tahlilimi yorumlamama yardım eder misin? Hangi değerlere bakmalıyım?" },
    { icon: Pill, label: "İlaç yan etkisi sor", prompt: "Kullandığım ilacın olası yan etkileri hakkında bilgi almak istiyorum." },
    { icon: Zap, label: "Göğüs ağrısı", prompt: "Göğüs bölgesinde ağrı hissediyorum, bu durumda ne yapmalıyım?" },
];

// ─────────────────────────────────────────────────────
// Chat Bubble
// ─────────────────────────────────────────────────────

function ChatBubble({ msg, userName }: { msg: ChatMessage; userName: string }) {
    const isUser = msg.role === "user";
    const isEmergency = msg.content.includes("🚨 ACİL");

    return (
        <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
            {/* Avatar */}
            <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${isUser
                ? "bg-gradient-to-br from-blue-400 to-indigo-500 text-white"
                : "bg-gradient-to-br from-violet-500 to-fuchsia-400 text-white"
            }`}>
                {isUser ? userName.charAt(0).toUpperCase() : "AI"}
            </div>

            {/* Bubble */}
            <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                isEmergency
                    ? "bg-red-50 border border-red-200 text-red-800"
                    : isUser
                    ? "bg-violet-100 border border-violet-200/60 text-slate-800 rounded-tr-sm"
                    : "bg-white border border-slate-200/60 text-slate-700 rounded-tl-sm"
            }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
        </div>
    );
}


// ─────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────

export default function TriagePage() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();

    const [accepted, setAccepted] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [sessionId, setSessionId] = useState<number | null>(null);
    const [input, setInput] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [sessions, setSessions] = useState<any[]>([]);
    const [sessionsLoaded, setSessionsLoaded] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Redirect if not authenticated
    useEffect(() => {
        if (!loading && !user) router.replace("/login");
    }, [user, loading, router]);

    // Check disclaimer accepted
    useEffect(() => {
        const stored = sessionStorage.getItem("triage_disclaimer_accepted");
        if (stored === "true") setAccepted(true);
    }, []);

    // Load session list on mount
    useEffect(() => {
        if (!accepted || sessionsLoaded || !user) return;
        setSessionsLoaded(true);
        api.get("/api/triage/sessions").then(res => {
            if (res.data) {
                setSessions(res.data);
            }
        }).catch(() => { /* error fetching sessions */ });
    }, [accepted, user, sessionsLoaded]);

    const loadSession = (id: number) => {
        api.get(`/api/triage/sessions/${id}`).then(res => {
            if (res.data) {
                setSessionId(res.data.session_id);
                setMessages(res.data.messages || []);
            }
        }).catch(() => { /* error loading session */ });
    };

    // Scroll to bottom on new message
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isSending]);

    const handleAccept = () => {
        sessionStorage.setItem("triage_disclaimer_accepted", "true");
        setAccepted(true);
    };

    const handleSend = async (text?: string) => {
        const messageText = (text ?? input).trim();
        if (!messageText || isSending) return;

        // Optimistic UI
        const userMsg: ChatMessage = { role: "user", content: messageText, created_at: new Date().toISOString() };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsSending(true);

        try {
            const res = await api.post("/api/triage/chat", {
                message: messageText,
                session_id: sessionId,
            });
            setSessionId(res.data.session_id);
            // Replace with server messages (has created_at)
            setMessages(res.data.messages);
        } catch (err) {
            setMessages(prev => [...prev, {
                role: "assistant",
                content: "⚠️ Bir hata oluştu. İnternet bağlantınızı kontrol edin ve tekrar deneyin.",
                created_at: new Date().toISOString(),
            }]);
        } finally {
            setIsSending(false);
        }
    };

    const handleNewChat = () => {
        setMessages([]);
        setSessionId(null);
        setInput("");
        // Reload session list in case we just finished one
        api.get("/api/triage/sessions").then(res => {
            if (res.data) setSessions(res.data);
        }).catch(() => {});
    };


    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #ede9fe 0%, #f3e8ff 30%, #cffafe 70%, #ecfdf5 100%)" }}>
                <Loader2 size={36} className="text-violet-500 animate-spin" />
            </div>
        );
    }

    const hasMessages = messages.length > 0;
    const firstName = user?.name?.split(" ")[0] ?? "Kullanıcı";

    return (
        <>
            {!accepted && <DisclaimerModal onAccept={handleAccept} />}

            <div
                className="min-h-screen flex flex-col relative overflow-hidden"
                style={{
                    background: "linear-gradient(135deg, #ede9fe 0%, #f5f3ff 20%, #faf5ff 40%, #ecfeff 70%, #f0fdfa 100%)",
                }}
            >
                {/* Animated mesh blobs — soft pastel, low opacity */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-violet-300/20 blur-3xl animate-pulse" style={{ animationDuration: "6s" }} />
                    <div className="absolute -bottom-40 -right-20 w-[500px] h-[500px] rounded-full bg-cyan-300/20 blur-3xl animate-pulse" style={{ animationDuration: "8s" }} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-fuchsia-200/15 blur-3xl animate-pulse" style={{ animationDuration: "5s" }} />
                </div>

                {/* Shared Top Navbar */}
                <TopNavbar
                    rightExtra={
                        hasMessages ? (
                            <button
                                onClick={handleNewChat}
                                className="flex items-center gap-1.5 text-sm font-semibold text-violet-600 hover:text-violet-800 bg-violet-50 hover:bg-violet-100 border border-violet-200 px-3 py-1.5 rounded-xl transition-all active:scale-95"
                            >
                                <SquarePen size={14} />
                                Yeni Sohbet
                            </button>
                        ) : null
                    }
                />

                <div className="flex-1 flex overflow-hidden relative z-10 w-full max-w-screen-2xl mx-auto">
                    {/* Left Sidebar for History */}
                    <div className="hidden md:flex w-72 flex-col border-r border-slate-200/50 bg-white/40 backdrop-blur-md">
                        <div className="p-5 border-b border-slate-200/50 flex items-center gap-2 text-slate-800">
                            <MessageCircle size={18} className="text-violet-500" />
                            <h3 className="font-bold text-sm">Önceki Sohbetler</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {sessions.length === 0 ? (
                                <div className="text-xs text-slate-500 text-center mt-4">Henüz sohbet geçmişi yok</div>
                            ) : (
                                sessions.map((s) => (
                                    <button
                                        key={s.session_id}
                                        onClick={() => loadSession(s.session_id)}
                                        className={`w-full text-left p-3 rounded-xl text-sm transition-all ${
                                            sessionId === s.session_id 
                                                ? 'bg-violet-100/80 border border-violet-200 shadow-sm'
                                                : 'bg-white/50 border border-transparent hover:bg-white/80 hover:border-slate-200/60'
                                        }`}
                                    >
                                        <p className="font-semibold text-slate-800 truncate">{s.preview_text}</p>
                                        <p className="text-[10px] text-slate-400 mt-1">
                                            {new Date(s.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col items-center justify-between px-4 py-8 max-w-3xl mx-auto w-full h-full overflow-y-auto">

                        {/* Welcome / Orb Section */}
                        {!hasMessages && (
                            <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center pb-8 w-full mt-10">
                                <AIOrb isTyping={false} />

                                <div>
                                    <p className="text-slate-500 text-sm mb-1">Merhaba, {firstName} 👋</p>
                                    <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                                        Sağlığınız hakkında<br />
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-cyan-500">
                                            ne öğrenmek istersiniz?
                                        </span>
                                    </h1>
                                </div>

                                {/* Quick Suggestion Cards */}
                                <div className="grid grid-cols-2 gap-3 w-full max-w-xl">
                                    {QUICK_SUGGESTIONS.map((s) => (
                                        <button
                                            key={s.label}
                                            onClick={() => handleSend(s.prompt)}
                                            className="group text-left p-4 rounded-2xl bg-white/70 backdrop-blur-sm border border-slate-200/60 shadow-sm hover:bg-white hover:shadow-md hover:border-violet-200 transition-all duration-200 hover:-translate-y-0.5"
                                        >
                                            <s.icon size={18} className="text-violet-500 mb-2 group-hover:text-cyan-500 transition-colors" />
                                            <p className="text-slate-700 text-sm font-medium leading-snug">{s.label}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Chat Messages */}
                        {hasMessages && (
                            <div className="flex-1 w-full overflow-y-auto space-y-5 pb-4 pr-1" style={{ maxHeight: "calc(100vh - 280px)" }}>
                                {/* Orb mini version */}
                                <div className="flex justify-center mb-4">
                                    <AIOrb isTyping={isSending} />
                                </div>

                                {messages.map((msg, i) => (
                                    <ChatBubble key={i} msg={msg} userName={firstName} />
                                ))}

                                {/* Typing indicator */}
                                {isSending && (
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-400 flex items-center justify-center text-white text-xs font-bold">AI</div>
                                        <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-sm">
                                            <div className="flex gap-1.5">
                                                {[0, 1, 2].map(i => (
                                                    <div key={i} className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>
                        )}

                        {/* Input Box */}
                        <div className="w-full mt-auto pt-4">
                            <div className="relative bg-white/80 backdrop-blur-xl border border-slate-200/70 rounded-3xl shadow-[0_8px_30px_rgba(109,40,217,0.1)] p-4 flex flex-col gap-3">
                                <textarea
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                placeholder="Belirtilerinizi veya sorunuzu yazın..."
                                rows={2}
                                className="w-full bg-transparent text-slate-800 placeholder-slate-400 text-sm resize-none outline-none leading-relaxed"
                            />
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                                    <Shield size={12} />
                                    <span>Bu bir yapay zekadır · Kesin tanı koymaz</span>
                                </div>
                                <button
                                    onClick={() => handleSend()}
                                    disabled={!input.trim() || isSending}
                                    className="flex items-center gap-2 px-5 py-2 rounded-2xl text-sm font-semibold text-white transition-all
                                        bg-gradient-to-r from-violet-600 to-cyan-500 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed
                                        shadow-md shadow-violet-300/40 active:scale-95"
                                >
                                    {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                    Gönder
                                </button>
                            </div>
                        </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

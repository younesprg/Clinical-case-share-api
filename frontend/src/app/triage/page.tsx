"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import {
    HeartPulse, Send, Zap, Stethoscope, Pill, FlaskConical,
    Brain, AlertTriangle, X, ChevronDown, LogOut, Loader2,
    MessageCircle, Shield, SquarePen, Plus
} from "lucide-react";
import TopNavbar from "@/components/TopNavbar";
import SidePanel from "@/components/SidePanel";

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

    const renderInputBox = () => (
        <div className="relative bg-white border border-slate-200/80 rounded-2xl shadow-xl overflow-hidden p-0 flex flex-col transition-all focus-within:shadow-2xl focus-within:border-violet-300">
            {/* Top Gradient Strip */}
            <div className="h-2 w-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400" />
            
            <div className="p-4 pb-3 flex flex-col gap-3">
                <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="Belirtilerinizi veya sorunuzu yazın..."
                    rows={3}
                    className="w-full bg-transparent text-slate-800 placeholder-slate-400 text-base resize-none outline-none leading-relaxed max-h-40 overflow-y-auto px-1 pt-1"
                />
                
                <div className="flex items-center justify-between mt-2">
                    {/* Left Actions (Attachments / Modes) */}
                    <div className="flex items-center gap-2">
                        <button 
                            className="w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 transition-colors"
                            title="Dosya Ekle"
                        >
                            <Plus size={18} />
                        </button>
                        <button 
                            className="px-4 h-9 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center gap-2 text-slate-600 text-[13px] font-semibold transition-colors"
                        >
                            <Brain size={14} className="text-violet-500" />
                            Klinik Analiz
                        </button>
                    </div>
                    
                    {/* Right Actions (Send) */}
                    <button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isSending}
                        className="flex items-center gap-2 px-6 h-9 rounded-full text-[13px] font-bold text-white transition-all
                            bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed
                            shadow-sm"
                    >
                        {isSending ? <Loader2 size={15} className="animate-spin" /> : "Gönder"}
                    </button>
                </div>
            </div>
        </div>
    );

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
                
                {/* Shared Top Navbar (Full Width) */}
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

                {/* Sidebar Navigation */}
                <SidePanel />

                {/* Main Content Area (Offset by sidebar width on large screens) */}
                <div className="flex-1 flex flex-col lg:pl-64 relative z-10 h-[calc(100vh-4rem)]">
                    <div className="flex-1 flex flex-col w-full h-full relative">

                        {/* Scrollable Content Area */}
                        <div className={`flex-1 overflow-y-auto w-full custom-scrollbar ${hasMessages ? 'pb-32' : ''}`}>
                            {!hasMessages ? (
                                <div className="flex flex-col items-center justify-center min-h-full py-10 w-full px-4">
                                    <AIOrb isTyping={false} />
                                    <div className="text-center mt-6 mb-6">
                                        <p className="text-slate-500 text-sm mb-1">Merhaba, {firstName} 👋</p>
                                        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                                            Sağlığınız hakkında<br />
                                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-cyan-500">
                                                ne öğrenmek istersiniz?
                                            </span>
                                        </h1>
                                    </div>

                                    {/* Quick Suggestion Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-3xl mb-8">
                                        {QUICK_SUGGESTIONS.map((s) => (
                                            <button
                                                key={s.label}
                                                onClick={() => handleSend(s.prompt)}
                                                className="group text-left p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-slate-200/60 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:bg-white hover:shadow-md hover:border-violet-200 transition-all duration-300 hover:-translate-y-0.5"
                                            >
                                                <s.icon size={18} className="text-violet-500 mb-2 group-hover:text-cyan-500 transition-colors" />
                                                <p className="text-slate-700 text-sm font-medium leading-snug">{s.label}</p>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Input Box for Welcome Screen */}
                                    <div className="w-full max-w-5xl">
                                        {renderInputBox()}
                                    </div>

                                    {/* Vertical Recent Chats List */}
                                    {sessions.length > 0 && (
                                        <div className="w-full max-w-5xl mt-12 flex flex-col gap-1 text-left">
                                            <div className="text-sm font-semibold text-slate-500 mb-3 px-2">
                                                Önceki sohbetler
                                            </div>
                                            {sessions.map(s => {
                                                const dateStr = new Date(s.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
                                                return (
                                                    <button
                                                        key={s.session_id}
                                                        onClick={() => loadSession(s.session_id)}
                                                        className="flex justify-between items-center px-4 py-3.5 hover:bg-white/40 rounded-2xl transition-all border border-transparent hover:border-slate-200/50 w-full text-left group"
                                                    >
                                                        <span className="text-sm text-slate-700 font-medium truncate pr-4 group-hover:text-violet-700 transition-colors">{s.preview_text}</span>
                                                        <span className="text-xs text-slate-400 whitespace-nowrap">{dateStr}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-6">
                                    <div className="flex justify-center mb-6">
                                        <AIOrb isTyping={isSending} />
                                    </div>

                                    {messages.map((msg, i) => (
                                        <ChatBubble key={i} msg={msg} userName={firstName} />
                                    ))}

                                    {isSending && (
                                        <div className="flex gap-3">
                                            <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-400 flex items-center justify-center text-white text-xs font-bold shadow-sm">AI</div>
                                            <div className="px-5 py-4 rounded-2xl rounded-tl-sm bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-sm">
                                                <div className="flex gap-1.5 items-center h-full">
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
                        </div>

                        {/* Bottom Fixed Area: Input Box (Only for active chat) */}
                        {hasMessages && (
                            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-white/80 via-white/50 to-transparent pt-10 pb-6 px-4 backdrop-blur-[2px]">
                                <div className="w-full max-w-5xl mx-auto flex flex-col gap-4">
                                    {renderInputBox()}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

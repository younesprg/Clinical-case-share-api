"use client";

import { useState, useEffect, useCallback } from 'react';
import { Coins, TrendingUp, ChevronDown, ChevronUp, Trophy, Clock } from 'lucide-react';
import api from '@/lib/api';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

interface TokenBalance {
    balance: number;
    academic_score: number;
    total_earned: number;
}

interface TokenTransaction {
    id: number;
    tx_type: string;
    amount: number;
    description: string | null;
    created_at: string;
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function txTypeLabel(type: string): string {
    const map: Record<string, string> = {
        validation_first_five: '✅ 5 Doğrulama Ödülü',
        comment_approved: '👍 Yorum Onay Ödülü',
        rare_case_bonus: '🔬 Nadir Vaka Bonusu',
        thank_you_sent: '🪙 Teşekkür Gönderildi',
        thank_you_received: '🪙 Teşekkür Alındı',
        admin_award: '🏆 Admin Ödülü',
    };
    return map[type] || type;
}

function timeAgo(dateStr: string): string {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Az önce';
    if (mins < 60) return `${mins}d önce`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}sa önce`;
    return `${Math.floor(hours / 24)}g önce`;
}

// ─────────────────────────────────────────────
// ANIMATED COUNTER
// ─────────────────────────────────────────────

function AnimatedCounter({ value }: { value: number }) {
    const [displayed, setDisplayed] = useState(value);

    useEffect(() => {
        const target = value;
        const start = displayed;
        if (start === target) return;
        const duration = 600;
        const steps = 20;
        const stepTime = duration / steps;
        const increment = (target - start) / steps;
        let current = start;
        let step = 0;
        const timer = setInterval(() => {
            step++;
            current += increment;
            if (step >= steps) {
                setDisplayed(target);
                clearInterval(timer);
            } else {
                setDisplayed(Math.round(current));
            }
        }, stepTime);
        return () => clearInterval(timer);
    }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

    return <span>{displayed}</span>;
}

// ─────────────────────────────────────────────
// MAIN WIDGET
// ─────────────────────────────────────────────

export default function MedTokenWidget() {
    const [balance, setBalance] = useState<TokenBalance | null>(null);
    const [history, setHistory] = useState<TokenTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [balRes, histRes] = await Promise.all([
                api.get('/api/tokens/balance'),
                api.get('/api/tokens/history', { params: { limit: 5 } }),
            ]);
            setBalance(balRes.data);
            setHistory(histRes.data);
        } catch {
            // Silently ignore — widget is supplementary
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Expose refresh so parent can call after token events
    // (we export a refresh hook via window event for simplicity)
    useEffect(() => {
        const handler = () => fetchData();
        window.addEventListener('med-token-update', handler);
        return () => window.removeEventListener('med-token-update', handler);
    }, [fetchData]);

    const GLASS = "bg-white/40 backdrop-blur-2xl border-[1.5px] border-slate-400/30 shadow-[0_8px_30px_rgba(0,0,0,0.05)] rounded-[1.5rem] p-4";

    if (loading) {
        return (
            <div className={GLASS}>
                <div className="flex items-center gap-2 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-amber-200/60" />
                    <div className="flex-1">
                        <div className="h-3 w-24 bg-slate-200 rounded-full mb-1.5" />
                        <div className="h-5 w-16 bg-slate-200 rounded-full" />
                    </div>
                </div>
            </div>
        );
    }

    if (!balance) return null;

    return (
        <div className={GLASS}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-[0_4px_12px_rgba(245,158,11,0.35)]">
                        <Coins size={16} className="text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">MedToken Cüzdan</p>
                    </div>
                </div>
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/60 transition-all"
                    aria-label="Toggle details"
                >
                    {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
            </div>

            {/* Balance Display */}
            <div className="flex items-end gap-3 mb-3">
                <div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-900 tracking-tight">
                            <AnimatedCounter value={balance.balance} />
                        </span>
                        <span className="text-base font-bold text-amber-500">$MED</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Mevcut bakiye</p>
                </div>
                <div className="ml-auto text-right">
                    <div className="flex items-center gap-1 justify-end">
                        <TrendingUp size={12} className="text-emerald-500" />
                        <span className="text-sm font-bold text-emerald-600">{balance.total_earned}</span>
                    </div>
                    <p className="text-[10px] text-slate-400">Toplam kazanım</p>
                </div>
            </div>

            {/* Academic Score Bar */}
            <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                        <Trophy size={11} className="text-violet-500" />
                        Akademik Puan
                    </span>
                    <span className="text-[11px] font-bold text-violet-600">{balance.academic_score} AP</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200/60 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full transition-all duration-700"
                        style={{ width: `${Math.min((balance.academic_score / 100) * 100, 100)}%` }}
                    />
                </div>
            </div>

            {/* Expanded: Recent Transactions */}
            {expanded && history.length > 0 && (
                <div className="border-t border-slate-200/40 pt-3 mt-1">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                        <Clock size={11} />
                        Son İşlemler
                    </p>
                    <div className="space-y-2">
                        {history.slice(0, 4).map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between">
                                <div className="min-w-0 flex-1">
                                    <p className="text-[11px] font-medium text-slate-700 truncate">{txTypeLabel(tx.tx_type)}</p>
                                    <p className="text-[10px] text-slate-400">{timeAgo(tx.created_at)}</p>
                                </div>
                                <span
                                    className={`text-xs font-bold ml-2 shrink-0 ${tx.amount >= 0 ? 'text-emerald-600' : 'text-red-500'}`}
                                >
                                    {tx.amount >= 0 ? '+' : ''}{tx.amount} MED
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {expanded && history.length === 0 && (
                <div className="border-t border-slate-200/40 pt-3 mt-1 text-center">
                    <p className="text-xs text-slate-400">Henüz işlem geçmişi yok.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Vakaları doğrulayarak MED kazan!</p>
                </div>
            )}

            {/* How to earn hint */}
            {!expanded && (
                <div className="flex gap-2 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100/60 font-medium">
                        Doğrula +5
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-100/60 font-medium">
                        Nadir Vaka +50
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100/60 font-medium">
                        Katılıyorum +10
                    </span>
                </div>
            )}
        </div>
    );
}

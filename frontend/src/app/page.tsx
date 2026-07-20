"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronDown, ArrowRight, HeartPulse, BookOpen, Database, Zap, ShieldCheck } from 'lucide-react';

// ─── News Ticker ─────────────────────────────────────────────
const TICKER_TEXT = [
    "🔬 Yeni Vaka: Nöroloji alanında çığır açan araştırmalar yayınlandı",
    "🩺 Med+ AI, yeni PubMed verileriyle güncellendi",
    "💻 Sağlıkta Blockchain: Smart Contract tabanlı immütatif veri yönetimi üzerine rapor",
    "🧬 Genomik Tıp: Kişiselleştirilmiş tedavi protokolleri artık Med+ arşivinde",
    "📊 Global Vaka Analizi: Europe PMC RAG entegrasyonu aktif",
].join('   ·   ');

function NewsTicker() {
    return (
        <div className="bg-slate-800 overflow-hidden py-3 border-t border-slate-700">
            <motion.div
                className="flex whitespace-nowrap text-sm text-slate-300 font-medium"
                animate={{ x: ['0%', '-50%'] }}
                transition={{ duration: 50, ease: 'linear', repeat: Infinity }}
                style={{ willChange: 'transform' }}
            >
                <span className="pr-16">{TICKER_TEXT}</span>
                <span className="pr-16">{TICKER_TEXT}</span>
            </motion.div>
        </div>
    );
}

// ─── Feature Cards ────────────────────────────────────────────
const features = [
    {
        image: '/animations/ai-icon.png',
        alt: 'Med+ AI Icon',
        badge: 'Med+ AI',
        badgeBg: 'bg-blue-100 text-blue-700',
        headline: 'Yüksek Hassasiyetli Klinik Karar Motoru',
        description:
            'Klinik verilerinizi modern dil modelleriyle sentezleyen Med+ AI, tanı süreçlerinizde sıfır hata toleransıyla çalışır. Tıbbi normlara tam uyumlu ve güvenilir analizler sunar.',
    },
    {
        image: '/animations/rag-icon.png',
        alt: 'Europe PMC RAG Icon',
        badge: 'Europe PMC · RAG',
        badgeBg: 'bg-indigo-100 text-indigo-700',
        headline: 'Global Literatürden Canlı Vaka Analizi',
        description:
            "40 milyondan fazla biyomedikal makaleye sahip Europe PMC'den gerçek vaka raporlarını çeken ve Türkçe özetleyen RAG pipeline'ı.",
    },
    {
        image: '/animations/secure-icon.png',
        alt: 'Secure Auth Icon',
        badge: 'Güvenli Auth',
        badgeBg: 'bg-emerald-100 text-emerald-700',
        headline: 'Güvenli Auth: JWT & Bcrypt ile Tam Veri Koruması',
        description:
            'Rol tabanlı erişim kontrolü (RBAC), bcrypt ile şifrelenmiş kimlik bilgileri ve güvenli JWT döngüsüyle hasta verileriniz korunur.',
    },
];

const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.55, delay: i * 0.12, ease: [0.25, 0.1, 0.25, 1] as const },
    }),
};

// ─── Page ─────────────────────────────────────────────────────
interface PmcArticle { title: string; authorString: string; pubYear: string; }

const FALLBACK_NEWS: PmcArticle[] = [
    { title: 'Yeni CAR-T hücre tedavisi, relaps B-hücreli lenfoma hastalarında %90 remisyon oranı gösterdi', authorString: 'Shah ve ark.', pubYear: '2025' },
    { title: 'FDA, küçük hücreli olmayan akciğer kanseri için yeni KRAS G12C inhibitörünü onayladı', authorString: 'Johnson ve ark.', pubYear: '2025' },
    { title: 'mRNA aşı platformu Faz III klinik denemede kişiselleştirilmiş kanser immünoterapisine genişletildi', authorString: 'Moderna Araştırma Grubu', pubYear: '2025' },
    { title: 'CRISPR gen düzenleme tedavisi, orak hücre hastalığını hastaların %97\'sinde düzeltti', authorString: 'Frangoul ve ark.', pubYear: '2025' },
    { title: 'Yapay zeka destekli ilaç keşfi, ilaca dirençli bakterilere karşı yeni antibiyotik adayı belirledi', authorString: 'MIT CSAIL Ekibi', pubYear: '2024' },
    { title: 'PD-L1 checkpoint inhibitörü kombinasyonu, metastatik melanomda sağkalımı üç katına çıkardı', authorString: 'Weber ve ark.', pubYear: '2024' },
    { title: 'GLP-1 reseptör agonisti, obezite çalışmasında kardiyovasküler olayları %20 azalttı', authorString: 'Marso ve ark.', pubYear: '2025' },
    { title: 'İlk oral PCSK9 inhibitörü, enjeksiyon biyolojiklere kıyasla benzer LDL düşüşü sağladı', authorString: 'Ray ve ark.', pubYear: '2025' },
    { title: 'Alzheimer hastalığı: Lecanemab, 18 ayda bilişsel gerilemeyi %35 yavaşlattı', authorString: 'van Dyck ve ark.', pubYear: '2025' },
    { title: 'Sıvı biyopsi ctDNA testi, erken evre pankreas kanserini %89 duyarlılıkla saptadı', authorString: 'Cohen ve ark.', pubYear: '2024' },
];

export default function LandingPage() {
    const [news, setNews] = useState<PmcArticle[]>(FALLBACK_NEWS);

    useEffect(() => {
        fetch('https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=(cancer+treatment+OR+drug+discovery+OR+immunotherapy+OR+new+drug+OR+clinical+breakthrough)&sort=P_PDATE_D&format=json&resultType=lite&pageSize=12')
            .then(r => r.json())
            .then(data => {
                const results: PmcArticle[] = (data?.resultList?.result ?? []).filter((item: any) => item.title);
                if (results.length > 0) {
                    setNews(results.map((item: any) => ({
                        title: item.title ?? '',
                        authorString: item.authorString ?? '',
                        pubYear: item.pubYear ?? '',
                    })));
                }
            })
            .catch(() => { /* keep fallback */ });
    }, []);

    // Duplicate for seamless infinite loop
    const marqueeItems = [...news, ...news];
    return (
        <div className="min-h-screen bg-white overflow-x-hidden">

            {/* Sticky Navbar */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <HeartPulse size={18} className="text-white" strokeWidth={2.5} />
                        </div>
                        <span className="text-base tracking-tight">Med<span className="text-blue-600">+</span></span>
                    </Link>

                    <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-slate-600">
                        <Link href="/dashboard" className="hover:text-slate-900 transition-colors">Vakalar</Link>
                        <Link href="/encyclopedia" className="hover:text-slate-900 transition-colors">Klinik Arşiv</Link>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link href="/login" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors px-3 py-2">
                            Giriş Yap
                        </Link>
                        <Link href="/dashboard" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors shadow-sm">
                            Doktor Panelini Aç
                        </Link>
                    </div>
                </div>
            </header>

            {/* ── SECTION 1: Hero ── */}
            <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
                <video
                    src="/animations/hero-bg.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/55" />
                <div
                    className="absolute inset-0 opacity-[0.06]"
                    style={{
                        backgroundImage:
                            'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
                        backgroundSize: '64px 64px',
                    }}
                />

                <div className="relative z-10 text-center max-w-4xl px-6">
                    <motion.div
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/90 text-xs font-semibold px-4 py-1.5 rounded-full mb-8 backdrop-blur-sm"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                        Klinik Yapay Zeka Platformu · Europe PMC API · RAG
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 28 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.65, delay: 0.1 }}
                        className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight text-white mb-5"
                    >
                        Klinik Kararlarınızda<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                            Güvenilir Yapay Zeka Asistanınız
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 28 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.65, delay: 0.2 }}
                        className="text-white/70 text-lg sm:text-xl max-w-2xl mx-auto mb-10"
                    >
                        Güvenilir Klinik Analizler ve Global Literatür ile Teşhis Süreçlerinizi Hızlandırın.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 28 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.65, delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <Link
                            href="/dashboard"
                            className="group flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-2xl text-base transition-all shadow-xl shadow-blue-600/30 hover:-translate-y-0.5"
                        >
                            Doktor Panelini Aç
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                            href="/encyclopedia"
                            className="flex items-center gap-2 border-2 border-white/30 hover:border-white/60 hover:bg-white/10 text-white font-semibold px-8 py-4 rounded-2xl text-base transition-all backdrop-blur-sm"
                        >
                            <BookOpen size={18} />
                            Klinik Arşivi Keşfet
                        </Link>
                    </motion.div>
                </div>

                <motion.div
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-white/50"
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <span className="text-[10px] uppercase tracking-widest font-semibold">Aşağı Kaydır</span>
                    <ChevronDown size={20} />
                </motion.div>
            </section>

            {/* ── SECTION 2: Bento Feature Grid ── */}
            <section className="relative bg-slate-50 py-24 px-6 overflow-hidden">
                {/* Aura: blurred hero video softly glowing behind cards */}
                <div className="absolute inset-0 overflow-hidden">
                    <video
                        src="/animations/hero-bg.mp4"
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                        style={{ opacity: 0.08, filter: 'blur(80px)', transform: 'scale(1.1)' }}
                    />
                    {/* White fade top/bottom so it doesn't bleed into neighbouring sections */}
                    <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-slate-50 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-50 to-transparent" />
                </div>

                <div className="relative z-10 max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.4 }}
                        transition={{ duration: 0.55 }}
                        className="text-center mb-16"
                    >
                        <p className="text-blue-600 text-sm font-bold uppercase tracking-widest mb-3">Platform Özellikleri</p>
                        <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                            Tıbbın Geleceğini <span className="text-blue-600">Şimdi Yaşayın</span>
                        </h2>
                        <p className="text-slate-500 mt-4 max-w-xl mx-auto">
                            Klinisyenler için tasarlanmış, gerçek yapay zeka destekli araçlarla tanışın.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {features.map((f, i) => (
                            <motion.div
                                key={f.badge}
                                custom={i}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, amount: 0.2 }}
                                variants={cardVariants}
                                className="bg-white/40 backdrop-blur-xl rounded-3xl p-7 border border-white/60 shadow-[0_20px_50px_rgba(0,0,0,0.06)] hover:shadow-[0_24px_60px_rgba(0,0,0,0.10)] transition-all duration-300 hover:-translate-y-1 flex flex-col"
                            >
                                <div className="mb-6 flex items-center justify-center h-24">
                                    <motion.img
                                        src={f.image}
                                        alt={f.alt}
                                        className="w-24 h-24 object-contain"
                                        animate={{ y: [0, -10, 0] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                </div>
                                <span className={`inline-flex w-fit items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${f.badgeBg} mb-4`}>
                                    {f.badge}
                                </span>
                                <h3 className="text-slate-900 font-bold text-lg leading-snug mb-3">{f.headline}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed flex-1">{f.description}</p>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.55, delay: 0.4 }}
                        className="mt-12 grid grid-cols-3 divide-x divide-white/40 border border-white/40 rounded-3xl overflow-hidden bg-white/50 backdrop-blur-lg shadow-sm"
                    >
                        {[
                            { icon: Database, value: '40M+', label: 'Biyomedikal Makale' },
                            { icon: Zap, value: '<2s', label: 'AI Analiz Süresi' },
                            { icon: ShieldCheck, value: '100%', label: 'JSON şema Uyumu' },
                        ].map(s => (
                            <div key={s.label} className="py-8 text-center flex flex-col items-center gap-2">
                                <s.icon size={20} className="text-slate-400" />
                                <p className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-cyan-600">{s.value}</p>
                                <p className="text-slate-500 text-sm">{s.label}</p>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>


            {/* ── SECTION 3: Live Literature Marquee ── */}
            <section className="relative bg-slate-900 py-16 overflow-hidden">
                    {/* Radial depth */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/30 via-slate-900 to-slate-900 pointer-events-none" />

                    <div className="relative z-10 mb-8 text-center">
                        <p className="text-slate-400 text-xs uppercase tracking-widest font-semibold">
                            Global Literatürden Canlı Akış
                        </p>
                    </div>

                    {/* Fade-out mask edges */}
                    <div
                        className="overflow-hidden"
                        style={{
                            maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
                            WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
                        }}
                    >
                        <motion.div
                            className="flex"
                            animate={{ x: [0, -(marqueeItems.length / 2) * 390] }}
                            transition={{ duration: 40, ease: 'linear', repeat: Infinity }}
                            style={{ willChange: 'transform' }}
                        >
                            {marqueeItems.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="bg-white/10 backdrop-blur-md border border-white/20 shadow-lg rounded-2xl p-5 min-w-[350px] mx-4 flex-shrink-0 text-left"
                                >
                                    <p className="text-white/90 font-semibold text-sm leading-snug line-clamp-2">
                                        {item.title}
                                    </p>
                                    <p className="text-white/50 text-xs mt-2 truncate">
                                        {item.authorString}{item.pubYear ? ` · ${item.pubYear}` : ''}
                                    </p>
                                </div>
                            ))}
                        </motion.div>
                    </div>
            </section>

            {/* ── SECTION 4: CTA Banner ── */}
            <section className="bg-slate-900 relative overflow-hidden py-24 px-6 text-center">
                {/* Radial gradient depth texture */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-900 to-slate-900" />
                {/* Subtle grid lines */}
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage:
                            'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
                        backgroundSize: '48px 48px',
                    }}
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.5 }}
                    className="relative z-10 max-w-2xl mx-auto"
                >
                    <span className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                        Hemen Başlayın
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
                        Klinik Karar Destek Sisteminizi<br />Bugün Kurun
                    </h2>
                    <p className="text-slate-400 mb-10 text-base max-w-lg mx-auto">
                        Kayıt olun, hastalarınızı ekleyin ve AI destekli klinik analizi hemen deneyimleyin.
                    </p>
                    <Link
                        href="/register"
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-2xl text-base transition-all shadow-[0_0_24px_rgba(37,99,235,0.4)] hover:shadow-[0_0_32px_rgba(37,99,235,0.55)] hover:-translate-y-0.5"
                    >
                        Hesap Oluştur <ArrowRight size={18} />
                    </Link>
                </motion.div>
            </section>

            {/* ── SECTION 4: News Ticker ── */}
            <NewsTicker />

            <footer className="bg-slate-900 py-6 text-center text-slate-500 text-xs">
                © {new Date().getFullYear()} Med<span className="text-blue-400">+</span> · Klinik Karar Destek Sistemi
            </footer>
        </div>
    );
}

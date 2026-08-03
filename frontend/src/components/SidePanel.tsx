"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
    Globe, FolderOpen, BookmarkCheck, Sparkles, Zap, Settings, BadgeCheck
} from 'lucide-react';

export default function SidePanel() {
    const { user } = useAuth();
    const pathname = usePathname();

    const displayName = user?.role === 'doctor'
        ? `${user?.title || 'Dr.'} ${user?.name}`
        : user?.name || 'Kullanıcı';

    const displayRole = user?.specialty || 'Tıp Profesyoneli';

    const menuItems = [
        { icon: Globe, label: "Sosyal Akış", active: pathname === '/feed', href: "/feed" },
        { icon: FolderOpen, label: "Klinik Vakalar", active: pathname === '/dashboard' || pathname.startsWith('/cases'), href: "/dashboard" },
        { icon: BookmarkCheck, label: "Kaydedilenler", active: pathname === '/saved', href: "#" },
        { icon: Sparkles, label: "Klinik Arşiv", active: pathname === '/encyclopedia', href: "/encyclopedia" },
        { icon: Zap, label: "Hızlı Teşhis", active: pathname === '/triage', href: "/triage" },
        { icon: Settings, label: "Ayarlar", active: pathname === '/settings', href: "#" },
    ];

    return (
        <aside className="hidden lg:flex fixed left-0 top-[3.5rem] h-[calc(100vh-3.5rem)] w-64 bg-white/40 backdrop-blur-xl border-r border-slate-200/50 flex-col z-40">
            {/* Profile Section */}
            <div className="flex flex-col items-center text-center px-5 pt-6 pb-4 border-b border-slate-100">
                <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=c7d2fe&color=3730a3&bold=true&size=80`}
                    alt="Avatar"
                    className="w-14 h-14 rounded-full border-[3px] border-white shadow-sm mb-3"
                />
                <div className="flex items-center gap-1.5 mb-0.5">
                    <h3 className="font-bold text-slate-800 text-sm">{displayName}</h3>
                    <BadgeCheck size={15} className="text-blue-500 fill-blue-100" />
                </div>
                <p className="text-xs text-slate-500 mb-3">{displayRole}</p>

                <div className="flex gap-6 text-center border-t border-slate-100 pt-3 w-full justify-center">
                    <div>
                        <p className="text-base font-bold text-slate-800">12</p>
                        <p className="text-[11px] text-slate-400">Vaka</p>
                    </div>
                    <div className="w-px bg-slate-200" />
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
                        className={`flex items-center gap-3 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${item.active
                            ? 'bg-blue-50 text-blue-700 shadow-sm'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                            }`}
                    >
                        <item.icon size={18} className={item.active ? "text-blue-600" : "text-slate-400"} />
                        {item.label}
                    </Link>
                ))}
            </nav>
        </aside>
    );
}

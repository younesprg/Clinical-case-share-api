"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { HeartPulse, BookOpen, LayoutDashboard, ChevronDown, LogOut, PlusCircle } from 'lucide-react';
import { useState } from 'react';

export default function TopNavbar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [showDropdown, setShowDropdown] = useState(false);

    const navLinks = [
        { href: '/cases', label: 'Vakalar', icon: LayoutDashboard },
        { href: '/encyclopedia', label: 'Klinik Arşiv', icon: BookOpen },
    ];

    const isActive = (href: string) =>
        href === '/cases'
            ? pathname.startsWith('/cases') || pathname.startsWith('/patient')
            : pathname.startsWith(href);

    return (
        <nav className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
            <div className="max-w-screen-2xl mx-auto px-6 h-16 flex items-center justify-between gap-6">

                {/* LEFT: Logo + Nav Links */}
                <div className="flex items-center gap-8">
                    {/* Logo */}
                    <Link href="/cases" className="flex items-center gap-2 font-bold text-slate-800 hover:text-blue-600 transition-colors">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <HeartPulse size={18} className="text-white" strokeWidth={2.5} />
                        </div>
                        <span className="text-base tracking-tight">Med<span className="text-blue-600">+</span></span>
                    </Link>

                    {/* Nav Links */}
                    <div className="flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                                    isActive(link.href)
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                                }`}
                            >
                                <link.icon size={15} />
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* RIGHT: Add Case + Avatar */}
                <div className="flex items-center gap-3">
                    {user?.role === 'doctor' && (
                        <button
                            onClick={() => router.push('/cases/new')}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
                        >
                            <PlusCircle size={16} />
                            Yeni Vaka
                        </button>
                    )}

                    {/* Profile Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="flex items-center gap-2.5 hover:bg-slate-50 px-2 py-1.5 rounded-xl transition-colors"
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
                                <p className="text-xs text-slate-400 capitalize mt-0.5">{user?.role}</p>
                            </div>
                            <ChevronDown size={14} className="text-slate-400" />
                        </button>

                        {showDropdown && (
                            <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 py-1 z-50">
                                <div className="px-4 py-3 border-b border-slate-50">
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hesap</p>
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

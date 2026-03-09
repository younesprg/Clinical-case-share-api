import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Calendar,
    MessageSquare,
    PlusSquare,
    Settings,
    FileText,
    HeartPulse
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';

export default function Sidebar() {
    const pathname = usePathname();
    const { user } = useAuth();

    const navItems = [
        { icon: LayoutDashboard, href: '/cases', label: 'Dashboard' },
        { icon: Calendar, href: '/calendar', label: 'Appointments' },
        { icon: MessageSquare, href: '/messages', label: 'Messages' },
        ...(user?.role === 'doctor' ? [{ icon: PlusSquare, href: '/cases/new', label: 'New Case' }] : []),
        { icon: FileText, href: '/reports', label: 'Reports' },
    ];

    return (
        <aside className="fixed left-0 top-0 h-screen w-20 bg-white border-r border-slate-100 flex flex-col items-center py-6 shadow-sm z-10">
            <div className="text-blue-600 mb-10 flex flex-col items-center font-bold text-sm">
                <HeartPulse size={28} strokeWidth={2.5} className="mb-1" />
                <span className="tracking-tight text-slate-800">Med+</span>
            </div>

            <nav className="flex-1 w-full space-y-4 flex flex-col items-center">
                {navItems.map((item) => {
                    // Check if active: exact match for /cases, or prefix match for /cases/
                    const isActive = pathname === item.href || (pathname.startsWith('/cases') && item.href === '/cases' && pathname !== '/cases/new') || (pathname.startsWith('/patient') && item.href === '/cases');

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${isActive
                                ? 'bg-blue-50 text-blue-600 shadow-sm'
                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                }`}
                            title={item.label}
                        >
                            <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto pt-4 border-t border-slate-100 w-full flex justify-center">
                <button className="w-12 h-12 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all">
                    <Settings size={22} strokeWidth={2} />
                </button>
            </div>
        </aside>
    );
}

"use client";

import TopNavbar from './TopNavbar';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { loading } = useAuth();

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-slate-50">
                <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <TopNavbar />
            <main className="flex-1 max-w-screen-2xl mx-auto w-full px-6 py-8 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}

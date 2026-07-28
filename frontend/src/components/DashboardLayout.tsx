"use client";

import TopNavbar from './TopNavbar';
import SidePanel from './SidePanel';
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

            <TopNavbar />
            <SidePanel />
            <main className="flex-1 w-full max-w-[1550px] mx-auto px-6 py-8 overflow-y-auto lg:ml-64 relative z-10">
                {children}
            </main>
        </div>
    );
}

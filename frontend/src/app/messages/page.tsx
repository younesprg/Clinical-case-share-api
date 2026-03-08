"use client";

import DashboardLayout from '@/components/DashboardLayout';
import { MessageSquare } from 'lucide-react';

export default function MessagesPage() {
    return (
        <DashboardLayout>
            <div className="flex flex-col items-center justify-center h-full text-slate-400 py-20">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-300">
                    <MessageSquare size={40} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Messages</h2>
                <p className="max-w-md text-center">This module is under construction. Future updates will allow direct communication with patients and other medical staff.</p>
            </div>
        </DashboardLayout>
    );
}

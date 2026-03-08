"use client";

import DashboardLayout from '@/components/DashboardLayout';
import { Calendar } from 'lucide-react';

export default function CalendarPage() {
    return (
        <DashboardLayout>
            <div className="flex flex-col items-center justify-center h-full text-slate-400 py-20">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-300">
                    <Calendar size={40} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Appointments Calendar</h2>
                <p className="max-w-md text-center">This module is under construction. Future updates will include a full scheduling view for patient appointments.</p>
            </div>
        </DashboardLayout>
    );
}

import { useAuth } from '@/contexts/AuthContext';
import { Search, Bell, MessageCircle, ChevronDown, LogOut } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
    const { user, logout } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);

    return (
        <header className="h-20 bg-transparent flex items-center justify-between px-8 z-10 relative">
            <div className="flex-1 max-w-xl">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search size={18} className="text-slate-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-11 pr-3 py-3 border-transparent rounded-2xl bg-white shadow-sm text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900"
                        placeholder="Search appointment, patient or etc..."
                    />
                    <button className="absolute inset-y-1.5 right-1.5 bg-blue-50 text-blue-600 px-4 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors">
                        Search
                    </button>
                </div>
            </div>

            <div className="flex items-center space-x-6 ml-8">
                <button className="text-slate-400 hover:text-slate-600 relative p-2 transition-colors">
                    <Bell size={20} strokeWidth={2} />
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-blue-500 border-2 border-slate-50 rounded-full"></span>
                </button>
                <button className="text-slate-400 hover:text-slate-600 p-2 transition-colors">
                    <MessageCircle size={20} strokeWidth={2} />
                </button>

                <div className="h-8 w-px bg-slate-200"></div>

                <div className="relative">
                    <button
                        className="flex items-center space-x-3 hover:bg-white p-1.5 rounded-xl transition-colors"
                        onClick={() => setShowDropdown(!showDropdown)}
                    >
                        <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
                            <img
                                src={`https://ui-avatars.com/api/?name=${user?.name || 'Doctor'}&background=c7d2fe&color=3730a3`}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex items-center text-sm font-medium text-slate-700">
                            <span className="mr-1">{user?.title || 'Dr.'} {user?.name || 'Isaac Wick'}</span>
                            <ChevronDown size={14} className="text-slate-400" />
                        </div>
                    </button>

                    {showDropdown && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg shadow-slate-200/50 py-1 border border-slate-100 z-50">
                            <div className="px-4 py-2 border-b border-slate-50">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Account</p>
                                <p className="text-sm font-medium text-slate-900 truncate mt-1">{user?.email}</p>
                            </div>
                            <button
                                onClick={logout}
                                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors"
                            >
                                <LogOut size={16} className="mr-2" />
                                Sign out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

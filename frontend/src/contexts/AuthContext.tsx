"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/lib/api';

interface User {
    id: number;
    email: string;
    name: string;
    role: string;
    title: string;
    specialty: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (token: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await api.get('/users/me');
                    setUser(res.data);

                    // Redirect to /cases only if on the login screen while already logged in
                    if (pathname === '/login') {
                        router.push('/cases');
                    }
                } catch (err) {
                    localStorage.removeItem('token');
                    setUser(null);
                    if (pathname !== '/login' && pathname !== '/register') {
                        router.push('/login');
                    }
                }
            } else {
                if (pathname !== '/login' && pathname !== '/register') {
                    router.push('/login');
                }
            }
            setLoading(false);
        };

        initAuth();
    }, [pathname, router]);

    const login = async (token: string) => {
        localStorage.setItem('token', token);
        const res = await api.get('/users/me');
        setUser(res.data);
        router.push('/cases');
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

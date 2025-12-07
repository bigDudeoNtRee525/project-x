'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth';
import { LogOut, Menu, Calendar, ListTodo, Users, Upload } from 'lucide-react';

export default function MeetingsLayout({ children }: { children: ReactNode }) {
    const router = useRouter();
    const { user, isLoading, signOut, checkAuth } = useAuthStore();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const handleSignOut = async () => {
        await signOut();
        router.push('/login');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <Link href="/dashboard" className="flex items-center space-x-2">
                                <Calendar className="h-6 w-6 text-blue-600" />
                                <span className="text-xl font-bold text-gray-900">Meeting Task Tool</span>
                            </Link>
                            <nav className="hidden md:flex ml-10 space-x-8">
                                <Link href="/dashboard" className="text-gray-700 hover:text-gray-900 font-medium flex items-center space-x-1">
                                    <ListTodo className="h-4 w-4" />
                                    <span>Tasks</span>
                                </Link>
                                <Link href="/meetings" className="text-gray-700 hover:text-gray-900 font-medium flex items-center space-x-1">
                                    <Upload className="h-4 w-4" />
                                    <span>Meetings</span>
                                </Link>
                                <Link href="/contacts" className="text-gray-700 hover:text-gray-900 font-medium flex items-center space-x-1">
                                    <Users className="h-4 w-4" />
                                    <span>Contacts</span>
                                </Link>
                            </nav>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="text-sm text-gray-700">
                                <span className="font-medium">{user?.name || user?.email || 'Demo User'}</span>
                            </div>
                            <Button variant="outline" size="sm" onClick={handleSignOut} className="flex items-center space-x-1">
                                <LogOut className="h-4 w-4" />
                                <span>Sign Out</span>
                            </Button>
                            <button className="md:hidden p-2">
                                <Menu className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="py-6 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}

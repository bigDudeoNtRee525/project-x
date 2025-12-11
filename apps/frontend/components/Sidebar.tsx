'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Users2, Briefcase, CheckSquare, BarChart2, Settings, LogOut, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Meetings', href: '/meetings', icon: Briefcase },
    { name: 'Goals', href: '/goals', icon: Target },
    { name: 'Contacts', href: '/contacts', icon: Users },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare },
    { name: 'Team', href: '/team', icon: Users2 },
    { name: 'Analytics', href: '/analytics', icon: BarChart2 },
];

export function Sidebar() {
    const pathname = usePathname();
    const { user, signOut } = useAuthStore();

    return (
        <div className="flex h-full w-[280px] flex-col bg-sidebar border-r border-sidebar-border">
            {/* Logo */}
            <div className="flex h-16 items-center px-6">
                <div className="flex items-center gap-2 font-bold text-xl text-sidebar-foreground">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                        O
                    </div>
                    Opus
                </div>
            </div>


            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-3 py-4">
                {navigation.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                                isActive
                                    ? 'bg-sidebar-accent text-primary shadow-sm'
                                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-white'
                            )}
                        >
                            <item.icon
                                className={cn(
                                    'mr-3 h-5 w-5 flex-shrink-0 transition-colors',
                                    isActive ? 'text-primary' : 'text-sidebar-foreground group-hover:text-white'
                                )}
                            />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Section */}
            <div className="border-t border-sidebar-border p-4">
                <Link
                    href="/settings"
                    className="group flex items-center px-4 py-3 text-sm font-medium text-sidebar-foreground hover:text-white rounded-md transition-colors"
                >
                    <Settings className="mr-3 h-5 w-5 text-sidebar-foreground group-hover:text-white" />
                    Settings
                </Link>

                <div className="mt-4 flex items-center gap-3 px-4">
                    <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-medium text-sidebar-foreground">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-sidebar-foreground truncate">
                            {user?.name || 'User'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                            {user?.email || 'user@example.com'}
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => signOut()}
                        className="h-8 w-8 text-sidebar-foreground hover:text-white"
                    >
                        <LogOut className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

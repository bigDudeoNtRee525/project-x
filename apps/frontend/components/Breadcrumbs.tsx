'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

// Route name mappings
const routeNames: Record<string, string> = {
  dashboard: 'Dashboard',
  meetings: 'Meetings',
  tasks: 'Tasks',
  contacts: 'Contacts',
  goals: 'Goals',
  team: 'Team',
  analytics: 'Analytics',
  settings: 'Settings',
  planning: 'Planning',
};

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const pathname = usePathname();

  // Auto-generate breadcrumbs from pathname if items not provided
  const breadcrumbs: BreadcrumbItem[] = items || (() => {
    const segments = pathname.split('/').filter(Boolean);
    const crumbs: BreadcrumbItem[] = [];

    let currentPath = '';
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      currentPath += `/${segment}`;

      // Skip auth routes and internal segments
      if (['auth', 'login', 'register'].includes(segment)) continue;

      // Check if it's a dynamic route (UUID or similar)
      const isDynamic = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);

      const label = isDynamic
        ? 'Details'
        : routeNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');

      // Only add href if not the last item
      crumbs.push({
        label,
        href: i < segments.length - 1 ? currentPath : undefined,
      });
    }

    return crumbs;
  })();

  if (breadcrumbs.length <= 1) return null;

  return (
    <nav className={cn('flex items-center text-sm text-muted-foreground', className)}>
      <Link
        href="/dashboard"
        className="hover:text-foreground transition-colors flex items-center"
      >
        <Home className="h-4 w-4" />
      </Link>

      {breadcrumbs.map((crumb, index) => (
        <div key={index} className="flex items-center">
          <ChevronRight className="h-4 w-4 mx-2" />
          {crumb.href ? (
            <Link
              href={crumb.href}
              className="hover:text-foreground transition-colors"
            >
              {crumb.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{crumb.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}

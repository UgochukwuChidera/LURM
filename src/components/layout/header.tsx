
"use client";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { School, UserCircle } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { usePathname } from 'next/navigation';

export function Header() {
  const { isAuthenticated, user } = useAuth();
  const pathname = usePathname();

  // Determine if the current page is the landing page
  const isLandingPage = pathname === '/';

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-4">
        {!isLandingPage && <SidebarTrigger className="md:hidden" />}
        <Link href={isAuthenticated ? "/resources" : "/"} className="flex items-center gap-2 text-lg font-semibold md:text-base">
          <School className="h-6 w-6 text-primary" />
          <span className="font-headline">Landmark University Resource Hub</span>
        </Link>
      </div>
      <div className="flex items-center gap-2">
        {/* Login/Register buttons removed, now on landing page */}
        {isAuthenticated && !isLandingPage && (
           <Button variant="ghost" size="icon" asChild>
            <Link href="/profile">
              <UserCircle className="h-6 w-6" />
              <span className="sr-only">Profile</span>
            </Link>
          </Button>
        )}
      </div>
    </header>
  );
}

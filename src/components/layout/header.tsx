
"use client";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { School, UserCircle } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

export function Header() {
  const { isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden" />
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold md:text-base">
          <School className="h-6 w-6 text-primary" />
          <span className="font-headline">Landmark University Resource Hub</span>
        </Link>
      </div>
      <div className="flex items-center gap-2">
        {!isAuthenticated && (
          <>
            <Button variant="outline" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Register</Link>
            </Button>
          </>
        )}
        {isAuthenticated && (
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

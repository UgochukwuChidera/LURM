
"use client";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { School, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/resources');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || (!isLoading && isAuthenticated)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <School className="h-16 w-16 text-primary mb-4 animate-pulse" />
        <p className="text-lg text-foreground">Loading or redirecting...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-secondary p-6 text-center">
      <header className="mb-12">
        <div className="flex items-center justify-center mb-6">
          <School className="h-20 w-20 text-primary drop-shadow-lg" />
        </div>
        <h1 className="font-headline text-5xl font-bold text-primary mb-3 tracking-tight">
          Landmark University Resource Hub
        </h1>
        <p className="text-xl text-foreground/80 max-w-2xl mx-auto">
          Discover, access, and manage academic resources with ease. Your central hub for learning and research materials.
        </p>
      </header>

      <main className="space-y-8">
        <section>
          <h2 className="font-headline text-3xl font-semibold text-foreground mb-4">Get Started</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild className="font-body shadow-lg hover:shadow-xl transition-shadow w-full sm:w-auto">
              <Link href="/login">
                <LogIn className="mr-2" /> Login
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="font-body shadow-lg hover:shadow-xl transition-shadow w-full sm:w-auto">
              <Link href="/register">
                <UserPlus className="mr-2" /> Register
              </Link>
            </Button>
          </div>
        </section>
        
        <section className="max-w-3xl mx-auto pt-8">
            <h3 className="font-headline text-2xl font-semibold text-foreground mb-3">Features</h3>
            <ul className="list-disc list-inside text-left text-foreground/70 space-y-1">
                <li>Advanced search and filtering for all university resources.</li>
                <li>Personalized user profiles and secure authentication.</li>
                <li>Access lecture notes, textbooks, research papers, and more.</li>
                <li>Mobile-friendly design for access on any device.</li>
            </ul>
        </section>
      </main>

      <footer className="mt-16 text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Landmark University. All rights reserved.
      </footer>
    </div>
  );
}

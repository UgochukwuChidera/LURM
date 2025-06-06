
"use client"; // Required for usePathname and useAuth

import type { Metadata } from 'next'; // Keep if you have static metadata here, otherwise remove
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AppShell } from '@/components/layout/app-shell';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { usePathname } from 'next/navigation';
import React from 'react';

// Static metadata can be defined outside if needed, or dynamically in page.tsx files
// export const metadata: Metadata = {
// title: 'Landmark University Resource Hub',
// description: 'Manage and discover resources at Landmark University.',
// };

function ConditionalAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();

  // On initial load, or if on landing page and not authenticated, don't show AppShell
  // The landing page handles its own layout for unauthenticated users.
  // Authenticated users are redirected from '/' to '/resources' by the landing page itself.
  if (pathname === '/' && !isAuthenticated && !isLoading) {
    return <>{children}</>;
  }
  
  // For all other cases (any page if authenticated, or non-landing pages even if auth is loading)
  // show the AppShell.
  // The isLoading check ensures AppShell doesn't flash incorrectly while auth state resolves.
  if (isLoading && pathname !== '/') {
     return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <p>Loading application structure...</p>
      </div>
    );
  }


  return <AppShell>{children}</AppShell>;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:ital,wght@0,200..0,900;1,200..1,900&display=swap" rel="stylesheet" />
        <title>Landmark University Resource Hub</title> {/* Basic title, can be overridden by pages */}
        <meta name="description" content="Manage and discover resources at Landmark University." />

      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <ConditionalAppShell>{children}</ConditionalAppShell>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}

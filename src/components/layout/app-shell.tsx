
"use client";
import type React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Header } from '@/components/layout/header';
import { SidebarNavItems } from '@/components/layout/sidebar-nav-items';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { LogOut } from 'lucide-react';
import Image from 'next/image';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar collapsible="icon" variant="sidebar" side="left" className="border-r">
        <SidebarHeader className="p-4">
          {isAuthenticated && user && (
             <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
                <Image 
                  src={user.avatarUrl || `https://placehold.co/40x40.png?text=${user.name?.charAt(0)?.toUpperCase() || 'U'}`} 
                  alt={user.name || 'User Avatar'}
                  width={40} 
                  height={40} 
                  className="object-cover shrink-0 group-data-[collapsible=icon]:size-8"
                  data-ai-hint="user avatar" 
                />
               <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                 <span className="font-semibold text-sm">{user.name}</span>
                 <span className="text-xs text-muted-foreground">{user.email}</span>
               </div>
             </div>
           )}
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarNavItems />
        </SidebarContent>
        <SidebarFooter className="p-2">
          {isAuthenticated && (
            <Button variant="ghost" className="w-full justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4 group-data-[collapsible=icon]:mr-0" />
              <span className="group-data-[collapsible=icon]:hidden">Logout</span>
            </Button>
          )}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

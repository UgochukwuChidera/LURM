
"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { LayoutGrid, UserCircle, MessageSquare, Search } from 'lucide-react'; // Changed Home to LayoutGrid, Search to Library
import { useAuth } from '@/contexts/auth-context';

const navItems = [
  { href: '/resources', label: 'Resources', icon: Search, authRequired: false }, 
  { href: '/profile', label: 'Profile', icon: UserCircle, authRequired: true },
  { href: '/chatbot', label: 'Chatbot Assistant', icon: MessageSquare, authRequired: false },
];

export function SidebarNavItems() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  const isActive = (href: string) => {
    // For root path, check exact match. For others, check startsWith.
    if (href === '/resources') return pathname === href || pathname.startsWith(href + '/'); // Handle /resources and /resources/anything
    if (href === '/') return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <SidebarMenu>
      {navItems.map((item) => {
        if (item.authRequired && !isAuthenticated) {
          return null;
        }
        return (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href} passHref legacyBehavior>
              <SidebarMenuButton
                isActive={isActive(item.href)}
                tooltip={{ children: item.label, className:"font-body"}}
                className="font-body"
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

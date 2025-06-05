
"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Home, UserCircle, MessageSquare, Search, FileText } from 'lucide-react'; // Added FileText
import { useAuth } from '@/contexts/auth-context';

const navItems = [
  { href: '/', label: 'Resources', icon: Search, authRequired: false }, // Changed from Home to Search icon for Resources
  { href: '/profile', label: 'Profile', icon: UserCircle, authRequired: true },
  { href: '/chatbot', label: 'Chatbot Assistant', icon: MessageSquare, authRequired: false },
];

export function SidebarNavItems() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  const isActive = (href: string) => {
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

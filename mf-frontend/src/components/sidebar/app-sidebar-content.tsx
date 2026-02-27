import { HandCoins, LayoutDashboard, LucideIcon } from 'lucide-react';

import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '../ui/sidebar';

interface NavItemType {
  title: string;
  url?: string;
  icon: LucideIcon;
}

const navItems: NavItemType[] = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Dívidas',
    url: '/ledgers',
    icon: HandCoins,
  },
];

function SideBarContentComponent() {
  return (
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel className="text-foreground/60">
          Financeiro
        </SidebarGroupLabel>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title}>
                <a href={item.url}>
                  <item.icon className="text-primary" />
                  <span className="text-foreground">{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  );
}

export default SideBarContentComponent;

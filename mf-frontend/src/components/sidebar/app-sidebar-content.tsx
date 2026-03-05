import {
  BarChart3,
  HandCoins,
  LayoutDashboard,
  LucideIcon,
  Settings,
  Users,
} from 'lucide-react';

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

const financialItems: NavItemType[] = [
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
  {
    title: 'Amigos',
    url: '/friends',
    icon: Users,
  },
  {
    title: 'Relatórios',
    url: '/reports',
    icon: BarChart3,
  },
];

const systemItems: NavItemType[] = [
  {
    title: 'Configurações',
    url: '/settings',
    icon: Settings,
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
          {financialItems.map((item) => (
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

      <SidebarGroup>
        <SidebarGroupLabel className="text-foreground/60">
          Sistema
        </SidebarGroupLabel>
        <SidebarMenu>
          {systemItems.map((item) => (
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

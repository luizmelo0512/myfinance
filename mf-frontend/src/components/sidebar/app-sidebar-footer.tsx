'use client';

import { LogOut, Settings, UserCircle2 } from 'lucide-react';
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '../ui/sidebar';
// import profilePic from "@/public/me-profile.jpg";
// import Image from "next/image";
import { useLogoutAction } from '@/src/actions/login/login-action';
import { useAuth } from '@/src/contexts/AuthContext';

function SideBarFooterComponent() {
  const { user } = useAuth();
  const { logoutAction } = useLogoutAction();
  return (
    <SidebarFooter className="p-4 border-t border-border/50">
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex items-center justify-between w-full gap-2">
            <div className="flex items-center">
              {/* <Image
                  className="rounded-full mr-3"
                  width={40}
                  height={40}
                  src={profilePic}
                  alt="Avatar"
                /> */}
              <UserCircle2 className="w-8 h-8 mr-3 text-foreground/80" />
              <div className="flex flex-col justify-center max-w-[120px]">
                <span className="font-semibold truncate text-foreground">
                  {user?.name}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <SidebarMenuButton className="h-8 w-8 p-0 flex items-center justify-center text-accent hover:bg-accent/50 transition-colors ">
                <Settings className="w-4 h-4 text-primary" />
              </SidebarMenuButton>

              <SidebarMenuButton className="h-8 w-8 p-0 flex items-center justify-center text-destructive hover:bg-destructive/30 transition-colors">
                <LogOut
                  className="w-4 h-4"
                  onClick={async () => {
                    await logoutAction();
                  }}
                />
              </SidebarMenuButton>
            </div>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
}

export default SideBarFooterComponent;

import { SITE_CONFIG } from '@lib/config';
import { LucideBadgeDollarSign } from 'lucide-react';
import { SidebarHeader } from '../ui/sidebar';

function SideBarHeaderComponent() {
  return (
    <SidebarHeader className="p-4">
      <div className="flex items-center gap-2 font-bold text-blue-500">
        <div className="flex p-2 items-center justify-center rounded-lg bg-primary/50">
          <LucideBadgeDollarSign className="h-8 w-8 text-foreground" />
        </div>
        <span className="text-xl tracking-tight text-foreground">
          {SITE_CONFIG.name}
        </span>
      </div>
    </SidebarHeader>
  );
}

export default SideBarHeaderComponent;

import { Sidebar } from '../ui/sidebar';
import SideBarContentComponent from './app-sidebar-content';
import SideBarFooterComponent from './app-sidebar-footer';
import SideBarHeaderComponent from './app-sidebar-header';

export function AppSidebar() {
  return (
    <Sidebar className="border-r border-primary/50">
      <SideBarHeaderComponent />
      <SideBarContentComponent />
      <SideBarFooterComponent />
    </Sidebar>
  );
}

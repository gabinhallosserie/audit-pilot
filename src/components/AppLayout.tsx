import React from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Shield, ClipboardCheck, LayoutDashboard, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationCenter from "@/components/NotificationCenter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";

const AppSidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  if (!user) return null;

  const isAuditeur = user.role === "auditeur";
  const isAdmin = user.role === "admin";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="gradient-navy flex flex-col justify-between">
        {/* Top: Logo + Nav */}
        <div>
          {/* Logo */}
          <div className="px-4 py-5">
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-teal flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              {!collapsed && (
                <span className="font-display text-xl font-bold text-primary-foreground tracking-tight">
                  AUDIT.IO
                </span>
              )}
            </Link>
          </div>

          {/* Navigation */}
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/dashboard"
                      end
                      className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-sidebar-accent px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
                      activeClassName="bg-sidebar-accent text-primary-foreground"
                    >
                      <LayoutDashboard className="w-4 h-4 shrink-0" />
                      {!collapsed && <span>Tableau de bord</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {isAuditeur && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to="/missions"
                        className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-sidebar-accent px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
                        activeClassName="bg-sidebar-accent text-primary-foreground"
                      >
                        <ClipboardCheck className="w-4 h-4 shrink-0" />
                        {!collapsed && <span>Missions</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {isAdmin && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to="/dashboard"
                        end
                        className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-sidebar-accent px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
                        activeClassName="bg-sidebar-accent text-primary-foreground"
                      >
                        <Settings className="w-4 h-4 shrink-0" />
                        {!collapsed && <span>Administration</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>

        {/* Bottom: User info + Logout */}
        <div className="px-3 pb-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-teal flex items-center justify-center text-sm font-bold text-primary-foreground shrink-0">
              {user.avatar}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary-foreground truncate">{user.name}</p>
                <p className="text-xs text-primary-foreground/60 capitalize">
                  {user.role === "audite" ? "Audité" : user.role === "auditeur" ? "Auditeur" : "Admin"}
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <NotificationCenter />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-sidebar-accent"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
};

const AppLayout: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center border-b px-4">
            <SidebarTrigger className="mr-2" />
          </header>
          <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
            <Outlet />
          </main>
          <footer className="border-t px-6 py-3 text-center text-xs text-muted-foreground">
            AUDIT.IO © 2026 — Plateforme SaaS de gestion d'audits
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;

import React from "react";
import { Outlet, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Shield, ClipboardCheck, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!user) return null;

  const isAuditeur = user.role === "auditeur";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="gradient-navy px-6 py-3 flex items-center justify-between shadow-lg">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold text-primary-foreground tracking-tight">
            AUDIT.IO
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Link
            to="/dashboard"
            className="px-3 py-2 rounded-md text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground hover:bg-navy-light transition-colors flex items-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4" />
            Tableau de bord
          </Link>
          {isAuditeur && (
            <Link
              to="/missions"
              className="px-3 py-2 rounded-md text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground hover:bg-navy-light transition-colors flex items-center gap-2"
            >
              <ClipboardCheck className="w-4 h-4" />
              Missions
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-medium text-primary-foreground">{user.name}</span>
            <span className="text-xs text-primary-foreground/60 capitalize">
              {user.role === "audite" ? "Audité" : "Auditeur"}
            </span>
          </div>
          <div className="w-9 h-9 rounded-full bg-teal flex items-center justify-center text-sm font-bold text-primary-foreground">
            {user.avatar}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-navy-light"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t px-6 py-3 text-center text-xs text-muted-foreground">
        AUDIT.IO © 2026 — Plateforme SaaS de gestion d'audits · Phase 1 POC
      </footer>
    </div>
  );
};

export default AppLayout;

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/supabaseService";
import { Bell, CheckCheck, ClipboardList, PlayCircle, FileDown, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Notification {
  id: string;
  target_role: string;
  mission_id: string | null;
  type: string;
  title: string;
  description: string | null;
  read: boolean;
  created_at: string;
}

const NOTIF_ICONS: Record<string, React.ReactNode> = {
  plan_valide: <CheckCircle2 className="w-4 h-4 text-teal" />,
  audit_demarre: <PlayCircle className="w-4 h-4 text-navy" />,
  nouveau_constat: <ClipboardList className="w-4 h-4 text-teal" />,
  rapport_pdf: <FileDown className="w-4 h-4 text-navy" />,
  action_en_retard: <AlertTriangle className="w-4 h-4 text-destructive" />,
};

const NotificationCenter: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const loadNotifs = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchNotifications(user.role);
      setNotifications(data as Notification[]);
    } catch {
      // silently fail
    }
  }, [user]);

  useEffect(() => {
    loadNotifs();
    const interval = setInterval(loadNotifs, 10000);
    return () => clearInterval(interval);
  }, [loadNotifs]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await markAllNotificationsRead(user.role);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "À l'instant";
    if (mins < 60) return `Il y a ${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${Math.floor(hours / 24)}j`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-primary-foreground/70 hover:text-primary-foreground hover:bg-navy-light"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground gap-1 h-7"
              onClick={handleMarkAllRead}
            >
              <CheckCheck className="w-3 h-3" />
              Tout marquer lu
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[360px]">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">Aucune notification</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer ${!n.read ? "bg-teal/5" : ""}`}
                  onClick={() => !n.read && handleMarkRead(n.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {NOTIF_ICONS[n.type] || <Bell className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm ${!n.read ? "font-semibold" : ""}`}>{n.title}</p>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-teal shrink-0" />}
                      </div>
                      {n.description && <p className="text-xs text-muted-foreground mt-0.5">{n.description}</p>}
                      <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;

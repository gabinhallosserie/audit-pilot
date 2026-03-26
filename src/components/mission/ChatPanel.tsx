import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { fetchMessages, insertMessage } from "@/lib/supabaseService";

interface Message {
  id: string;
  mission_id: string;
  sender_name: string;
  sender_role: string;
  content: string;
  created_at: string;
}

interface ChatPanelProps {
  missionId: string;
  open: boolean;
  onClose: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ missionId, open, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    fetchMessages(missionId)
      .then((data) => setMessages(data as Message[]))
      .catch(() => toast.error("Erreur de chargement des messages"))
      .finally(() => setLoading(false));
  }, [missionId, open]);

  useEffect(() => {
    if (!open) return;
    const channel = supabase
      .channel(`chat-panel-${missionId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mission_messages", filter: `mission_id=eq.${missionId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [missionId, open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user) return;
    setSending(true);
    try {
      await insertMessage({
        mission_id: missionId,
        sender_name: user.name,
        sender_role: user.role,
        content: newMessage.trim(),
      });
      setNewMessage("");
    } catch {
      toast.error("Erreur d'envoi");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  const grouped: { date: string; msgs: Message[] }[] = [];
  messages.forEach((msg) => {
    const dateKey = msg.created_at.slice(0, 10);
    const last = grouped[grouped.length - 1];
    if (last && last.date === dateKey) {
      last.msgs.push(msg);
    } else {
      grouped.push({ date: dateKey, msgs: [msg] });
    }
  });

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-screen w-full max-w-md bg-card border-l shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="gradient-navy px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-primary-foreground" />
            <span className="font-display text-sm font-semibold text-primary-foreground">Messagerie</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-sidebar-accent h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {loading && <p className="text-center text-muted-foreground text-sm py-8">Chargement...</p>}
            {!loading && messages.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Aucun message</p>
                <p className="text-xs mt-1">Démarrez la conversation</p>
              </div>
            )}
            {grouped.map((group) => (
              <div key={group.date}>
                <div className="flex items-center gap-2 my-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground px-2">{formatDate(group.msgs[0].created_at)}</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                {group.msgs.map((msg) => {
                  const isMe = msg.sender_role === user?.role;
                  return (
                    <div key={msg.id} className={`flex mb-2 ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-lg px-3 py-2 ${isMe ? "bg-navy text-primary-foreground" : "bg-muted"}`}>
                        <div className="flex items-baseline gap-2 mb-0.5">
                          <span className={`text-xs font-semibold ${isMe ? "text-teal" : "text-navy"}`}>{msg.sender_name}</span>
                          <span className={`text-[10px] ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{formatTime(msg.created_at)}</span>
                        </div>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t px-4 py-3 flex gap-2 shrink-0">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Tapez votre message..."
            className="text-sm"
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            disabled={sending}
          />
          <Button
            size="icon"
            className="bg-teal hover:bg-teal/90 text-primary-foreground shrink-0"
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </>
  );
};

export default ChatPanel;

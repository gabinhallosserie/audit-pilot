import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMissions, fetchAudits, fetchAuditRequests } from "@/lib/supabaseService";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, FileText, ArrowRight, Briefcase, CalendarDays, Inbox, Mail, Check, X } from "lucide-react";
import { toast } from "sonner";

interface AuditRequest {
  id: string;
  audit_type: string;
  referentiel: string;
  perimetre: string;
  desired_date: string;
  estimated_duration: string;
  budget: string;
  status: string;
  requester_name: string;
  company: string;
  created_at: string;
}

interface Invitation {
  id: string;
  requester_name: string;
  requester_company: string;
  referentiel: string;
  status: string;
  created_at: string;
}

const missionStatusConfig: Record<string, { label: string; class: string }> = {
  préparation: { label: "Préparation", class: "bg-muted text-muted-foreground" },
  en_cours: { label: "En cours", class: "bg-teal text-primary-foreground" },
  clôture: { label: "Clôture", class: "bg-navy text-primary-foreground" },
};

const DashboardAuditeur: React.FC = () => {
  const navigate = useNavigate();
  const [missions, setMissions] = useState<any[]>([]);
  const [auditsCount, setAuditsCount] = useState(0);
  const [requests, setRequests] = useState<AuditRequest[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInvitations = async () => {
    const { data } = await supabase
      .from("audit_invitations")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setInvitations(data as Invitation[]);
  };

  useEffect(() => {
    Promise.all([fetchMissions(), fetchAudits(), fetchAuditRequests(), loadInvitations()])
      .then(([m, a, r]) => {
        setMissions(m);
        setAuditsCount(a.length);
        setRequests(r as AuditRequest[]);
      })
      .catch(() => toast.error("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, []);

  const handleInvitation = async (id: string, action: "acceptée" | "déclinée") => {
    const { error } = await supabase
      .from("audit_invitations")
      .update({ status: action } as any)
      .eq("id", id);
    if (error) { toast.error("Erreur"); return; }
    setInvitations((prev) => prev.map((inv) => inv.id === id ? { ...inv, status: action } : inv));
    toast.success(action === "acceptée" ? "Invitation acceptée" : "Invitation déclinée");
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">Chargement...</div>;

  const pendingInvitations = invitations.filter((i) => i.status === "en_attente");

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Tableau de bord — Auditeur</h1>
        <p className="text-muted-foreground text-sm mt-1">Vos missions et demandes d'audit</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Missions actives", value: missions.filter((m) => m.status === "en_cours").length, icon: <ClipboardCheck className="w-5 h-5" /> },
          { label: "En préparation", value: missions.filter((m) => m.status === "préparation").length, icon: <FileText className="w-5 h-5" /> },
          { label: "Audits totaux", value: auditsCount, icon: <Briefcase className="w-5 h-5" /> },
          { label: "Invitations", value: pendingInvitations.length, icon: <Mail className="w-5 h-5" /> },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-teal">{s.icon}</span>
                <span className="font-display text-2xl font-bold">{s.value}</span>
              </div>
              <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Invitations reçues */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Mail className="w-5 h-5 text-warning" />
              Invitations d'audit reçues
              {pendingInvitations.length > 0 && (
                <Badge className="bg-warning text-warning-foreground text-xs">{pendingInvitations.length} en attente</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {invitations.map((inv) => {
                const statusColor = inv.status === "en_attente"
                  ? "bg-warning text-warning-foreground"
                  : inv.status === "acceptée"
                    ? "bg-success text-success-foreground"
                    : "bg-destructive text-destructive-foreground";
                return (
                  <div key={inv.id} className="px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-semibold text-sm">{inv.requester_company}</span>
                        <Badge variant="outline" className="text-xs">{inv.referentiel}</Badge>
                        <Badge className={`text-xs ${statusColor}`}>
                          {inv.status === "en_attente" ? "En attente" : inv.status === "acceptée" ? "Acceptée" : "Déclinée"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        De {inv.requester_name} · {new Date(inv.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    {inv.status === "en_attente" && (
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground gap-1"
                          onClick={() => handleInvitation(inv.id, "acceptée")}>
                          <Check className="w-3.5 h-3.5" />
                          Accepter
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive gap-1"
                          onClick={() => handleInvitation(inv.id, "déclinée")}>
                          <X className="w-3.5 h-3.5" />
                          Décliner
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Missions */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Mes missions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {missions.map((mission) => {
              const sc = missionStatusConfig[mission.status] || missionStatusConfig.préparation;
              return (
                <div key={mission.id} className="px-6 py-4 hover:bg-muted/50 transition-colors flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-muted-foreground">{mission.id}</span>
                      <Badge className={`${sc.class} text-xs`}>{sc.label}</Badge>
                    </div>
                    <h3 className="font-semibold text-sm">{mission.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{mission.company}</span>
                      <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{new Date(mission.date).toLocaleDateString("fr-FR")}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-teal hover:bg-teal/90 text-primary-foreground gap-1"
                    onClick={() => navigate(`/mission/${mission.id}`)}
                  >
                    Ouvrir
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Demandes d'audit reçues */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Inbox className="w-5 h-5 text-navy" />
            Demandes d'audit reçues
            {requests.length > 0 && <Badge className="bg-teal text-primary-foreground text-xs">{requests.length}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Aucune nouvelle demande pour le moment</p>
              <p className="text-xs mt-1">Les demandes des audités apparaîtront ici</p>
            </div>
          ) : (
            <div className="divide-y">
              {requests.map((req) => (
                <div key={req.id} className="px-6 py-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge className="bg-navy text-primary-foreground text-xs">{req.audit_type}</Badge>
                        <Badge variant="outline" className="text-xs">{req.referentiel}</Badge>
                        <Badge variant="outline" className="text-xs bg-muted">{req.status === "en_attente" ? "En attente" : req.status}</Badge>
                      </div>
                      <p className="text-sm font-medium">{req.company} — {req.requester_name}</p>
                      {req.perimetre && <p className="text-xs text-muted-foreground mt-0.5">{req.perimetre}</p>}
                      <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                        <span>Date souhaitée : {new Date(req.desired_date).toLocaleDateString("fr-FR")}</span>
                        <span>Durée : {req.estimated_duration}</span>
                        {req.budget && <span>Budget : {req.budget}</span>}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground shrink-0">
                      {new Date(req.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardAuditeur;

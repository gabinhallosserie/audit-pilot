import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMissions, fetchAudits, fetchAuditRequests } from "@/lib/supabaseService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, FileText, ArrowRight, Briefcase, CalendarDays, Inbox } from "lucide-react";
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchMissions(), fetchAudits(), fetchAuditRequests()])
      .then(([m, a, r]) => {
        setMissions(m);
        setAuditsCount(a.length);
        setRequests(r as AuditRequest[]);
      })
      .catch(() => toast.error("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12 text-muted-foreground">Chargement...</div>;

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
          { label: "Demandes reçues", value: requests.length, icon: <Inbox className="w-5 h-5" /> },
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

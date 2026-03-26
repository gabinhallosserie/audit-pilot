import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAudits, fetchMissionByAuditId } from "@/lib/supabaseService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Clock, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface Audit {
  id: string;
  title: string;
  referentiel: string;
  status: string;
  date: string;
  auditeur: string;
  audite: string;
  company: string;
  perimetre: string;
}

const statusConfig: Record<string, { label: string; class: string; icon: React.ReactNode }> = {
  planifié: { label: "Planifié", class: "bg-muted text-muted-foreground", icon: <Clock className="w-3.5 h-3.5" /> },
  en_cours: { label: "En cours", class: "bg-teal text-primary-foreground", icon: <ClipboardList className="w-3.5 h-3.5" /> },
  terminé: { label: "Terminé", class: "bg-success text-success-foreground", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  clôturé: { label: "Clôturé", class: "bg-navy text-primary-foreground", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
};

const DashboardAudite: React.FC = () => {
  const navigate = useNavigate();
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAudits()
      .then((data) => setAudits(data as Audit[]))
      .catch(() => toast.error("Erreur de chargement des audits"))
      .finally(() => setLoading(false));
  }, []);

  const handleAuditClick = async (audit: Audit) => {
    const mission = await fetchMissionByAuditId(audit.id);
    if (mission) {
      navigate(`/mission/${mission.id}`);
    } else {
      toast.info("Aucune mission associée à cet audit");
    }
  };

  const stats = {
    total: audits.length,
    enCours: audits.filter((a) => a.status === "en_cours").length,
    planifies: audits.filter((a) => a.status === "planifié").length,
    termines: audits.filter((a) => ["terminé", "clôturé"].includes(a.status)).length,
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">Chargement...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Tableau de bord — Audité</h1>
        <p className="text-muted-foreground text-sm mt-1">Vue d'ensemble de vos audits</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total audits", value: stats.total, icon: <ClipboardList className="w-5 h-5" />, color: "text-navy" },
          { label: "En cours", value: stats.enCours, icon: <AlertTriangle className="w-5 h-5" />, color: "text-teal" },
          { label: "Planifiés", value: stats.planifies, icon: <Clock className="w-5 h-5" />, color: "text-muted-foreground" },
          { label: "Terminés", value: stats.termines, icon: <CheckCircle2 className="w-5 h-5" />, color: "text-success" },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className={kpi.color}>{kpi.icon}</span>
                <span className="font-display text-2xl font-bold">{kpi.value}</span>
              </div>
              <p className="text-xs text-muted-foreground font-medium">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Audit list */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Mes audits</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {audits.map((audit) => {
              const sc = statusConfig[audit.status] || statusConfig.planifié;
              return (
                <div
                  key={audit.id}
                  className="px-6 py-4 hover:bg-muted/50 transition-colors cursor-pointer group"
                  onClick={() => handleAuditClick(audit)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-muted-foreground">{audit.id}</span>
                        <Badge className={`${sc.class} gap-1 text-xs`}>
                          {sc.icon}
                          {sc.label}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-sm">{audit.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{audit.perimetre}</p>
                    </div>
                    <div className="text-right shrink-0 flex items-center gap-3">
                      <div>
                        <p className="text-xs font-medium">{audit.referentiel}</p>
                        <p className="text-xs text-muted-foreground">{new Date(audit.date).toLocaleDateString("fr-FR")}</p>
                        <p className="text-xs text-muted-foreground">Auditeur : {audit.auditeur}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardAudite;

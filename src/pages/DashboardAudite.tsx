import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAudits, fetchMissionByAuditId, insertAuditRequest } from "@/lib/supabaseService";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ClipboardList, Clock, CheckCircle2, AlertTriangle, ArrowRight, Plus } from "lucide-react";
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

const AUDIT_TYPES = ["Interne", "Externe", "Certification", "Surveillance"];
const REFERENTIELS = ["ISO 9001:2015", "ISO 14001:2015", "ISO 50001:2018", "ISO 45001:2018", "CSRD / ESRS"];

const DashboardAudite: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [auditType, setAuditType] = useState("");
  const [referentiel, setReferentiel] = useState("");
  const [perimetre, setPerimetre] = useState("");
  const [desiredDate, setDesiredDate] = useState("");
  const [duration, setDuration] = useState("");
  const [budget, setBudget] = useState("");

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

  const handleSubmitRequest = async () => {
    if (!auditType || !referentiel || !desiredDate || !duration) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    try {
      await insertAuditRequest({
        audit_type: auditType,
        referentiel,
        perimetre,
        desired_date: desiredDate,
        estimated_duration: duration,
        budget,
        requester_email: user?.email || "",
        requester_name: user?.name || "",
        company: user?.company || "",
      });
      setAuditType("");
      setReferentiel("");
      setPerimetre("");
      setDesiredDate("");
      setDuration("");
      setBudget("");
      setDialogOpen(false);
      toast.success("Demande d'audit soumise avec succès");
    } catch {
      toast.error("Erreur lors de la soumission");
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Tableau de bord — Audité</h1>
          <p className="text-muted-foreground text-sm mt-1">Vue d'ensemble de vos audits</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-teal hover:bg-teal/90 text-primary-foreground gap-1">
              <Plus className="w-4 h-4" />
              Nouvelle demande d'audit
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display">Nouvelle demande d'audit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Type d'audit *</Label>
                <Select value={auditType} onValueChange={setAuditType}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {AUDIT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Référentiel visé *</Label>
                <Select value={referentiel} onValueChange={setReferentiel}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {REFERENTIELS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Périmètre</Label>
                <Textarea rows={2} placeholder="Décrivez le périmètre de l'audit..." value={perimetre} onChange={(e) => setPerimetre(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Date souhaitée *</Label>
                  <Input type="date" value={desiredDate} onChange={(e) => setDesiredDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Durée estimée *</Label>
                  <Input placeholder="Ex: 2 jours" value={duration} onChange={(e) => setDuration(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Budget indicatif (optionnel)</Label>
                <Input placeholder="Ex: 5 000 €" value={budget} onChange={(e) => setBudget(e.target.value)} />
              </div>
              <Button onClick={handleSubmitRequest} className="w-full bg-navy hover:bg-navy/90 text-primary-foreground">
                Soumettre la demande
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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

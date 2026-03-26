import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAudits, fetchMissionByAuditId, insertAuditRequest } from "@/lib/supabaseService";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ClipboardList, Clock, CheckCircle2, AlertTriangle, ArrowRight, Plus, Send, Star, MapPin, Globe, Award } from "lucide-react";
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

interface SuggestedAuditor {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  referentiels_maitrises: string[] | null;
  zone_geographique: string | null;
  langues: string[] | null;
  tarification: string | null;
  domaines_expertise: string[] | null;
  avgScore: number;
}

const statusConfig: Record<string, { label: string; class: string; icon: React.ReactNode }> = {
  planifié: { label: "Planifié", class: "bg-muted text-muted-foreground", icon: <Clock className="w-3.5 h-3.5" /> },
  en_cours: { label: "En cours", class: "bg-teal text-primary-foreground", icon: <ClipboardList className="w-3.5 h-3.5" /> },
  terminé: { label: "Terminé", class: "bg-success text-success-foreground", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  clôturé: { label: "Clôturé", class: "bg-navy text-primary-foreground", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
};

const AUDIT_TYPES = ["Interne", "Externe", "Certification", "Surveillance"];
const REFERENTIELS = ["ISO 9001:2015", "ISO 14001:2015", "ISO 50001:2018", "ISO 45001:2018", "CSRD / ESRS"];

// Map full referentiel names to short forms for matching
const REF_SHORT: Record<string, string[]> = {
  "ISO 9001:2015": ["ISO 9001"],
  "ISO 14001:2015": ["ISO 14001"],
  "ISO 50001:2018": ["ISO 50001"],
  "ISO 45001:2018": ["ISO 45001"],
  "CSRD / ESRS": ["CSRD"],
};

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

  // Suggested auditors step
  const [step, setStep] = useState<"form" | "suggestions">("form");
  const [suggestedAuditors, setSuggestedAuditors] = useState<SuggestedAuditor[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [lastRequestId, setLastRequestId] = useState<string | null>(null);
  const [sentInvitations, setSentInvitations] = useState<Set<string>>(new Set());

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

  const fetchSuggestedAuditors = async (ref: string) => {
    setLoadingSuggestions(true);
    const shortRefs = REF_SHORT[ref] || [ref];

    const { data } = await supabase
      .from("registration_accounts")
      .select("*")
      .eq("account_type", "auditeur")
      .eq("status", "actif");

    if (!data) { setLoadingSuggestions(false); return; }

    // Filter by referentiel match
    const matched = (data as any[]).filter((a) => {
      const refs = a.referentiels_maitrises as string[] | null;
      if (!refs) return false;
      return shortRefs.some((sr) => refs.some((r: string) => r.toLowerCase().includes(sr.toLowerCase())));
    });

    // TODO: could also filter by zone/language, but show all matches for now
    const withScores: SuggestedAuditor[] = matched.map((a) => ({
      id: a.id,
      nom: a.nom || "",
      prenom: a.prenom || "",
      email: a.email,
      referentiels_maitrises: a.referentiels_maitrises,
      zone_geographique: a.zone_geographique,
      langues: a.langues,
      tarification: a.tarification,
      domaines_expertise: a.domaines_expertise,
      avgScore: 0, // Will be computed if ratings exist
    }));

    setSuggestedAuditors(withScores);
    setLoadingSuggestions(false);
  };

  const handleSubmitRequest = async () => {
    if (!auditType || !referentiel || !desiredDate || !duration) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    try {
      // Insert and get the ID back
      const { data, error } = await supabase.from("audit_requests").insert({
        audit_type: auditType,
        referentiel,
        perimetre,
        desired_date: desiredDate,
        estimated_duration: duration,
        budget,
        requester_email: user?.email || "",
        requester_name: user?.name || "",
        company: user?.company || "",
      }).select("id").single();

      if (error) throw error;

      setLastRequestId(data.id);
      setSentInvitations(new Set());
      await fetchSuggestedAuditors(referentiel);
      setStep("suggestions");
      toast.success("Demande d'audit soumise avec succès");
    } catch {
      toast.error("Erreur lors de la soumission");
    }
  };

  const sendInvitation = async (auditor: SuggestedAuditor) => {
    if (!lastRequestId) return;
    const { error } = await supabase.from("audit_invitations").insert({
      audit_request_id: lastRequestId,
      auditor_account_id: auditor.id,
      auditor_email: auditor.email,
      auditor_name: `${auditor.prenom} ${auditor.nom}`,
      requester_name: user?.name || "",
      requester_company: user?.company || "",
      referentiel,
    } as any);

    if (error) {
      toast.error("Erreur lors de l'envoi de l'invitation");
      return;
    }
    setSentInvitations((prev) => new Set(prev).add(auditor.id));
    toast.success(`Invitation envoyée à ${auditor.prenom} ${auditor.nom}`);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setStep("form");
    setAuditType("");
    setReferentiel("");
    setPerimetre("");
    setDesiredDate("");
    setDuration("");
    setBudget("");
    setSuggestedAuditors([]);
    setLastRequestId(null);
    setSentInvitations(new Set());
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
        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setDialogOpen(true); }}>
          <DialogTrigger asChild>
            <Button className="bg-teal hover:bg-teal/90 text-primary-foreground gap-1">
              <Plus className="w-4 h-4" />
              Nouvelle demande d'audit
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">
                {step === "form" ? "Nouvelle demande d'audit" : "Auditeurs suggérés"}
              </DialogTitle>
            </DialogHeader>

            {step === "form" ? (
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
            ) : (
              <div className="space-y-4 mt-2">
                <p className="text-sm text-muted-foreground">
                  Voici les auditeurs correspondant au référentiel <span className="font-semibold text-foreground">{referentiel}</span>.
                  Envoyez une invitation aux auditeurs de votre choix.
                </p>

                {loadingSuggestions ? (
                  <div className="text-center py-8 text-muted-foreground">Recherche d'auditeurs...</div>
                ) : suggestedAuditors.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">Aucun auditeur trouvé pour ce référentiel</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {suggestedAuditors.map((auditor) => (
                      <Card key={auditor.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm">{auditor.prenom} {auditor.nom}</h4>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                                {auditor.referentiels_maitrises && (
                                  <span className="flex items-center gap-1">
                                    <Award className="w-3 h-3" />
                                    {auditor.referentiels_maitrises.join(", ")}
                                  </span>
                                )}
                                {auditor.zone_geographique && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {auditor.zone_geographique}
                                  </span>
                                )}
                                {auditor.langues && (
                                  <span className="flex items-center gap-1">
                                    <Globe className="w-3 h-3" />
                                    {auditor.langues.join(", ")}
                                  </span>
                                )}
                              </div>
                              {auditor.domaines_expertise && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {auditor.domaines_expertise.map((d) => (
                                    <Badge key={d} variant="outline" className="text-xs">{d}</Badge>
                                  ))}
                                </div>
                              )}
                              {auditor.tarification && (
                                <p className="text-xs text-muted-foreground mt-1">Tarif : {auditor.tarification}</p>
                              )}
                            </div>
                            <div className="shrink-0">
                              {sentInvitations.has(auditor.id) ? (
                                <Badge className="bg-success text-success-foreground text-xs">Invitation envoyée</Badge>
                              ) : (
                                <Button size="sm" className="bg-teal hover:bg-teal/90 text-primary-foreground gap-1"
                                  onClick={() => sendInvitation(auditor)}>
                                  <Send className="w-3.5 h-3.5" />
                                  Inviter
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                <Button variant="outline" onClick={closeDialog} className="w-full">
                  Fermer
                </Button>
              </div>
            )}
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

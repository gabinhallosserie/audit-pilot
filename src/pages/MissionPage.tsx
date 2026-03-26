import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { FINDING_LABELS, FINDING_COLORS, type FindingType } from "@/data/mockData";
import { fetchMission, fetchFindings, fetchChecklist, insertFinding, deleteFinding, updateChecklistItem, updateMissionStatus, createNotification, fetchSignatures } from "@/lib/supabaseService";
import { supabase } from "@/integrations/supabase/client";
import FindingAttachments from "@/components/mission/FindingAttachments";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, FileDown, CheckSquare, ClipboardList, Trash2, FileSearch, DoorOpen, ShieldCheck, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { generateReport } from "@/lib/generateReport";
import AvantAuditTab from "@/components/mission/AvantAuditTab";
import OuvertureTab from "@/components/mission/OuvertureTab";
import PostAuditTab from "@/components/mission/PostAuditTab";
import ChatPanel from "@/components/mission/ChatPanel";

interface MissionData {
  id: string;
  audit_id: string;
  title: string;
  referentiel: string;
  status: string;
  date: string;
  company: string;
  contact: string;
  plan_validated: boolean;
  notes: string;
}

interface FindingData {
  id: string;
  mission_id: string;
  type: string;
  clause: string | null;
  description: string;
  evidence: string | null;
  created_at: string;
}

interface ChecklistData {
  id: string;
  mission_id: string;
  clause: string;
  description: string;
  checked: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  préparation: "Préparation",
  en_cours: "En cours",
  clôturée: "Clôturée",
  clôture: "Clôture",
};

const MissionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isAuditeur = user?.role === "auditeur";
  const [mission, setMission] = useState<MissionData | null>(null);
  const [findings, setFindings] = useState<FindingData[]>([]);
  const [checklist, setChecklist] = useState<ChecklistData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [newType, setNewType] = useState<FindingType>("conformite");
  const [newClause, setNewClause] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newEvidence, setNewEvidence] = useState("");

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const [m, f, c] = await Promise.all([
        fetchMission(id),
        fetchFindings(id),
        fetchChecklist(id),
      ]);
      setMission(m as MissionData);
      setFindings(f as FindingData[]);
      setChecklist(c as ChecklistData[]);
    } catch {
      toast.error("Erreur de chargement de la mission");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`mission-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'findings', filter: `mission_id=eq.${id}` }, () => {
        fetchFindings(id).then((f) => setFindings(f as FindingData[])).catch(() => {});
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checklist_items', filter: `mission_id=eq.${id}` }, () => {
        fetchChecklist(id).then((c) => setChecklist(c as ChecklistData[])).catch(() => {});
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'missions', filter: `id=eq.${id}` }, (payload) => {
        setMission((prev) => prev ? { ...prev, ...(payload.new as any) } : prev);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  if (loading) return <div className="text-center py-12 text-muted-foreground">Chargement...</div>;
  if (!mission) return <div className="text-center py-12">Mission introuvable</div>;

  const isCloturee = mission.status === "clôturée";

  const addFinding = async () => {
    if (!newDesc.trim()) {
      toast.error("La description est obligatoire");
      return;
    }
    const finding = {
      id: `F-${Date.now()}`,
      mission_id: mission.id,
      type: newType,
      clause: newClause,
      description: newDesc,
      evidence: newEvidence,
    };
    await insertFinding(finding);
    setFindings((prev) => [...prev, { ...finding, created_at: new Date().toISOString() }]);
    setNewType("conformite");
    setNewClause("");
    setNewDesc("");
    setNewEvidence("");
    setDialogOpen(false);
    toast.success("Constat ajouté");

    await createNotification({
      target_role: "audite",
      mission_id: mission.id,
      type: "nouveau_constat",
      title: "Nouveau constat saisi",
      description: `${FINDING_LABELS[newType]} — ${newDesc.slice(0, 60)}`,
    });
  };

  const removeFinding = async (fId: string) => {
    await deleteFinding(fId);
    setFindings((prev) => prev.filter((f) => f.id !== fId));
    toast.info("Constat supprimé");
  };

  const toggleChecklist = async (clId: string) => {
    const item = checklist.find((c) => c.id === clId);
    if (!item) return;
    await updateChecklistItem(clId, !item.checked);
    setChecklist((prev) =>
      prev.map((c) => (c.id === clId ? { ...c, checked: !c.checked } : c))
    );
  };

  const counts: Record<FindingType, number> = {
    conformite: findings.filter((f) => f.type === "conformite").length,
    ecart_mineur: findings.filter((f) => f.type === "ecart_mineur").length,
    ecart_majeur: findings.filter((f) => f.type === "ecart_majeur").length,
    point_fort: findings.filter((f) => f.type === "point_fort").length,
  };

  const checkedCount = checklist.filter((c) => c.checked).length;

  const missionForReport = {
    id: mission.id,
    auditId: mission.audit_id,
    title: mission.title,
    referentiel: mission.referentiel,
    status: mission.status as any,
    date: mission.date,
    company: mission.company,
    contact: mission.contact,
  };

  const findingsForReport = findings.map((f) => ({
    id: f.id,
    missionId: f.mission_id,
    type: f.type as FindingType,
    clause: f.clause || "",
    description: f.description,
    evidence: f.evidence || "",
    createdAt: f.created_at,
  }));

  const handleExportPDF = async () => {
    const sigs = await fetchSignatures(mission.id);
    const sigMap: { auditeur?: string; audite?: string } = {};
    (sigs as any[]).forEach((s) => { sigMap[s.signer_role as "auditeur" | "audite"] = s.signature_data; });
    generateReport(missionForReport, findingsForReport, sigMap);
    toast.success("Rapport PDF généré");
    await createNotification({
      target_role: "audite",
      mission_id: mission.id,
      type: "rapport_pdf",
      title: "Rapport PDF disponible",
      description: `Le rapport de la mission ${mission.title} a été généré.`,
    });
  };

  const handleValidatePlan = async () => {
    await import("@/lib/supabaseService").then((s) => s.updateMissionPlanValidated(mission.id, true));
    setMission((prev) => prev ? { ...prev, plan_validated: true } : prev);
    await createNotification({
      target_role: "auditeur",
      mission_id: mission.id,
      type: "plan_valide",
      title: "Plan d'audit validé",
      description: `L'audité a validé le plan de la mission ${mission.title}.`,
    });
  };

  const handleStartAudit = async () => {
    await updateMissionStatus(mission.id, "en_cours");
    setMission((prev) => prev ? { ...prev, status: "en_cours" } : prev);
    await createNotification({
      target_role: "audite",
      mission_id: mission.id,
      type: "audit_demarre",
      title: "Audit démarré",
      description: `La mission ${mission.title} est passée en « Audit en cours ».`,
    });
    await createNotification({
      target_role: "auditeur",
      mission_id: mission.id,
      type: "audit_demarre",
      title: "Audit démarré",
      description: `La mission ${mission.title} est passée en « Audit en cours ».`,
    });
  };

  const handleCloturer = async () => {
    await updateMissionStatus(mission.id, "clôturée");
    setMission((prev) => prev ? { ...prev, status: "clôturée" } : prev);
    toast.success("Mission clôturée");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-muted-foreground">{mission.id}</span>
            <Badge className={`text-xs ${isCloturee ? "bg-navy text-primary-foreground" : "bg-teal text-primary-foreground"}`}>
              {STATUS_LABELS[mission.status] || mission.status}
            </Badge>
          </div>
          <h1 className="font-display text-2xl font-bold">{mission.title}</h1>
          <p className="text-sm text-muted-foreground">{mission.referentiel} · {mission.company} · {new Date(mission.date).toLocaleDateString("fr-FR")}</p>
        </div>
        <div className="flex gap-2">
          {/* Only auditeur can add findings */}
          {isAuditeur && !isCloturee && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-teal hover:bg-teal/90 text-primary-foreground gap-1">
                  <Plus className="w-4 h-4" />
                  Nouveau constat
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="font-display">Ajouter un constat</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label>Type de constat</Label>
                    <Select value={newType} onValueChange={(v) => setNewType(v as FindingType)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(FINDING_LABELS) as FindingType[]).map((t) => (
                          <SelectItem key={t} value={t}>{FINDING_LABELS[t]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Clause / Exigence</Label>
                    <Input placeholder="Ex: 6.1.2" value={newClause} onChange={(e) => setNewClause(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Description du constat *</Label>
                    <Textarea rows={3} placeholder="Décrivez le constat observé..." value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Preuves / Éléments factuels</Label>
                    <Textarea rows={2} placeholder="Documents, observations, entretiens..." value={newEvidence} onChange={(e) => setNewEvidence(e.target.value)} />
                  </div>
                  <Button onClick={addFinding} className="w-full bg-teal hover:bg-teal/90 text-primary-foreground">
                    Enregistrer le constat
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
          <Button variant="outline" className="gap-1 border-navy text-navy hover:bg-navy hover:text-primary-foreground" onClick={handleExportPDF}>
            <FileDown className="w-4 h-4" />
            Rapport PDF
          </Button>
          {/* Only auditeur can close */}
          {isAuditeur && mission.status === "en_cours" && (
            <Button variant="outline" className="gap-1 border-navy text-navy hover:bg-navy hover:text-primary-foreground" onClick={handleCloturer}>
              <ShieldCheck className="w-4 h-4" />
              Clôturer
            </Button>
          )}
        </div>
      </div>

      {/* Counters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(Object.keys(FINDING_LABELS) as FindingType[]).map((type) => (
          <Card key={type}>
            <CardContent className="py-3 px-4 flex items-center justify-between">
              <span className="text-xs font-medium">{FINDING_LABELS[type]}</span>
              <Badge className={`${FINDING_COLORS[type]} text-sm font-bold min-w-[28px] justify-center`}>
                {counts[type]}
              </Badge>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardContent className="py-3 px-4 flex items-center justify-between">
            <span className="text-xs font-medium">Checklist</span>
            <span className="text-sm font-bold text-teal">{checkedCount}/{checklist.length}</span>
          </CardContent>
        </Card>
      </div>

      {/* Live progress bar */}
      {checklist.length > 0 && (
        <Card>
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium">Avancement checklist</span>
              <span className="text-xs font-bold text-teal">{Math.round((checkedCount / checklist.length) * 100)}%</span>
            </div>
            <Progress value={(checkedCount / checklist.length) * 100} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="avant_audit">
        <TabsList className="bg-muted">
          <TabsTrigger value="avant_audit" className="gap-1 data-[state=active]:bg-navy data-[state=active]:text-primary-foreground">
            <FileSearch className="w-4 h-4" />
            Avant-audit
          </TabsTrigger>
          <TabsTrigger value="ouverture" className="gap-1 data-[state=active]:bg-navy data-[state=active]:text-primary-foreground">
            <DoorOpen className="w-4 h-4" />
            Ouverture
          </TabsTrigger>
          <TabsTrigger value="constats" className="gap-1 data-[state=active]:bg-navy data-[state=active]:text-primary-foreground">
            <ClipboardList className="w-4 h-4" />
            Constats ({findings.length})
          </TabsTrigger>
          <TabsTrigger value="checklist" className="gap-1 data-[state=active]:bg-navy data-[state=active]:text-primary-foreground">
            <CheckSquare className="w-4 h-4" />
            Checklist
          </TabsTrigger>
          {isCloturee && (
            <TabsTrigger value="post_audit" className="gap-1 data-[state=active]:bg-navy data-[state=active]:text-primary-foreground">
              <ShieldCheck className="w-4 h-4" />
              Post-audit
            </TabsTrigger>
          )}
          <TabsTrigger value="messagerie" className="gap-1 data-[state=active]:bg-navy data-[state=active]:text-primary-foreground">
            <MessageCircle className="w-4 h-4" />
            Messagerie
          </TabsTrigger>
        </TabsList>

        <TabsContent value="avant_audit">
          <AvantAuditTab
            missionId={mission.id}
            planValidated={mission.plan_validated}
            onValidatePlan={handleValidatePlan}
          />
        </TabsContent>

        <TabsContent value="ouverture">
          <OuvertureTab
            mission={missionForReport}
            planValidated={mission.plan_validated}
            onStartAudit={handleStartAudit}
          />
        </TabsContent>

        <TabsContent value="constats">
          <Card>
            <CardContent className="p-0">
              {findings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Aucun constat enregistré</p>
                  {isAuditeur && <p className="text-xs mt-1">Cliquez sur « Nouveau constat » pour commencer</p>}
                </div>
              ) : (
                <div className="divide-y">
                  {findings.map((f) => (
                    <div key={f.id} className="px-6 py-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={`${FINDING_COLORS[f.type as FindingType]} text-xs`}>{FINDING_LABELS[f.type as FindingType]}</Badge>
                            {f.clause && <span className="text-xs font-mono text-muted-foreground">Clause {f.clause}</span>}
                          </div>
                          <p className="text-sm">{f.description}</p>
                          {f.evidence && <p className="text-xs text-muted-foreground mt-1">Preuves : {f.evidence}</p>}
                          <FindingAttachments findingId={f.id} missionId={mission.id} readOnly={isCloturee || !isAuditeur} />
                        </div>
                        {/* Only auditeur can delete findings */}
                        {isAuditeur && !isCloturee && (
                          <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeFinding(f.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checklist">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base flex items-center justify-between">
                <span>Checklist {mission.referentiel}</span>
                <span className="text-teal text-sm font-normal">{checkedCount}/{checklist.length} vérifiés</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {checklist.map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-center gap-3 px-6 py-3 transition-colors ${isAuditeur ? "hover:bg-muted/30 cursor-pointer" : ""}`}
                  >
                    <Checkbox
                      checked={item.checked}
                      onCheckedChange={() => isAuditeur && toggleChecklist(item.id)}
                      disabled={!isAuditeur}
                      className="data-[state=checked]:bg-teal data-[state=checked]:border-teal"
                    />
                    <span className="text-xs font-mono text-muted-foreground w-10">{item.clause}</span>
                    <span className={`text-sm flex-1 ${item.checked ? "line-through text-muted-foreground" : ""}`}>
                      {item.description}
                    </span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {isCloturee && (
          <TabsContent value="post_audit">
            <PostAuditTab missionId={mission.id} findings={findings} />
          </TabsContent>
        )}

        <TabsContent value="messagerie">
          <MessagerieTab missionId={mission.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MissionPage;

import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { MOCK_MISSIONS, MOCK_CHECKLIST, FINDING_LABELS, FINDING_COLORS, type FindingType, type Finding, type ChecklistItem } from "@/data/mockData";
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
import { Plus, FileDown, CheckSquare, ClipboardList, Trash2, FileSearch, DoorOpen } from "lucide-react";
import { toast } from "sonner";
import { generateReport } from "@/lib/generateReport";
import AvantAuditTab from "@/components/mission/AvantAuditTab";
import OuvertureTab from "@/components/mission/OuvertureTab";

const MissionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const mission = MOCK_MISSIONS.find((m) => m.id === id);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([...MOCK_CHECKLIST]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [planValidated, setPlanValidated] = useState(false);
  const [missionStatus, setMissionStatus] = useState(mission?.status || "préparation");
  // Form state
  const [newType, setNewType] = useState<FindingType>("conformite");
  const [newClause, setNewClause] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newEvidence, setNewEvidence] = useState("");

  if (!mission) return <div className="text-center py-12">Mission introuvable</div>;

  const addFinding = () => {
    if (!newDesc.trim()) {
      toast.error("La description est obligatoire");
      return;
    }
    const finding: Finding = {
      id: `F-${Date.now()}`,
      missionId: mission.id,
      type: newType,
      clause: newClause,
      description: newDesc,
      evidence: newEvidence,
      createdAt: new Date().toISOString(),
    };
    setFindings((prev) => [...prev, finding]);
    setNewType("conformite");
    setNewClause("");
    setNewDesc("");
    setNewEvidence("");
    setDialogOpen(false);
    toast.success("Constat ajouté");
  };

  const removeFinding = (fId: string) => {
    setFindings((prev) => prev.filter((f) => f.id !== fId));
    toast.info("Constat supprimé");
  };

  const toggleChecklist = (clId: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === clId ? { ...item, checked: !item.checked } : item))
    );
  };

  const counts: Record<FindingType, number> = {
    conformite: findings.filter((f) => f.type === "conformite").length,
    ecart_mineur: findings.filter((f) => f.type === "ecart_mineur").length,
    ecart_majeur: findings.filter((f) => f.type === "ecart_majeur").length,
    point_fort: findings.filter((f) => f.type === "point_fort").length,
  };

  const checkedCount = checklist.filter((c) => c.checked).length;

  const handleExportPDF = () => {
    generateReport(mission, findings);
    toast.success("Rapport PDF généré");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-muted-foreground">{mission.id}</span>
            <Badge className="bg-teal text-primary-foreground text-xs">{mission.status === "en_cours" ? "En cours" : mission.status}</Badge>
          </div>
          <h1 className="font-display text-2xl font-bold">{mission.title}</h1>
          <p className="text-sm text-muted-foreground">{mission.referentiel} · {mission.company} · {new Date(mission.date).toLocaleDateString("fr-FR")}</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-teal hover:bg-teal-dark text-primary-foreground gap-1">
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
                <Button onClick={addFinding} className="w-full bg-teal hover:bg-teal-dark text-primary-foreground">
                  Enregistrer le constat
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" className="gap-1 border-navy text-navy hover:bg-navy hover:text-primary-foreground" onClick={handleExportPDF}>
            <FileDown className="w-4 h-4" />
            Rapport PDF
          </Button>
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

      {/* Tabs */}
      <Tabs defaultValue="constats">
        <TabsList className="bg-muted">
          <TabsTrigger value="constats" className="gap-1 data-[state=active]:bg-navy data-[state=active]:text-primary-foreground">
            <ClipboardList className="w-4 h-4" />
            Constats ({findings.length})
          </TabsTrigger>
          <TabsTrigger value="checklist" className="gap-1 data-[state=active]:bg-navy data-[state=active]:text-primary-foreground">
            <CheckSquare className="w-4 h-4" />
            Checklist
          </TabsTrigger>
        </TabsList>

        <TabsContent value="constats">
          <Card>
            <CardContent className="p-0">
              {findings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Aucun constat enregistré</p>
                  <p className="text-xs mt-1">Cliquez sur « Nouveau constat » pour commencer</p>
                </div>
              ) : (
                <div className="divide-y">
                  {findings.map((f) => (
                    <div key={f.id} className="px-6 py-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={`${FINDING_COLORS[f.type]} text-xs`}>{FINDING_LABELS[f.type]}</Badge>
                            {f.clause && <span className="text-xs font-mono text-muted-foreground">Clause {f.clause}</span>}
                          </div>
                          <p className="text-sm">{f.description}</p>
                          {f.evidence && <p className="text-xs text-muted-foreground mt-1">Preuves : {f.evidence}</p>}
                        </div>
                        <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeFinding(f.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
                    className="flex items-center gap-3 px-6 py-3 hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <Checkbox
                      checked={item.checked}
                      onCheckedChange={() => toggleChecklist(item.id)}
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
      </Tabs>
    </div>
  );
};

export default MissionPage;

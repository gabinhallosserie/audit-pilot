import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, PlayCircle, Users, ListChecks, Target, PenLine } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import SignatureCanvas from "@/components/mission/SignatureCanvas";
import {
  fetchOpeningReport,
  fetchParticipants,
  updateOpeningReport,
  insertParticipant,
  deleteParticipant,
  fetchSignatures,
  upsertSignature,
} from "@/lib/supabaseService";
import type { Mission } from "@/data/mockData";

interface Participant {
  id: string;
  name: string;
  role: string | null;
  organisation: string | null;
}

interface OuvertureTabProps {
  mission: Mission;
  onStartAudit: () => void;
  planValidated: boolean;
}

const OuvertureTab: React.FC<OuvertureTabProps> = ({ mission, onStartAudit, planValidated }) => {
  const { user } = useAuth();
  const isAuditeur = user?.role === "auditeur";

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [agenda, setAgenda] = useState<string[]>([]);
  const [perimetre, setPerimetre] = useState("");
  const [remarques, setRemarques] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [missionStarted, setMissionStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [signatures, setSignatures] = useState<Record<string, string>>({});

  const [pName, setPName] = useState("");
  const [pRole, setPRole] = useState("");
  const [pOrg, setPOrg] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [report, parts, sigs] = await Promise.all([
          fetchOpeningReport(mission.id),
          fetchParticipants(mission.id),
          fetchSignatures(mission.id),
        ]);
        if (report) {
          setPerimetre(report.perimetre || "");
          setRemarques(report.remarques || "");
          setAgenda((report.agenda as string[]) || []);
          setMissionStarted(report.mission_started);
        }
        setParticipants(parts as Participant[]);
        const sigMap: Record<string, string> = {};
        (sigs as any[]).forEach((s) => { sigMap[s.signer_role] = s.signature_data; });
        setSignatures(sigMap);
      } catch {
        toast.error("Erreur de chargement");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [mission.id]);

  const addParticipantHandler = async () => {
    if (!pName.trim()) {
      toast.error("Le nom est obligatoire");
      return;
    }
    const p = { id: `P-${Date.now()}`, mission_id: mission.id, name: pName, role: pRole, organisation: pOrg };
    await insertParticipant(p);
    setParticipants((prev) => [...prev, p]);
    setPName("");
    setPRole("");
    setPOrg("");
    setDialogOpen(false);
    toast.success("Participant ajouté");
  };

  const removeParticipantHandler = async (id: string) => {
    await deleteParticipant(id);
    setParticipants((prev) => prev.filter((p) => p.id !== id));
  };

  const [newAgendaItem, setNewAgendaItem] = useState("");
  const addAgendaItem = async () => {
    if (!newAgendaItem.trim()) return;
    const updated = [...agenda, newAgendaItem];
    await updateOpeningReport(mission.id, { agenda: updated });
    setAgenda(updated);
    setNewAgendaItem("");
  };
  const removeAgendaItem = async (idx: number) => {
    const updated = agenda.filter((_, i) => i !== idx);
    await updateOpeningReport(mission.id, { agenda: updated });
    setAgenda(updated);
  };

  const handlePerimetreBlur = async () => {
    await updateOpeningReport(mission.id, { perimetre });
  };

  const handleRemarquesBlur = async () => {
    await updateOpeningReport(mission.id, { remarques });
  };

  const handleStartAudit = async () => {
    await updateOpeningReport(mission.id, { mission_started: true });
    setMissionStarted(true);
    onStartAudit();
    toast.success("🚀 La mission est passée en « Audit en cours »", {
      description: "L'auditeur et l'audité ont été notifiés.",
      duration: 5000,
    });
  };

  const handleSaveSignature = async (role: string, dataUrl: string) => {
    try {
      await upsertSignature({ mission_id: mission.id, signer_role: role, signature_data: dataUrl });
      setSignatures((prev) => ({ ...prev, [role]: dataUrl }));
      toast.success("Signature enregistrée");
    } catch {
      toast.error("Erreur lors de l'enregistrement de la signature");
    }
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Chargement...</div>;

  return (
    <div className="space-y-4">
      {missionStarted && (
        <Card className="border-teal/50 bg-teal/5">
          <CardContent className="py-3 px-4 flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-teal" />
            <span className="text-sm font-medium">Réunion d'ouverture terminée — Audit en cours</span>
          </CardContent>
        </Card>
      )}

      {/* Participants */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-navy" />
            Participants
            <Badge variant="outline" className="ml-auto text-xs">{participants.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {participants.map((p) => (
              <div key={p.id} className="px-6 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.role}{p.organisation ? ` · ${p.organisation}` : ""}
                  </p>
                </div>
                {isAuditeur && !missionStarted && (
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => removeParticipantHandler(p.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          {isAuditeur && !missionStarted && (
            <div className="px-6 py-3 border-t">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Plus className="w-3 h-3" />
                    Ajouter un participant
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-display">Ajouter un participant</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 mt-2">
                    <div className="space-y-1">
                      <Label>Nom *</Label>
                      <Input value={pName} onChange={(e) => setPName(e.target.value)} placeholder="Nom complet" />
                    </div>
                    <div className="space-y-1">
                      <Label>Rôle / Fonction</Label>
                      <Input value={pRole} onChange={(e) => setPRole(e.target.value)} placeholder="Ex: Responsable QSE" />
                    </div>
                    <div className="space-y-1">
                      <Label>Organisation</Label>
                      <Input value={pOrg} onChange={(e) => setPOrg(e.target.value)} placeholder="Ex: Écovert Industries" />
                    </div>
                    <Button onClick={addParticipantHandler} className="w-full bg-teal hover:bg-teal/90 text-primary-foreground">
                      Ajouter
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ordre du jour */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-navy" />
            Ordre du jour
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ol className="divide-y">
            {agenda.map((item, idx) => (
              <li key={idx} className="px-6 py-2 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-muted-foreground w-5">{idx + 1}.</span>
                  <span className="text-sm">{item}</span>
                </div>
                {isAuditeur && !missionStarted && (
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-7 w-7" onClick={() => removeAgendaItem(idx)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </li>
            ))}
          </ol>
          {isAuditeur && !missionStarted && (
            <div className="px-6 py-3 border-t flex gap-2">
              <Input
                value={newAgendaItem}
                onChange={(e) => setNewAgendaItem(e.target.value)}
                placeholder="Ajouter un point à l'ordre du jour"
                className="text-sm"
                onKeyDown={(e) => e.key === "Enter" && addAgendaItem()}
              />
              <Button variant="outline" size="sm" onClick={addAgendaItem}>
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Périmètre */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Target className="w-4 h-4 text-navy" />
            Confirmation du périmètre
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={2}
            value={perimetre}
            onChange={(e) => setPerimetre(e.target.value)}
            onBlur={handlePerimetreBlur}
            readOnly={!isAuditeur || missionStarted}
          />
        </CardContent>
      </Card>

      {/* Remarques */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-base">Remarques</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={3}
            placeholder="Remarques ou commentaires sur la réunion d'ouverture..."
            value={remarques}
            onChange={(e) => setRemarques(e.target.value)}
            onBlur={handleRemarquesBlur}
            readOnly={missionStarted}
          />
        </CardContent>
      </Card>

      {isAuditeur && !missionStarted && planValidated && (
        <div className="flex justify-end">
          <Button className="bg-navy hover:bg-navy/90 text-primary-foreground gap-2 px-6" onClick={handleStartAudit}>
            <PlayCircle className="w-5 h-5" />
            Démarrer l'audit
          </Button>
        </div>
      )}

      {isAuditeur && !missionStarted && !planValidated && (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="py-3 px-4 text-sm text-muted-foreground">
            Le plan d'audit doit être validé par l'audité avant de pouvoir démarrer l'audit.
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OuvertureTab;

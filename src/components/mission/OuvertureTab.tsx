import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, PlayCircle, Users, ListChecks, Target, PenLine, FileDown } from "lucide-react";
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

  const handleGenerateMissionDoc = () => {
    import("jspdf").then(({ default: jsPDF }) => {
      const doc = new jsPDF();
      const navy = "#1B2A4A";
      const teal = "#00B4A6";
      const pw = doc.internal.pageSize.getWidth();

      // Header
      doc.setFillColor(navy);
      doc.rect(0, 0, pw, 42, "F");
      doc.setTextColor("#FFFFFF");
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("AUDIT.IO", 14, 18);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Document de mission", 14, 26);
      doc.setFontSize(9);
      doc.text(mission.title, 14, 34);
      doc.text(`Ref: ${mission.id}`, pw - 14, 18, { align: "right" });
      doc.text(new Date(mission.date).toLocaleDateString("fr-FR"), pw - 14, 26, { align: "right" });
      doc.setFillColor(teal);
      doc.rect(0, 42, pw, 2, "F");

      let y = 54;
      // Mission info
      doc.setTextColor(navy);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Informations de la mission", 14, y);
      y += 8;
      doc.setFontSize(9);
      doc.setTextColor("#333333");
      const info = [
        ["Référentiel", mission.referentiel],
        ["Organisme", mission.company],
        ["Contact audité", mission.contact],
        ["Date", new Date(mission.date).toLocaleDateString("fr-FR")],
      ];
      info.forEach(([label, value]) => {
        doc.setFont("helvetica", "bold");
        doc.text(`${label} :`, 14, y);
        doc.setFont("helvetica", "normal");
        doc.text(value, 55, y);
        y += 6;
      });

      // Périmètre
      y += 6;
      doc.setTextColor(navy);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Périmètre", 14, y);
      y += 7;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor("#333333");
      doc.text(perimetre || "Non renseigné", 14, y, { maxWidth: pw - 28 });
      y += perimetre ? Math.ceil(perimetre.length / 90) * 5 + 5 : 8;

      // Participants
      y += 4;
      doc.setTextColor(navy);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Participants", 14, y);
      y += 7;
      doc.setFontSize(9);
      doc.setTextColor("#333333");
      participants.forEach((p) => {
        doc.setFont("helvetica", "bold");
        doc.text(p.name, 14, y);
        doc.setFont("helvetica", "normal");
        doc.text(`${p.role || ""}${p.organisation ? ` — ${p.organisation}` : ""}`, 55, y);
        y += 5;
      });

      // Agenda
      y += 6;
      doc.setTextColor(navy);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Ordre du jour", 14, y);
      y += 7;
      doc.setFontSize(9);
      doc.setTextColor("#333333");
      agenda.forEach((item, idx) => {
        doc.text(`${idx + 1}. ${item}`, 14, y);
        y += 5;
      });

      // Conditions
      y += 6;
      doc.setTextColor(navy);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Conditions acceptées", 14, y);
      y += 7;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor("#333333");
      doc.text("Les deux parties ont validé les conditions de la mission et les paramètres ci-dessus.", 14, y, { maxWidth: pw - 28 });

      // Signatures
      y += 14;
      if (y > 230) { doc.addPage(); y = 20; }
      doc.setTextColor(navy);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Signatures", 14, y);
      y += 10;

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor("#333333");
      doc.text("L'auditeur", 14, y);
      if (signatures["auditeur"]) {
        doc.addImage(signatures["auditeur"], "PNG", 14, y + 4, 70, 25);
      }
      doc.setDrawColor(navy);
      doc.rect(14, y + 4, 70, 25);

      doc.text("L'audité", pw / 2 + 10, y);
      if (signatures["audite"]) {
        doc.addImage(signatures["audite"], "PNG", pw / 2 + 10, y + 4, 70, 25);
      }
      doc.rect(pw / 2 + 10, y + 4, 70, 25);

      // Footer
      const pc = doc.getNumberOfPages();
      for (let i = 1; i <= pc; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor("#999999");
        doc.text(`AUDIT.IO — Document de mission généré le ${new Date().toLocaleDateString("fr-FR")} — Page ${i}/${pc}`, pw / 2, doc.internal.pageSize.getHeight() - 8, { align: "center" });
      }

      doc.save(`Document_Mission_${mission.id}_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("Document de mission généré");
    });
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

      {/* Signatures */}
      {missionStarted && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <PenLine className="w-4 h-4 text-navy" />
              Signatures électroniques
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <SignatureCanvas
              label="Signature de l'auditeur"
              existingSignature={signatures["auditeur"] || null}
              disabled={!isAuditeur}
              onSave={(data) => handleSaveSignature("auditeur", data)}
            />
            <SignatureCanvas
              label="Signature de l'audité"
              existingSignature={signatures["audite"] || null}
              disabled={isAuditeur}
              onSave={(data) => handleSaveSignature("audite", data)}
            />
            {signatures["auditeur"] && signatures["audite"] && (
              <div className="col-span-2 space-y-2">
                <p className="text-xs text-teal font-medium">✓ Les deux signatures sont enregistrées — le rapport PDF inclura les signatures.</p>
                <Button
                  variant="outline"
                  className="gap-1 border-navy text-navy hover:bg-navy hover:text-primary-foreground"
                  onClick={handleGenerateMissionDoc}
                >
                  <FileDown className="w-4 h-4" />
                  Générer le document de mission
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
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

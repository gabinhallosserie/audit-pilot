import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, CheckCircle2, Clock, FileText } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export interface AuditProcess {
  id: string;
  name: string;
  responsible: string;
  date: string;
  duration: string;
  checklistItems: { id: string; label: string; checked: boolean }[];
}

interface AvantAuditTabProps {
  missionId: string;
  planValidated: boolean;
  onValidatePlan: () => void;
}

const AvantAuditTab: React.FC<AvantAuditTabProps> = ({ missionId, planValidated, onValidatePlan }) => {
  const { user } = useAuth();
  const isAuditeur = user?.role === "auditeur";
  const isAudite = user?.role === "audite";

  const [processes, setProcesses] = useState<AuditProcess[]>([]);
  const [notes, setNotes] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [newName, setNewName] = useState("");
  const [newResponsible, setNewResponsible] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newDuration, setNewDuration] = useState("1h");

  const addProcess = () => {
    if (!newName.trim()) {
      toast.error("Le nom du processus est obligatoire");
      return;
    }
    const process: AuditProcess = {
      id: `PROC-${Date.now()}`,
      name: newName,
      responsible: newResponsible,
      date: newDate,
      duration: newDuration,
      checklistItems: [
        { id: `CK-${Date.now()}-1`, label: "Documents requis collectés", checked: false },
        { id: `CK-${Date.now()}-2`, label: "Responsable informé", checked: false },
        { id: `CK-${Date.now()}-3`, label: "Critères d'audit définis", checked: false },
        { id: `CK-${Date.now()}-4`, label: "Preuves préliminaires examinées", checked: false },
      ],
    };
    setProcesses((prev) => [...prev, process]);
    setNewName("");
    setNewResponsible("");
    setNewDate("");
    setNewDuration("1h");
    setDialogOpen(false);
    toast.success("Processus ajouté au plan d'audit");
  };

  const removeProcess = (id: string) => {
    setProcesses((prev) => prev.filter((p) => p.id !== id));
    toast.info("Processus supprimé");
  };

  const toggleChecklistItem = (processId: string, itemId: string) => {
    setProcesses((prev) =>
      prev.map((p) =>
        p.id === processId
          ? {
              ...p,
              checklistItems: p.checklistItems.map((ci) =>
                ci.id === itemId ? { ...ci, checked: !ci.checked } : ci
              ),
            }
          : p
      )
    );
  };

  const totalChecklist = processes.reduce((sum, p) => sum + p.checklistItems.length, 0);
  const checkedCount = processes.reduce(
    (sum, p) => sum + p.checklistItems.filter((ci) => ci.checked).length,
    0
  );

  return (
    <div className="space-y-4">
      {/* Status banner */}
      <Card className={planValidated ? "border-teal/50 bg-teal/5" : "border-warning/50 bg-warning/5"}>
        <CardContent className="py-3 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {planValidated ? (
              <CheckCircle2 className="w-5 h-5 text-teal" />
            ) : (
              <Clock className="w-5 h-5 text-warning" />
            )}
            <span className="text-sm font-medium">
              {planValidated ? "Plan d'audit validé par l'audité" : "Plan en attente de validation"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {totalChecklist > 0 && (
              <span className="text-xs text-muted-foreground">
                Préparation : {checkedCount}/{totalChecklist}
              </span>
            )}
            {isAudite && !planValidated && processes.length > 0 && (
              <Button
                size="sm"
                className="bg-teal hover:bg-teal/90 text-primary-foreground"
                onClick={() => {
                  onValidatePlan();
                  toast.success("Plan d'audit validé !");
                }}
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Valider le plan
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions bar for auditeur */}
      {isAuditeur && !planValidated && (
        <div className="flex justify-end">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-teal hover:bg-teal/90 text-primary-foreground gap-1">
                <Plus className="w-4 h-4" />
                Ajouter un processus
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-display">Ajouter un processus au plan</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label>Nom du processus *</Label>
                  <Input
                    placeholder="Ex: Gestion des déchets"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Responsable</Label>
                  <Input
                    placeholder="Ex: Pierre Lefèvre"
                    value={newResponsible}
                    onChange={(e) => setNewResponsible(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Date prévue</Label>
                    <Input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Durée estimée</Label>
                    <Input
                      placeholder="Ex: 2h"
                      value={newDuration}
                      onChange={(e) => setNewDuration(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={addProcess} className="w-full bg-teal hover:bg-teal/90 text-primary-foreground">
                  Ajouter au plan
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Process list */}
      {processes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Aucun processus dans le plan d'audit</p>
            {isAuditeur && (
              <p className="text-xs mt-1">Cliquez sur « Ajouter un processus » pour construire le plan</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {processes.map((proc) => {
            const done = proc.checklistItems.filter((ci) => ci.checked).length;
            return (
              <Card key={proc.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="font-display text-base flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{proc.name}</span>
                      <Badge variant="outline" className="text-xs font-normal">
                        {done}/{proc.checklistItems.length} prêt
                      </Badge>
                    </div>
                    {isAuditeur && !planValidated && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => removeProcess(proc.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </CardTitle>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    {proc.responsible && <span>Responsable : {proc.responsible}</span>}
                    {proc.date && (
                      <span>Date : {new Date(proc.date).toLocaleDateString("fr-FR")}</span>
                    )}
                    <span>Durée : {proc.duration}</span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="divide-y">
                    {proc.checklistItems.map((ci) => (
                      <label
                        key={ci.id}
                        className="flex items-center gap-3 py-2 cursor-pointer hover:bg-muted/30 transition-colors px-1 rounded"
                      >
                        <Checkbox
                          checked={ci.checked}
                          onCheckedChange={() => toggleChecklistItem(proc.id, ci.id)}
                          className="data-[state=checked]:bg-teal data-[state=checked]:border-teal"
                        />
                        <span className={`text-sm ${ci.checked ? "line-through text-muted-foreground" : ""}`}>
                          {ci.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base">Notes de préparation</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={4}
            placeholder="Ajoutez vos notes de préparation pour cette mission..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            readOnly={!isAuditeur}
          />
          {isAuditeur && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2 border-navy text-navy hover:bg-navy hover:text-primary-foreground"
              onClick={() => toast.success("Notes sauvegardées")}
            >
              Sauvegarder les notes
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AvantAuditTab;

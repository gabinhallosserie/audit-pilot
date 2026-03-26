import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Star, ClipboardCheck, AlertTriangle, Lock, Download } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { FINDING_LABELS, FINDING_COLORS, type FindingType } from "@/data/mockData";
import {
  fetchCorrectiveActions,
  insertCorrectiveAction,
  updateCorrectiveActionStatus,
  fetchRatings,
  upsertRating,
  createNotification,
} from "@/lib/supabaseService";

interface CorrectiveAction {
  id: string;
  mission_id: string;
  finding_id: string;
  responsible: string;
  deadline: string | null;
  expected_evidence: string | null;
  status: string;
}

interface Rating {
  id: string;
  mission_id: string;
  rater_role: string;
  score: number;
  comment: string | null;
}

interface FindingData {
  id: string;
  type: string;
  clause: string | null;
  description: string;
}

interface PostAuditTabProps {
  missionId: string;
  findings: FindingData[];
}

const ACTION_STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  en_cours: { label: "En cours", class: "bg-warning text-warning-foreground" },
  réalisée: { label: "Réalisée", class: "bg-success text-success-foreground" },
  en_retard: { label: "En retard", class: "bg-destructive text-destructive-foreground" },
};

const StarRating: React.FC<{ value: number; onChange?: (v: number) => void; readonly?: boolean }> = ({ value, onChange, readonly }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          className={`transition-colors ${readonly ? "cursor-default" : "cursor-pointer"}`}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          onClick={() => onChange?.(star)}
        >
          <Star
            className={`w-6 h-6 ${
              star <= (hover || value) ? "fill-warning text-warning" : "text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
};

const PostAuditTab: React.FC<PostAuditTabProps> = ({ missionId, findings }) => {
  const { user } = useAuth();
  const isAuditeur = user?.role === "auditeur";
  const isAudite = user?.role === "audite";

  const [actions, setActions] = useState<CorrectiveAction[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form
  const [selectedFinding, setSelectedFinding] = useState("");
  const [responsible, setResponsible] = useState("");
  const [deadline, setDeadline] = useState("");
  const [expectedEvidence, setExpectedEvidence] = useState("");

  // Rating form
  const [myScore, setMyScore] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const ecarts = findings.filter((f) => f.type === "ecart_mineur" || f.type === "ecart_majeur");

  useEffect(() => {
    const load = async () => {
      try {
        const [a, r] = await Promise.all([
          fetchCorrectiveActions(missionId),
          fetchRatings(missionId),
        ]);
        setActions(a as CorrectiveAction[]);
        setRatings(r as Rating[]);

        const myRole = user?.role || "";
        const myRating = (r as Rating[]).find((rt) => rt.rater_role === myRole);
        if (myRating) {
          setMyScore(myRating.score);
          setMyComment(myRating.comment || "");
          setRatingSubmitted(true);
        }
      } catch {
        toast.error("Erreur de chargement post-audit");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [missionId, user?.role]);

  const addAction = async () => {
    if (!selectedFinding || !responsible.trim()) {
      toast.error("Sélectionnez un écart et renseignez un responsable");
      return;
    }
    const action = {
      id: `CA-${Date.now()}`,
      mission_id: missionId,
      finding_id: selectedFinding,
      responsible,
      deadline: deadline || null,
      expected_evidence: expectedEvidence,
      status: "en_cours",
    };
    await insertCorrectiveAction(action);
    setActions((prev) => [...prev, action]);
    setSelectedFinding("");
    setResponsible("");
    setDeadline("");
    setExpectedEvidence("");
    setDialogOpen(false);
    toast.success("Action corrective créée");
  };

  const changeStatus = async (actionId: string, newStatus: string) => {
    await updateCorrectiveActionStatus(actionId, newStatus);
    setActions((prev) => prev.map((a) => a.id === actionId ? { ...a, status: newStatus } : a));

    if (newStatus === "en_retard") {
      await createNotification({
        target_role: "auditeur",
        mission_id: missionId,
        type: "action_en_retard",
        title: "Action corrective en retard",
        description: `Une action corrective est marquée en retard.`,
      });
      await createNotification({
        target_role: "audite",
        mission_id: missionId,
        type: "action_en_retard",
        title: "Action corrective en retard",
        description: `Une action corrective est marquée en retard.`,
      });
    }
    toast.success("Statut mis à jour");
  };

  const submitRating = async () => {
    if (myScore === 0) {
      toast.error("Veuillez attribuer une note");
      return;
    }
    await upsertRating({
      mission_id: missionId,
      rater_role: user?.role || "",
      score: myScore,
      comment: myComment,
    });
    setRatingSubmitted(true);
    // Refresh ratings
    const r = await fetchRatings(missionId);
    setRatings(r as Rating[]);
    toast.success("Notation enregistrée");
  };

  const bothRated = ratings.length === 2;
  const otherRating = ratings.find((r) => r.rater_role !== user?.role);
  const myRatingData = ratings.find((r) => r.rater_role === user?.role);

  if (loading) return <div className="text-center py-8 text-muted-foreground">Chargement...</div>;

  return (
    <div className="space-y-6">
      {/* ─── Corrective Actions ─── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-base flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-navy" />
              Plan d'actions correctives
            </div>
            {isAuditeur && ecarts.length > 0 && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-teal hover:bg-teal/90 text-primary-foreground gap-1">
                    <Plus className="w-3 h-3" />
                    Nouvelle action
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="font-display">Créer une action corrective</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-2">
                    <div className="space-y-2">
                      <Label>Écart concerné *</Label>
                      <Select value={selectedFinding} onValueChange={setSelectedFinding}>
                        <SelectTrigger><SelectValue placeholder="Sélectionner un écart" /></SelectTrigger>
                        <SelectContent>
                          {ecarts.map((e) => (
                            <SelectItem key={e.id} value={e.id}>
                              <span className="flex items-center gap-2">
                                <Badge className={`${FINDING_COLORS[e.type as FindingType]} text-xs`}>{FINDING_LABELS[e.type as FindingType]}</Badge>
                                {e.clause && <span className="text-xs font-mono">§{e.clause}</span>}
                                <span className="text-xs truncate max-w-[200px]">{e.description}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Responsable *</Label>
                      <Input placeholder="Nom du responsable" value={responsible} onChange={(e) => setResponsible(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Date limite</Label>
                      <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Preuve attendue</Label>
                      <Textarea rows={2} placeholder="Document, photo, enregistrement..." value={expectedEvidence} onChange={(e) => setExpectedEvidence(e.target.value)} />
                    </div>
                    <Button onClick={addAction} className="w-full bg-teal hover:bg-teal/90 text-primary-foreground">
                      Créer l'action
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {ecarts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Aucun écart — pas d'action corrective nécessaire</p>
            </div>
          ) : actions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">{ecarts.length} écart(s) sans action corrective</p>
              {isAuditeur && <p className="text-xs mt-1">Cliquez sur « Nouvelle action » pour commencer</p>}
            </div>
          ) : (
            <div className="divide-y">
              {actions.map((action) => {
                const finding = findings.find((f) => f.id === action.finding_id);
                const sc = ACTION_STATUS_CONFIG[action.status] || ACTION_STATUS_CONFIG.en_cours;
                return (
                  <div key={action.id} className="px-6 py-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {finding && (
                            <Badge className={`${FINDING_COLORS[finding.type as FindingType]} text-xs`}>
                              {FINDING_LABELS[finding.type as FindingType]}
                            </Badge>
                          )}
                          {finding?.clause && <span className="text-xs font-mono text-muted-foreground">§{finding.clause}</span>}
                          <Badge className={`${sc.class} text-xs`}>{sc.label}</Badge>
                        </div>
                        {finding && <p className="text-sm text-muted-foreground mb-1">{finding.description}</p>}
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>Responsable : <strong>{action.responsible}</strong></span>
                          {action.deadline && <span>Échéance : {new Date(action.deadline).toLocaleDateString("fr-FR")}</span>}
                        </div>
                        {action.expected_evidence && (
                          <p className="text-xs text-muted-foreground mt-1">Preuve attendue : {action.expected_evidence}</p>
                        )}
                      </div>
                      <div>
                        <Select value={action.status} onValueChange={(v) => changeStatus(action.id, v)}>
                          <SelectTrigger className="w-[130px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en_cours">En cours</SelectItem>
                            <SelectItem value="réalisée">Réalisée</SelectItem>
                            <SelectItem value="en_retard">En retard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Mutual Ratings ─── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Star className="w-4 h-4 text-warning" />
            Notation mutuelle
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* My rating */}
          {!ratingSubmitted ? (
            <div className="p-4 border rounded-lg space-y-3">
              <p className="text-sm font-medium">
                {isAuditeur ? "Notez l'audité" : "Notez l'auditeur"}
              </p>
              <StarRating value={myScore} onChange={setMyScore} />
              <Textarea
                rows={2}
                placeholder="Commentaire (optionnel)..."
                value={myComment}
                onChange={(e) => setMyComment(e.target.value)}
              />
              <Button size="sm" className="bg-teal hover:bg-teal/90 text-primary-foreground" onClick={submitRating}>
                Soumettre ma notation
              </Button>
            </div>
          ) : (
            <div className="p-4 border rounded-lg border-teal/30 bg-teal/5">
              <p className="text-sm font-medium mb-1">Votre notation</p>
              <StarRating value={myRatingData?.score || myScore} readonly />
              {(myRatingData?.comment || myComment) && (
                <p className="text-xs text-muted-foreground mt-1">{myRatingData?.comment || myComment}</p>
              )}
            </div>
          )}

          {/* Other's rating */}
          {bothRated ? (
            <div className="p-4 border rounded-lg">
              <p className="text-sm font-medium mb-1">
                Notation {otherRating?.rater_role === "auditeur" ? "de l'auditeur" : "de l'audité"}
              </p>
              <StarRating value={otherRating?.score || 0} readonly />
              {otherRating?.comment && (
                <p className="text-xs text-muted-foreground mt-1">{otherRating.comment}</p>
              )}
            </div>
          ) : ratingSubmitted ? (
            <div className="p-4 border rounded-lg bg-muted/30 flex items-center gap-2">
              <Lock className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                La notation de l'autre partie sera visible une fois qu'elle aura noté.
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};

export default PostAuditTab;

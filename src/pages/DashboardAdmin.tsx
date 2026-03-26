import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Users, BookOpen, Plus, CheckCircle, Clock, BarChart3, Building2 } from "lucide-react";
import { fetchAudits, fetchMissions, fetchRatings } from "@/lib/supabaseService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RegistrationAccount {
  id: string;
  account_type: string;
  status: string;
  email: string;
  nom: string | null;
  prenom: string | null;
  raison_sociale: string | null;
  auditeur_statut: string | null;
  created_at: string;
}

interface Referentiel {
  id: string;
  name: string;
  active: boolean;
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  audite: "Audité",
  auditeur: "Auditeur",
  organisme: "Organisme",
};

const INITIAL_REFS: Referentiel[] = [
  { id: "iso9001", name: "ISO 9001", active: true },
  { id: "iso14001", name: "ISO 14001", active: true },
  { id: "iso50001", name: "ISO 50001", active: true },
  { id: "iso45001", name: "ISO 45001", active: true },
  { id: "csrd", name: "CSRD", active: true },
];

const DashboardAdmin: React.FC = () => {
  const [referentiels, setReferentiels] = useState<Referentiel[]>(INITIAL_REFS);
  const [newRef, setNewRef] = useState("");
  const [registrations, setRegistrations] = useState<RegistrationAccount[]>([]);
  const [stats, setStats] = useState({ total: 0, enCours: 0, termines: 0, auditeursActifs: 0, auditesActifs: 0, avgScore: 0 });
  const [loading, setLoading] = useState(true);

  const loadRegistrations = async () => {
    const { data } = await supabase
      .from("registration_accounts")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setRegistrations(data as RegistrationAccount[]);
  };

  useEffect(() => {
    Promise.all([fetchAudits(), fetchMissions(), loadRegistrations()])
      .then(async ([audits, missions]) => {
        const enCours = missions.filter((m: any) => m.status === "en_cours").length;
        const termines = missions.filter((m: any) => m.status === "clôture" || m.status === "clôturée").length;

        let allScores: number[] = [];
        for (const m of missions) {
          try {
            const ratings = await fetchRatings(m.id);
            allScores.push(...ratings.map((r: any) => r.score));
          } catch {}
        }
        const avgScore = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;

        const { data: regs } = await supabase.from("registration_accounts").select("account_type, status");
        const activeAuditeurs = (regs || []).filter((r: any) => r.account_type === "auditeur" && r.status === "actif").length;
        const activeAudites = (regs || []).filter((r: any) => r.account_type === "audite" && r.status === "actif").length;

        setStats({
          total: audits.length,
          enCours,
          termines,
          auditeursActifs: activeAuditeurs,
          auditesActifs: activeAudites,
          avgScore: Math.round(avgScore * 10) / 10,
        });
      })
      .catch(() => toast.error("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, []);

  const activateRegistration = async (id: string) => {
    const { error } = await supabase
      .from("registration_accounts")
      .update({ status: "actif" } as any)
      .eq("id", id);
    if (error) { toast.error("Erreur lors de l'activation"); return; }
    toast.success("Compte activé avec succès");
    setRegistrations((prev) => prev.map((r) => r.id === id ? { ...r, status: "actif" } : r));
  };

  const deactivateRegistration = async (id: string) => {
    const { error } = await supabase
      .from("registration_accounts")
      .update({ status: "désactivé" } as any)
      .eq("id", id);
    if (error) { toast.error("Erreur"); return; }
    toast.success("Compte désactivé");
    setRegistrations((prev) => prev.map((r) => r.id === id ? { ...r, status: "désactivé" } : r));
  };

  const toggleRef = (id: string) => {
    setReferentiels((prev) =>
      prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r))
    );
    toast.success("Référentiel mis à jour");
  };

  const addRef = () => {
    const name = newRef.trim();
    if (!name) return;
    if (referentiels.some((r) => r.name.toLowerCase() === name.toLowerCase())) {
      toast.error("Ce référentiel existe déjà");
      return;
    }
    setReferentiels((prev) => [...prev, { id: crypto.randomUUID(), name, active: true }]);
    setNewRef("");
    toast.success("Référentiel ajouté");
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">Chargement...</div>;

  const pendingCount = registrations.filter((r) => r.status === "en_attente").length;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Back-office Administrateur</h1>
        <p className="text-muted-foreground text-sm mt-1">Gestion globale de la plateforme</p>
      </div>

      {/* ═══════════════════════════════════════════
          SECTION 1 — Reporting global
          ═══════════════════════════════════════════ */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-teal" />
          <h2 className="font-display text-lg font-semibold">Reporting global</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "Audits totaux", value: stats.total },
            { label: "En cours", value: stats.enCours },
            { label: "Terminés", value: stats.termines },
            { label: "Auditeurs actifs", value: stats.auditeursActifs },
            { label: "Audités actifs", value: stats.auditesActifs },
            { label: "Note moyenne", value: stats.avgScore > 0 ? `${stats.avgScore} ★` : "—" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-5 pb-4 text-center">
                <p className="font-display text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground font-medium mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* ═══════════════════════════════════════════
          SECTION 2 — Gestion des utilisateurs
          ═══════════════════════════════════════════ */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-teal" />
          <h2 className="font-display text-lg font-semibold">Gestion des utilisateurs</h2>
          {pendingCount > 0 && (
            <Badge className="bg-warning text-warning-foreground text-xs">{pendingCount} en attente</Badge>
          )}
        </div>

        <Card>
          <CardContent className="p-0">
            {registrations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Aucun utilisateur inscrit</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground">Nom</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Statut</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Inscrit le</th>
                      <th className="text-right px-6 py-3 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {registrations.map((reg) => {
                      const displayName = reg.account_type === "organisme"
                        ? reg.raison_sociale || reg.email
                        : `${reg.prenom || ""} ${reg.nom || ""}`.trim() || reg.email;
                      const statusColor = reg.status === "en_attente"
                        ? "bg-warning text-warning-foreground"
                        : reg.status === "actif"
                          ? "bg-success text-success-foreground"
                          : "bg-destructive text-destructive-foreground";
                      const statusLabel = reg.status === "en_attente" ? "En attente" : reg.status === "actif" ? "Actif" : "Désactivé";

                      return (
                        <tr key={reg.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-6 py-4 font-medium">{displayName}</td>
                          <td className="px-4 py-4 text-muted-foreground">{reg.email}</td>
                          <td className="px-4 py-4">
                            <Badge variant="outline" className="text-xs">{ACCOUNT_TYPE_LABELS[reg.account_type] || reg.account_type}</Badge>
                          </td>
                          <td className="px-4 py-4">
                            <Badge className={`text-xs ${statusColor}`}>{statusLabel}</Badge>
                          </td>
                          <td className="px-4 py-4 text-muted-foreground">
                            {new Date(reg.created_at).toLocaleDateString("fr-FR")}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {reg.status === "en_attente" && (
                              <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground gap-1"
                                onClick={() => activateRegistration(reg.id)}>
                                <CheckCircle className="w-3.5 h-3.5" />
                                Activer
                              </Button>
                            )}
                            {reg.status === "actif" && (
                              <Button size="sm" variant="outline" className="text-destructive gap-1"
                                onClick={() => deactivateRegistration(reg.id)}>
                                Désactiver
                              </Button>
                            )}
                            {reg.status === "désactivé" && (
                              <Button size="sm" variant="outline" className="gap-1"
                                onClick={() => activateRegistration(reg.id)}>
                                Réactiver
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* ═══════════════════════════════════════════
          SECTION 3 — Gestion des référentiels
          ═══════════════════════════════════════════ */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-teal" />
          <h2 className="font-display text-lg font-semibold">Gestion des référentiels</h2>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Nouveau référentiel…"
                value={newRef}
                onChange={(e) => setNewRef(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addRef()}
                className="max-w-xs"
              />
              <Button onClick={addRef} size="sm" className="bg-teal hover:bg-teal/90 text-primary-foreground gap-1">
                <Plus className="w-4 h-4" />
                Ajouter
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Référentiel</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Statut</th>
                    <th className="text-right px-6 py-3 font-medium text-muted-foreground">Activer / Désactiver</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {referentiels.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-3 font-medium">{r.name}</td>
                      <td className="px-4 py-3">
                        <Badge className={`text-xs ${r.active ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}`}>
                          {r.active ? "Actif" : "Désactivé"}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <Switch checked={r.active} onCheckedChange={() => toggleRef(r.id)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default DashboardAdmin;

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Users, BookOpen, Plus, CheckCircle, Clock, Building2 } from "lucide-react";
import { fetchAudits, fetchMissions, fetchRatings } from "@/lib/supabaseService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ManagedUser {
  email: string;
  name: string;
  role: string;
  company: string;
  active: boolean;
}

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

const INITIAL_USERS: ManagedUser[] = [
  { email: "marie.dupont@audit.io", name: "Marie Dupont", role: "Audité", company: "Écovert Industries", active: true },
  { email: "jean.martin@audit.io", name: "Jean Martin", role: "Auditeur", company: "Consultant ISO indépendant", active: true },
];

const INITIAL_REFS: Referentiel[] = [
  { id: "iso9001", name: "ISO 9001", active: true },
  { id: "iso14001", name: "ISO 14001", active: true },
  { id: "iso50001", name: "ISO 50001", active: true },
  { id: "iso45001", name: "ISO 45001", active: true },
  { id: "csrd", name: "CSRD", active: true },
];

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  audite: "Audité",
  auditeur: "Auditeur",
  organisme: "Organisme",
};

const DashboardAdmin: React.FC = () => {
  const [users, setUsers] = useState<ManagedUser[]>(INITIAL_USERS);
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
        const termines = missions.filter((m: any) => m.status === "clôture").length;

        let allScores: number[] = [];
        for (const m of missions) {
          try {
            const ratings = await fetchRatings(m.id);
            allScores.push(...ratings.map((r: any) => r.score));
          } catch {}
        }
        const avgScore = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;

        setStats({
          total: audits.length,
          enCours,
          termines,
          auditeursActifs: 1,
          auditesActifs: 1,
          avgScore: Math.round(avgScore * 10) / 10,
        });
      })
      .catch(() => toast.error("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, []);

  const toggleUser = (email: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.email === email ? { ...u, active: !u.active } : u))
    );
    toast.success("Statut utilisateur mis à jour");
  };

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
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Back-office Administrateur</h1>
        <p className="text-muted-foreground text-sm mt-1">Gestion globale de la plateforme</p>
      </div>

      {/* ── Reporting global ── */}
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

      {/* ── Demandes d'inscription ── */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-warning" />
            Demandes d'inscription
            {pendingCount > 0 && <Badge className="bg-warning text-warning-foreground text-xs">{pendingCount} en attente</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {registrations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Aucune demande d'inscription</p>
            </div>
          ) : (
            <div className="divide-y">
              {registrations.map((reg) => {
                const displayName = reg.account_type === "organisme"
                  ? reg.raison_sociale || reg.email
                  : `${reg.prenom || ""} ${reg.nom || ""}`.trim() || reg.email;
                const statusColor = reg.status === "en_attente"
                  ? "bg-warning text-warning-foreground"
                  : reg.status === "actif"
                    ? "bg-success text-success-foreground"
                    : "bg-destructive text-destructive-foreground";

                return (
                  <div key={reg.id} className="px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-semibold text-sm">{displayName}</span>
                        <Badge variant="outline" className="text-xs">{ACCOUNT_TYPE_LABELS[reg.account_type] || reg.account_type}</Badge>
                        <Badge className={`text-xs ${statusColor}`}>
                          {reg.status === "en_attente" ? "En attente" : reg.status === "actif" ? "Actif" : "Désactivé"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {reg.email} · Inscrit le {new Date(reg.created_at).toLocaleDateString("fr-FR")}
                        {reg.auditeur_statut && ` · ${reg.auditeur_statut}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
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
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Gestion des utilisateurs ── */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-teal" />
            Gestion des utilisateurs
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {users.map((u) => (
              <div key={u.email} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-sm">{u.name}</span>
                    <Badge variant="outline" className="text-xs">{u.role}</Badge>
                    <Badge className={`text-xs ${u.active ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"}`}>
                      {u.active ? "Actif" : "Désactivé"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{u.email} · {u.company}</p>
                </div>
                <Switch checked={u.active} onCheckedChange={() => toggleUser(u.email)} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Gestion des référentiels ── */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-navy" />
            Gestion des référentiels
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
          <div className="divide-y border rounded-lg">
            {referentiels.map((r) => (
              <div key={r.id} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{r.name}</span>
                  <Badge className={`text-xs ${r.active ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}`}>
                    {r.active ? "Actif" : "Désactivé"}
                  </Badge>
                </div>
                <Switch checked={r.active} onCheckedChange={() => toggleRef(r.id)} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardAdmin;

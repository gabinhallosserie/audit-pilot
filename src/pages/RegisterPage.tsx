import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, ArrowLeft, Upload, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const REFERENTIELS = ["ISO 9001", "ISO 14001", "ISO 50001", "ISO 45001", "CSRD"];
const SECTEURS = ["Industrie", "Services", "BTP", "Agroalimentaire", "Énergie", "Transport", "Santé", "Autre"];
const TAILLES = ["TPE (< 10)", "PME (10-250)", "ETI (250-5000)", "GE (> 5000)"];
const LANGUES = ["Français", "Anglais", "Espagnol", "Allemand", "Arabe", "Chinois"];

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("audite");
  const [submitting, setSubmitting] = useState(false);

  // Audité state
  const [audite, setAudite] = useState({
    raison_sociale: "", siret: "", secteur: "", taille: "",
    nom: "", prenom: "", email: "", phone: "",
    certifications: [] as string[],
  });

  // Auditeur state
  const [auditeur, setAuditeur] = useState({
    nom: "", prenom: "", email: "", phone: "",
    statut: "", zone: "", tarification: "",
    domaines: [] as string[], referentiels: [] as string[], langues: [] as string[],
  });
  const [auditeurFiles, setAuditeurFiles] = useState<File[]>([]);

  // Organisme state
  const [organisme, setOrganisme] = useState({
    raison_sociale: "", email: "", phone: "",
    auditeurs: [""] as string[], accreditations: [""] as string[],
  });

  const toggleArrayItem = (arr: string[], item: string) =>
    arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];

  const handleSubmitAudite = async () => {
    if (!audite.raison_sociale || !audite.email || !audite.nom || !audite.prenom) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("registration_accounts").insert({
      account_type: "audite",
      email: audite.email,
      phone: audite.phone || null,
      raison_sociale: audite.raison_sociale,
      siret: audite.siret || null,
      secteur: audite.secteur || null,
      taille: audite.taille || null,
      nom: audite.nom,
      prenom: audite.prenom,
      certifications_visees: audite.certifications.length > 0 ? audite.certifications : null,
    });
    setSubmitting(false);
    if (error) { toast.error("Erreur lors de l'inscription"); return; }
    toast.success("Demande d'inscription envoyée ! Un administrateur validera votre compte.");
    navigate("/");
  };

  const handleSubmitAuditeur = async () => {
    if (!auditeur.nom || !auditeur.prenom || !auditeur.email || !auditeur.statut) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    setSubmitting(true);

    // Upload justificatifs
    let paths: string[] = [];
    for (const file of auditeurFiles) {
      const filePath = `justificatifs/${crypto.randomUUID()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from("evidence").upload(filePath, file);
      if (!upErr) paths.push(filePath);
    }

    const { error } = await supabase.from("registration_accounts").insert({
      account_type: "auditeur",
      email: auditeur.email,
      phone: auditeur.phone || null,
      nom: auditeur.nom,
      prenom: auditeur.prenom,
      auditeur_statut: auditeur.statut,
      domaines_expertise: auditeur.domaines.length > 0 ? auditeur.domaines : null,
      referentiels_maitrises: auditeur.referentiels.length > 0 ? auditeur.referentiels : null,
      zone_geographique: auditeur.zone || null,
      langues: auditeur.langues.length > 0 ? auditeur.langues : null,
      tarification: auditeur.tarification || null,
      justificatifs_paths: paths.length > 0 ? paths : null,
    });
    setSubmitting(false);
    if (error) { toast.error("Erreur lors de l'inscription"); return; }
    toast.success("Demande d'inscription envoyée ! Un administrateur validera votre compte.");
    navigate("/");
  };

  const handleSubmitOrganisme = async () => {
    if (!organisme.raison_sociale || !organisme.email) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    setSubmitting(true);
    const filteredAuditeurs = organisme.auditeurs.filter((a) => a.trim());
    const filteredAccred = organisme.accreditations.filter((a) => a.trim());
    const { error } = await supabase.from("registration_accounts").insert({
      account_type: "organisme",
      email: organisme.email,
      phone: organisme.phone || null,
      raison_sociale: organisme.raison_sociale,
      auditeurs_rattaches: filteredAuditeurs.length > 0 ? filteredAuditeurs : null,
      accreditations: filteredAccred.length > 0 ? filteredAccred : null,
    });
    setSubmitting(false);
    if (error) { toast.error("Erreur lors de l'inscription"); return; }
    toast.success("Demande d'inscription envoyée ! Un administrateur validera votre compte.");
    navigate("/");
  };

  const addListItem = (setter: React.Dispatch<React.SetStateAction<any>>, field: string) => {
    setter((prev: any) => ({ ...prev, [field]: [...prev[field], ""] }));
  };

  const updateListItem = (setter: React.Dispatch<React.SetStateAction<any>>, field: string, index: number, value: string) => {
    setter((prev: any) => {
      const copy = [...prev[field]];
      copy[index] = value;
      return { ...prev, [field]: copy };
    });
  };

  const removeListItem = (setter: React.Dispatch<React.SetStateAction<any>>, field: string, index: number) => {
    setter((prev: any) => ({
      ...prev,
      [field]: prev[field].filter((_: any, i: number) => i !== index),
    }));
  };

  return (
    <div className="min-h-screen gradient-navy flex items-center justify-center p-4">
      <div className="w-full max-w-2xl animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-teal flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold text-primary-foreground tracking-tight">Créer un compte</h1>
          <p className="text-primary-foreground/60 text-sm mt-1">Choisissez votre type de compte</p>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardContent className="pt-6">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="w-full grid grid-cols-3 mb-6">
                <TabsTrigger value="audite">Audité</TabsTrigger>
                <TabsTrigger value="auditeur">Auditeur</TabsTrigger>
                <TabsTrigger value="organisme">Organisme</TabsTrigger>
              </TabsList>

              {/* ─── AUDITÉ ─── */}
              <TabsContent value="audite" className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Raison sociale *</Label>
                    <Input value={audite.raison_sociale} onChange={(e) => setAudite({ ...audite, raison_sociale: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>SIRET</Label>
                    <Input value={audite.siret} onChange={(e) => setAudite({ ...audite, siret: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Secteur d'activité</Label>
                    <Select value={audite.secteur} onValueChange={(v) => setAudite({ ...audite, secteur: v })}>
                      <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                      <SelectContent>{SECTEURS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Taille de structure</Label>
                    <Select value={audite.taille} onValueChange={(v) => setAudite({ ...audite, taille: v })}>
                      <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                      <SelectContent>{TAILLES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Nom *</Label>
                    <Input value={audite.nom} onChange={(e) => setAudite({ ...audite, nom: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Prénom *</Label>
                    <Input value={audite.prenom} onChange={(e) => setAudite({ ...audite, prenom: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Email *</Label>
                    <Input type="email" value={audite.email} onChange={(e) => setAudite({ ...audite, email: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Téléphone</Label>
                    <Input value={audite.phone} onChange={(e) => setAudite({ ...audite, phone: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Certifications visées (optionnel)</Label>
                  <div className="flex flex-wrap gap-2">
                    {REFERENTIELS.map((r) => (
                      <label key={r} className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <Checkbox
                          checked={audite.certifications.includes(r)}
                          onCheckedChange={() => setAudite({ ...audite, certifications: toggleArrayItem(audite.certifications, r) })}
                        />
                        {r}
                      </label>
                    ))}
                  </div>
                </div>
                <Button onClick={handleSubmitAudite} disabled={submitting} className="w-full bg-teal hover:bg-teal/90 text-primary-foreground font-semibold">
                  {submitting ? "Envoi…" : "Soumettre la demande"}
                </Button>
              </TabsContent>

              {/* ─── AUDITEUR ─── */}
              <TabsContent value="auditeur" className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Nom *</Label>
                    <Input value={auditeur.nom} onChange={(e) => setAuditeur({ ...auditeur, nom: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Prénom *</Label>
                    <Input value={auditeur.prenom} onChange={(e) => setAuditeur({ ...auditeur, prenom: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Email *</Label>
                    <Input type="email" value={auditeur.email} onChange={(e) => setAuditeur({ ...auditeur, email: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Téléphone</Label>
                    <Input value={auditeur.phone} onChange={(e) => setAuditeur({ ...auditeur, phone: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Statut *</Label>
                  <Select value={auditeur.statut} onValueChange={(v) => setAuditeur({ ...auditeur, statut: v })}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="indépendant">Indépendant</SelectItem>
                      <SelectItem value="organisme">Organisme</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Domaines d'expertise</Label>
                  <Input placeholder="Ex: Qualité, Environnement, Énergie (séparés par virgule)" value={auditeur.domaines.join(", ")}
                    onChange={(e) => setAuditeur({ ...auditeur, domaines: e.target.value.split(",").map((d) => d.trim()).filter(Boolean) })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Référentiels maîtrisés</Label>
                  <div className="flex flex-wrap gap-2">
                    {REFERENTIELS.map((r) => (
                      <label key={r} className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <Checkbox
                          checked={auditeur.referentiels.includes(r)}
                          onCheckedChange={() => setAuditeur({ ...auditeur, referentiels: toggleArrayItem(auditeur.referentiels, r) })}
                        />
                        {r}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Zone géographique</Label>
                    <Input value={auditeur.zone} onChange={(e) => setAuditeur({ ...auditeur, zone: e.target.value })} placeholder="Ex: France entière, Île-de-France" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tarification indicative</Label>
                    <Input value={auditeur.tarification} onChange={(e) => setAuditeur({ ...auditeur, tarification: e.target.value })} placeholder="Ex: 800€/jour" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Langues</Label>
                  <div className="flex flex-wrap gap-2">
                    {LANGUES.map((l) => (
                      <label key={l} className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <Checkbox
                          checked={auditeur.langues.includes(l)}
                          onCheckedChange={() => setAuditeur({ ...auditeur, langues: toggleArrayItem(auditeur.langues, l) })}
                        />
                        {l}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Justificatifs (certificats, CV en PDF)</Label>
                  <div className="flex items-center gap-2">
                    <Input type="file" accept=".pdf,.jpg,.jpeg,.png" multiple
                      onChange={(e) => { if (e.target.files) setAuditeurFiles(Array.from(e.target.files)); }} />
                  </div>
                  {auditeurFiles.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {auditeurFiles.map((f, i) => (
                        <Badge key={i} variant="outline" className="text-xs gap-1">
                          {f.name}
                          <X className="w-3 h-3 cursor-pointer" onClick={() => setAuditeurFiles((prev) => prev.filter((_, j) => j !== i))} />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <Button onClick={handleSubmitAuditeur} disabled={submitting} className="w-full bg-teal hover:bg-teal/90 text-primary-foreground font-semibold">
                  {submitting ? "Envoi…" : "Soumettre la demande"}
                </Button>
              </TabsContent>

              {/* ─── ORGANISME ─── */}
              <TabsContent value="organisme" className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Raison sociale *</Label>
                  <Input value={organisme.raison_sociale} onChange={(e) => setOrganisme({ ...organisme, raison_sociale: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Email *</Label>
                    <Input type="email" value={organisme.email} onChange={(e) => setOrganisme({ ...organisme, email: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Téléphone</Label>
                    <Input value={organisme.phone} onChange={(e) => setOrganisme({ ...organisme, phone: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Auditeurs rattachés</Label>
                  {organisme.auditeurs.map((a, i) => (
                    <div key={i} className="flex gap-2 mt-1">
                      <Input value={a} placeholder="Nom de l'auditeur"
                        onChange={(e) => updateListItem(setOrganisme, "auditeurs", i, e.target.value)} />
                      {organisme.auditeurs.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => removeListItem(setOrganisme, "auditeurs", i)}>
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="mt-1 gap-1" onClick={() => addListItem(setOrganisme, "auditeurs")}>
                    <Plus className="w-3 h-3" /> Ajouter un auditeur
                  </Button>
                </div>
                <div className="space-y-1.5">
                  <Label>Accréditations</Label>
                  {organisme.accreditations.map((a, i) => (
                    <div key={i} className="flex gap-2 mt-1">
                      <Input value={a} placeholder="Ex: COFRAC, UKAS"
                        onChange={(e) => updateListItem(setOrganisme, "accreditations", i, e.target.value)} />
                      {organisme.accreditations.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => removeListItem(setOrganisme, "accreditations", i)}>
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="mt-1 gap-1" onClick={() => addListItem(setOrganisme, "accreditations")}>
                    <Plus className="w-3 h-3" /> Ajouter une accréditation
                  </Button>
                </div>
                <Button onClick={handleSubmitOrganisme} disabled={submitting} className="w-full bg-teal hover:bg-teal/90 text-primary-foreground font-semibold">
                  {submitting ? "Envoi…" : "Soumettre la demande"}
                </Button>
              </TabsContent>
            </Tabs>

            <div className="mt-6 pt-4 border-t text-center">
              <button onClick={() => navigate("/")} className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                Retour à la connexion
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;

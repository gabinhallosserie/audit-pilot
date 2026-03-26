CREATE TABLE public.registration_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_type text NOT NULL, -- 'audite', 'auditeur', 'organisme'
  status text NOT NULL DEFAULT 'en_attente', -- 'en_attente', 'actif', 'désactivé'
  
  -- Common
  email text NOT NULL,
  phone text,
  
  -- Audité fields
  raison_sociale text,
  siret text,
  secteur text,
  taille text,
  nom text,
  prenom text,
  certifications_visees text[],
  
  -- Auditeur fields
  auditeur_statut text, -- 'indépendant', 'organisme'
  domaines_expertise text[],
  referentiels_maitrises text[],
  zone_geographique text,
  langues text[],
  tarification text,
  justificatifs_paths text[],
  
  -- Organisme fields
  auditeurs_rattaches text[],
  accreditations text[],
  
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.registration_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on registration_accounts" ON public.registration_accounts
  FOR ALL TO public USING (true) WITH CHECK (true);

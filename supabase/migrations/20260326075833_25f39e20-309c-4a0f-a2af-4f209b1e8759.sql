-- Create audits table
CREATE TABLE public.audits (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  referentiel TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planifié',
  date DATE NOT NULL,
  auditeur TEXT NOT NULL,
  audite TEXT NOT NULL,
  company TEXT NOT NULL,
  perimetre TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create missions table
CREATE TABLE public.missions (
  id TEXT PRIMARY KEY,
  audit_id TEXT NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  referentiel TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'préparation',
  date DATE NOT NULL,
  company TEXT NOT NULL,
  contact TEXT NOT NULL,
  plan_validated BOOLEAN NOT NULL DEFAULT false,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create findings table
CREATE TABLE public.findings (
  id TEXT PRIMARY KEY,
  mission_id TEXT NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  clause TEXT DEFAULT '',
  description TEXT NOT NULL,
  evidence TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create checklist_items table
CREATE TABLE public.checklist_items (
  id TEXT PRIMARY KEY,
  mission_id TEXT NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  clause TEXT NOT NULL,
  description TEXT NOT NULL,
  checked BOOLEAN NOT NULL DEFAULT false
);

-- Create audit_plan_processes table
CREATE TABLE public.audit_plan_processes (
  id TEXT PRIMARY KEY,
  mission_id TEXT NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  responsible TEXT DEFAULT '',
  date DATE,
  duration TEXT DEFAULT '1h',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create process_checklist_items table
CREATE TABLE public.process_checklist_items (
  id TEXT PRIMARY KEY,
  process_id TEXT NOT NULL REFERENCES public.audit_plan_processes(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  checked BOOLEAN NOT NULL DEFAULT false
);

-- Create opening_reports table (one per mission)
CREATE TABLE public.opening_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id TEXT NOT NULL UNIQUE REFERENCES public.missions(id) ON DELETE CASCADE,
  perimetre TEXT DEFAULT '',
  remarques TEXT DEFAULT '',
  agenda JSONB DEFAULT '[]'::jsonb,
  mission_started BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create opening_participants table
CREATE TABLE public.opening_participants (
  id TEXT PRIMARY KEY,
  mission_id TEXT NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT DEFAULT '',
  organisation TEXT DEFAULT ''
);

-- Enable RLS on all tables (permissive for POC - no real auth)
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_plan_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.process_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opening_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opening_participants ENABLE ROW LEVEL SECURITY;

-- Permissive policies for POC (simulated auth, no real Supabase auth)
CREATE POLICY "Allow all on audits" ON public.audits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on missions" ON public.missions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on findings" ON public.findings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on checklist_items" ON public.checklist_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on audit_plan_processes" ON public.audit_plan_processes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on process_checklist_items" ON public.process_checklist_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on opening_reports" ON public.opening_reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on opening_participants" ON public.opening_participants FOR ALL USING (true) WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_missions_audit_id ON public.missions(audit_id);
CREATE INDEX idx_findings_mission_id ON public.findings(mission_id);
CREATE INDEX idx_checklist_items_mission_id ON public.checklist_items(mission_id);
CREATE INDEX idx_audit_plan_processes_mission_id ON public.audit_plan_processes(mission_id);
CREATE INDEX idx_process_checklist_items_process_id ON public.process_checklist_items(process_id);
CREATE INDEX idx_opening_participants_mission_id ON public.opening_participants(mission_id);
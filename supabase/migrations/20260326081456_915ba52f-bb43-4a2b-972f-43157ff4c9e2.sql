
-- Finding attachments table
CREATE TABLE public.finding_attachments (
  id text PRIMARY KEY,
  finding_id text NOT NULL REFERENCES public.findings(id) ON DELETE CASCADE,
  mission_id text NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_path text NOT NULL,
  file_size integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.finding_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on finding_attachments" ON public.finding_attachments FOR ALL USING (true) WITH CHECK (true);

-- Signatures table
CREATE TABLE public.signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id text NOT NULL,
  signer_role text NOT NULL,
  signature_data text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(mission_id, signer_role)
);

ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on signatures" ON public.signatures FOR ALL USING (true) WITH CHECK (true);

-- Storage bucket for evidence files
INSERT INTO storage.buckets (id, name, public) VALUES ('evidence', 'evidence', true);

-- Storage RLS policies
CREATE POLICY "Allow public read on evidence" ON storage.objects FOR SELECT USING (bucket_id = 'evidence');
CREATE POLICY "Allow public insert on evidence" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'evidence');
CREATE POLICY "Allow public delete on evidence" ON storage.objects FOR DELETE USING (bucket_id = 'evidence');

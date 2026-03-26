
CREATE TABLE public.audit_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_type text NOT NULL,
  referentiel text NOT NULL,
  perimetre text NOT NULL DEFAULT '',
  desired_date date NOT NULL,
  estimated_duration text NOT NULL DEFAULT '',
  budget text DEFAULT '',
  status text NOT NULL DEFAULT 'en_attente',
  requester_email text NOT NULL,
  requester_name text NOT NULL,
  company text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on audit_requests" ON public.audit_requests FOR ALL USING (true) WITH CHECK (true);

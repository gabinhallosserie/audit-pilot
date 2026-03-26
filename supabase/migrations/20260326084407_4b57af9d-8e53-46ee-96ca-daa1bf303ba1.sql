CREATE TABLE public.audit_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_request_id uuid NOT NULL REFERENCES public.audit_requests(id) ON DELETE CASCADE,
  auditor_account_id uuid NOT NULL REFERENCES public.registration_accounts(id) ON DELETE CASCADE,
  auditor_email text NOT NULL,
  auditor_name text NOT NULL,
  requester_name text NOT NULL,
  requester_company text NOT NULL,
  referentiel text NOT NULL,
  status text NOT NULL DEFAULT 'en_attente',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on audit_invitations" ON public.audit_invitations
  FOR ALL TO public USING (true) WITH CHECK (true);

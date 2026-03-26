-- Corrective actions table
CREATE TABLE public.corrective_actions (
  id TEXT PRIMARY KEY,
  mission_id TEXT NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  finding_id TEXT NOT NULL REFERENCES public.findings(id) ON DELETE CASCADE,
  responsible TEXT NOT NULL DEFAULT '',
  deadline DATE,
  expected_evidence TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'en_cours',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Mutual ratings table
CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id TEXT NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  rater_role TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  comment TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (mission_id, rater_role)
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_role TEXT NOT NULL,
  mission_id TEXT REFERENCES public.missions(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.corrective_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Permissive policies for POC
CREATE POLICY "Allow all on corrective_actions" ON public.corrective_actions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on ratings" ON public.ratings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX idx_corrective_actions_mission ON public.corrective_actions(mission_id);
CREATE INDEX idx_corrective_actions_finding ON public.corrective_actions(finding_id);
CREATE INDEX idx_ratings_mission ON public.ratings(mission_id);
CREATE INDEX idx_notifications_role ON public.notifications(target_role);
CREATE INDEX idx_notifications_read ON public.notifications(read);
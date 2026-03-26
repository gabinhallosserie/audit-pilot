
CREATE TABLE public.mission_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id text NOT NULL,
  sender_name text NOT NULL,
  sender_role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mission_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on mission_messages" ON public.mission_messages FOR ALL USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.mission_messages;

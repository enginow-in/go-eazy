-- Migration: 20260714000100_messaging_system.sql
-- Description: Create conversations and messages tables for real-time chat between tenants and landlords.

-- 1. Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  landlord_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT conversations_unique UNIQUE (property_id, tenant_id, landlord_id)
);

-- Enable RLS on conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Conversations Policies
CREATE POLICY "Conversations select policy" ON public.conversations
  FOR SELECT USING (auth.uid() = tenant_id OR auth.uid() = landlord_id);

CREATE POLICY "Conversations insert policy" ON public.conversations
  FOR INSERT WITH CHECK (
    (auth.uid() = tenant_id AND EXISTS (
      SELECT 1 FROM public.unlocked_properties up 
      WHERE up.user_id = auth.uid() AND up.property_id = property_id
    )) OR (auth.uid() = landlord_id)
  );

-- 2. Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message_text text NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);

-- Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Messages Policies
CREATE POLICY "Messages select policy" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c 
      WHERE c.id = messages.conversation_id 
      AND (c.tenant_id = auth.uid() OR c.landlord_id = auth.uid())
    )
  );

CREATE POLICY "Messages insert policy" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND EXISTS (
      SELECT 1 FROM public.conversations c 
      WHERE c.id = messages.conversation_id 
      AND (c.tenant_id = auth.uid() OR c.landlord_id = auth.uid())
    )
  );

-- 3. Enable Realtime Replication
ALTER TABLE public.messages REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;

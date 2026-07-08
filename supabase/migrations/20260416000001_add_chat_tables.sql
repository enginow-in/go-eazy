-- 1. Add public_key to profiles for E2EE
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS public_key text;

-- 2. Create messages table for chat
CREATE TABLE IF NOT EXISTS messages (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
    sender_encrypted_content text NOT NULL,
    receiver_encrypted_content text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS on messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for messages
-- Policy: Users can read messages where they are the sender or the receiver
CREATE POLICY "Users can view their own messages" ON messages
    FOR SELECT USING (
        auth.uid() = sender_id OR auth.uid() = receiver_id
    );

-- Policy: Users can insert messages if they are the sender
CREATE POLICY "Users can insert messages" ON messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id
    );

-- 5. Realtime Publication
-- We need to ensure that the messages table is broadcasted via realtime
-- Note: 'supabase_realtime' publication usually exists, we add our table to it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE messages;
    END IF;
END
$$;

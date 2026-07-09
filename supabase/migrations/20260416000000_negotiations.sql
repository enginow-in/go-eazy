CREATE TYPE negotiation_status AS ENUM ('proposed', 'countered', 'accepted', 'rejected');

CREATE TABLE negotiations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    landlord_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    current_price NUMERIC NOT NULL,
    status negotiation_status DEFAULT 'proposed' NOT NULL,
    last_actor_id UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (property_id, tenant_id)
);

-- RLS Policies
ALTER TABLE negotiations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own negotiations" ON negotiations
  FOR SELECT USING (auth.uid() = tenant_id OR auth.uid() = landlord_id);

CREATE POLICY "Users can insert negotiations as tenant" ON negotiations
  FOR INSERT WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Users can update their negotiations" ON negotiations
  FOR UPDATE USING (auth.uid() = tenant_id OR auth.uid() = landlord_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE negotiations;

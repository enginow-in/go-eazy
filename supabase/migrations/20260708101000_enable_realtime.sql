-- Enable Postgres WAL logical replication for realtime on the properties table
ALTER PUBLICATION supabase_realtime ADD TABLE properties;

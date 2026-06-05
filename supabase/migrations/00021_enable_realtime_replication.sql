-- Enable Realtime replication for key tables
-- This allows clients to subscribe to changes in real-time

-- Enable replication for projects table
ALTER PUBLICATION supabase_realtime ADD TABLE projects;

-- Enable replication for clients table
ALTER PUBLICATION supabase_realtime ADD TABLE clients;

-- Enable replication for proposals table
ALTER PUBLICATION supabase_realtime ADD TABLE proposals;

-- Enable replication for invoices table
ALTER PUBLICATION supabase_realtime ADD TABLE invoices;

-- Enable replication for reports table
ALTER PUBLICATION supabase_realtime ADD TABLE reports;

-- Enable replication for audit_logs table
ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;

-- Enable replication for proposal_items table
ALTER PUBLICATION supabase_realtime ADD TABLE proposal_items;

-- Enable replication for invoice_items table
ALTER PUBLICATION supabase_realtime ADD TABLE invoice_items;

-- Enable replication for files table
ALTER PUBLICATION supabase_realtime ADD TABLE files;

-- Comment explaining the setup
COMMENT ON PUBLICATION supabase_realtime IS 'Realtime publication for live data synchronization across clients';

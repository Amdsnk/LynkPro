-- Create file_share_items junction table for multi-file shares
CREATE TABLE IF NOT EXISTS file_share_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id uuid NOT NULL REFERENCES file_shares(id) ON DELETE CASCADE,
  file_id uuid NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(share_id, file_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_file_share_items_share_id ON file_share_items(share_id);
CREATE INDEX IF NOT EXISTS idx_file_share_items_file_id ON file_share_items(file_id);

-- Enable RLS
ALTER TABLE file_share_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for file_share_items
CREATE POLICY "Users can view share items for their shares"
ON file_share_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM file_shares
    WHERE file_shares.id = file_share_items.share_id
    AND file_shares.created_by = auth.uid()
  )
);

CREATE POLICY "Users can insert share items for their shares"
ON file_share_items FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM file_shares
    WHERE file_shares.id = file_share_items.share_id
    AND file_shares.created_by = auth.uid()
  )
);

CREATE POLICY "Users can delete share items for their shares"
ON file_share_items FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM file_shares
    WHERE file_shares.id = file_share_items.share_id
    AND file_shares.created_by = auth.uid()
  )
);

-- Make file_id nullable in file_shares for multi-file shares
ALTER TABLE file_shares ALTER COLUMN file_id DROP NOT NULL;

-- Add is_bulk flag to file_shares
ALTER TABLE file_shares ADD COLUMN IF NOT EXISTS is_bulk boolean NOT NULL DEFAULT false;

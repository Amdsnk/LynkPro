-- Create file_versions table to store all versions of files
CREATE TABLE IF NOT EXISTS file_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  version integer NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(file_id, version)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_file_versions_file_id ON file_versions(file_id);
CREATE INDEX IF NOT EXISTS idx_file_versions_created_at ON file_versions(created_at DESC);

-- Enable RLS
ALTER TABLE file_versions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for file_versions table
CREATE POLICY "Users can view file versions from their firm's projects"
ON file_versions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM files
    JOIN projects ON projects.id = files.project_id
    WHERE files.id = file_versions.file_id
    AND projects.firm_id = (SELECT firm_id FROM profiles WHERE id = auth.uid())
  )
);

CREATE POLICY "Users can insert file versions to their firm's projects"
ON file_versions FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM files
    JOIN projects ON projects.id = files.project_id
    WHERE files.id = file_versions.file_id
    AND projects.firm_id = (SELECT firm_id FROM profiles WHERE id = auth.uid())
  )
);

CREATE POLICY "Users can delete file versions from their firm's projects"
ON file_versions FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM files
    JOIN projects ON projects.id = files.project_id
    WHERE files.id = file_versions.file_id
    AND projects.firm_id = (SELECT firm_id FROM profiles WHERE id = auth.uid())
  )
);

-- Create function to automatically create version history when file is updated
CREATE OR REPLACE FUNCTION create_file_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create version history if file_path or file_size changed
  IF OLD.file_path IS DISTINCT FROM NEW.file_path OR OLD.file_size IS DISTINCT FROM NEW.file_size THEN
    -- Insert old version into file_versions
    INSERT INTO file_versions (file_id, version, file_path, file_size, uploaded_by, created_at)
    VALUES (OLD.id, OLD.version, OLD.file_path, OLD.file_size, OLD.uploaded_by, OLD.updated_at);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create version history
DROP TRIGGER IF EXISTS trigger_create_file_version ON files;
CREATE TRIGGER trigger_create_file_version
  BEFORE UPDATE ON files
  FOR EACH ROW
  EXECUTE FUNCTION create_file_version();

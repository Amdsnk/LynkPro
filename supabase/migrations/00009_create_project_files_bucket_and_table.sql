-- Create storage bucket for project files
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', false)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload project files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project-files');

-- Create policy to allow users to read files from their firm's projects
CREATE POLICY "Users can read project files from their firm"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'project-files');

-- Create policy to allow users to update files
CREATE POLICY "Users can update project files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'project-files');

-- Create policy to allow users to delete files
CREATE POLICY "Users can delete project files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'project-files');

-- Create files table
CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES profiles(id),
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_files_project_id ON files(project_id);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON files(uploaded_by);

-- Enable RLS
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for files table
CREATE POLICY "Users can view files from their firm's projects"
ON files FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = files.project_id
    AND projects.firm_id = (SELECT firm_id FROM profiles WHERE id = auth.uid())
  )
);

CREATE POLICY "Users can insert files to their firm's projects"
ON files FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = files.project_id
    AND projects.firm_id = (SELECT firm_id FROM profiles WHERE id = auth.uid())
  )
);

CREATE POLICY "Users can update files from their firm's projects"
ON files FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = files.project_id
    AND projects.firm_id = (SELECT firm_id FROM profiles WHERE id = auth.uid())
  )
);

CREATE POLICY "Users can delete files from their firm's projects"
ON files FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = files.project_id
    AND projects.firm_id = (SELECT firm_id FROM profiles WHERE id = auth.uid())
  )
);

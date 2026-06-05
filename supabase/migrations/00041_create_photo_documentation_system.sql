-- Create project_photos table
CREATE TABLE IF NOT EXISTS project_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  photo_url text NOT NULL,
  photo_type text CHECK (photo_type IN ('progress', 'before', 'after', 'issue', 'completion', 'other')),
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  location_name text,
  taken_at timestamptz,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  tags text[],
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_project_photos_firm_id ON project_photos(firm_id);
CREATE INDEX IF NOT EXISTS idx_project_photos_project_id ON project_photos(project_id);
CREATE INDEX IF NOT EXISTS idx_project_photos_uploaded_by ON project_photos(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_project_photos_taken_at ON project_photos(taken_at DESC);

-- Enable RLS
ALTER TABLE project_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view firm project photos"
  ON project_photos
  FOR SELECT
  TO authenticated
  USING (
    firm_id IN (
      SELECT firm_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can upload project photos"
  ON project_photos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    firm_id IN (
      SELECT firm_id FROM profiles WHERE id = auth.uid()
    )
    AND uploaded_by = auth.uid()
  );

CREATE POLICY "Users can update their own photos"
  ON project_photos
  FOR UPDATE
  TO authenticated
  USING (uploaded_by = auth.uid())
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can delete their own photos"
  ON project_photos
  FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid());

-- Create storage bucket for project photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-photos', 'project-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload project photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'project-photos'
  );

CREATE POLICY "Users can view project photos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'project-photos');

CREATE POLICY "Users can delete their own project photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'project-photos');

COMMENT ON TABLE project_photos IS 'Photo documentation for projects with GPS tagging and categorization';
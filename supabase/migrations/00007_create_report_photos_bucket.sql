-- Create storage bucket for report photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('report-photos', 'report-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow authenticated users to upload photos
CREATE POLICY "Authenticated users can upload report photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'report-photos');

-- Create policy to allow public read access
CREATE POLICY "Public read access for report photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'report-photos');

-- Create policy to allow authenticated users to delete their own photos
CREATE POLICY "Users can delete their own report photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'report-photos');
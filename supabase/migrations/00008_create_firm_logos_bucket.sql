-- Create storage bucket for firm logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('firm-logos', 'firm-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow authenticated users to upload logos
CREATE POLICY "Authenticated users can upload firm logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'firm-logos');

-- Create policy to allow public read access
CREATE POLICY "Public read access for firm logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'firm-logos');

-- Create policy to allow authenticated users to update logos
CREATE POLICY "Authenticated users can update firm logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'firm-logos');

-- Create policy to allow authenticated users to delete logos
CREATE POLICY "Authenticated users can delete firm logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'firm-logos');
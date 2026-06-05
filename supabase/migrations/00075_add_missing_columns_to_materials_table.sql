-- Add missing columns to materials table

-- Add material_type column
ALTER TABLE materials 
ADD COLUMN IF NOT EXISTS material_type text;

-- Add project_id column
ALTER TABLE materials 
ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects(id);

-- Update existing materials with material types based on their names
UPDATE materials
SET material_type = CASE
  WHEN LOWER(name) LIKE '%concrete%' THEN 'concrete'
  WHEN LOWER(name) LIKE '%steel%' OR LOWER(name) LIKE '%rebar%' THEN 'steel'
  WHEN LOWER(name) LIKE '%lumber%' OR LOWER(name) LIKE '%wood%' THEN 'lumber'
  WHEN LOWER(name) LIKE '%electrical%' OR LOWER(name) LIKE '%wire%' THEN 'electrical'
  WHEN LOWER(name) LIKE '%plumbing%' OR LOWER(name) LIKE '%pipe%' THEN 'plumbing'
  WHEN LOWER(name) LIKE '%drywall%' THEN 'drywall'
  WHEN LOWER(name) LIKE '%insulation%' THEN 'insulation'
  WHEN LOWER(name) LIKE '%roof%' THEN 'roofing'
  WHEN LOWER(name) LIKE '%paint%' THEN 'paint'
  WHEN LOWER(name) LIKE '%hardware%' OR LOWER(name) LIKE '%nail%' OR LOWER(name) LIKE '%screw%' THEN 'hardware'
  ELSE 'hardware'
END
WHERE material_type IS NULL;

-- Assign materials to projects (distribute evenly across projects)
DO $$
DECLARE
  project_ids uuid[];
  material_record RECORD;
  project_index int := 0;
BEGIN
  -- Get all project IDs for the demo firm
  SELECT ARRAY_AGG(id) INTO project_ids
  FROM projects
  WHERE firm_id = '00000000-0000-0000-0000-000000000001';

  -- Update materials with project_id
  FOR material_record IN 
    SELECT id FROM materials WHERE project_id IS NULL
  LOOP
    UPDATE materials
    SET project_id = project_ids[(project_index % array_length(project_ids, 1)) + 1]
    WHERE id = material_record.id;
    
    project_index := project_index + 1;
  END LOOP;
END $$;
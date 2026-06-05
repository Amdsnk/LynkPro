-- Create proficiency level enum
CREATE TYPE proficiency_level AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');

-- Create task status enum
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- Create worker_skills table
CREATE TABLE IF NOT EXISTS worker_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  proficiency_level proficiency_level DEFAULT 'beginner',
  certifications JSONB DEFAULT '[]'::jsonb,
  years_experience INT DEFAULT 0,
  last_used DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create task_assignments table
CREATE TABLE IF NOT EXISTS task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  description TEXT,
  required_skills JSONB DEFAULT '[]'::jsonb,
  assigned_to UUID[] DEFAULT ARRAY[]::UUID[],
  start_date DATE,
  end_date DATE,
  status task_status DEFAULT 'pending',
  completion_percentage INT DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for worker_skills
CREATE INDEX IF NOT EXISTS idx_worker_skills_firm ON worker_skills(firm_id);
CREATE INDEX IF NOT EXISTS idx_worker_skills_user ON worker_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_worker_skills_skill_name ON worker_skills(skill_name);
CREATE INDEX IF NOT EXISTS idx_worker_skills_proficiency ON worker_skills(proficiency_level);

-- Create indexes for task_assignments
CREATE INDEX IF NOT EXISTS idx_task_assignments_firm ON task_assignments(firm_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_project ON task_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_status ON task_assignments(status);
CREATE INDEX IF NOT EXISTS idx_task_assignments_start_date ON task_assignments(start_date);
CREATE INDEX IF NOT EXISTS idx_task_assignments_end_date ON task_assignments(end_date);

-- Enable RLS
ALTER TABLE worker_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for worker_skills
CREATE POLICY "Users can view skills from their firm"
  ON worker_skills FOR SELECT
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create skills for their firm"
  ON worker_skills FOR INSERT
  WITH CHECK (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update skills from their firm"
  ON worker_skills FOR UPDATE
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete skills from their firm"
  ON worker_skills FOR DELETE
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

-- RLS Policies for task_assignments
CREATE POLICY "Users can view task assignments from their firm"
  ON task_assignments FOR SELECT
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create task assignments for their firm"
  ON task_assignments FOR INSERT
  WITH CHECK (
    firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid())
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update task assignments from their firm"
  ON task_assignments FOR UPDATE
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete task assignments from their firm"
  ON task_assignments FOR DELETE
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

-- Update triggers
CREATE OR REPLACE FUNCTION update_worker_skills_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_worker_skills_updated_at
  BEFORE UPDATE ON worker_skills
  FOR EACH ROW
  EXECUTE FUNCTION update_worker_skills_updated_at();

CREATE OR REPLACE FUNCTION update_task_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_task_assignments_updated_at
  BEFORE UPDATE ON task_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_task_assignments_updated_at();
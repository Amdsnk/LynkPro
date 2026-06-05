-- Create report_comments table
CREATE TABLE report_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_comment_id uuid REFERENCES report_comments(id) ON DELETE CASCADE,
  
  -- Text selection information
  field_name text NOT NULL CHECK (field_name IN ('field_notes', 'narrative')),
  selection_start integer NOT NULL CHECK (selection_start >= 0),
  selection_end integer NOT NULL CHECK (selection_end >= selection_start),
  selected_text text NOT NULL,
  
  -- Comment content
  comment_text text NOT NULL CHECK (length(comment_text) > 0),
  is_resolved boolean NOT NULL DEFAULT false,
  resolved_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create comment_mentions table
CREATE TABLE comment_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES report_comments(id) ON DELETE CASCADE,
  mentioned_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(comment_id, mentioned_user_id)
);

-- Create indexes for performance
CREATE INDEX idx_report_comments_report_id ON report_comments(report_id);
CREATE INDEX idx_report_comments_user_id ON report_comments(user_id);
CREATE INDEX idx_report_comments_parent_id ON report_comments(parent_comment_id);
CREATE INDEX idx_report_comments_created_at ON report_comments(created_at DESC);
CREATE INDEX idx_comment_mentions_user_id ON comment_mentions(mentioned_user_id);
CREATE INDEX idx_comment_mentions_is_read ON comment_mentions(is_read) WHERE is_read = false;

-- Create updated_at trigger for report_comments
CREATE TRIGGER update_report_comments_updated_at
  BEFORE UPDATE ON report_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Realtime for report_comments
ALTER PUBLICATION supabase_realtime ADD TABLE report_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE comment_mentions;

-- RLS Policies for report_comments
ALTER TABLE report_comments ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view comments on reports they can access
CREATE POLICY "Users can view comments on accessible reports"
  ON report_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM reports r
      WHERE r.id = report_comments.report_id
      AND r.firm_id = (SELECT firm_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Users can create comments on reports they can access
CREATE POLICY "Users can create comments on accessible reports"
  ON report_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM reports r
      WHERE r.id = report_id
      AND r.firm_id = (SELECT firm_id FROM profiles WHERE id = auth.uid())
    )
    AND user_id = auth.uid()
  );

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
  ON report_comments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
  ON report_comments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for comment_mentions
ALTER TABLE comment_mentions ENABLE ROW LEVEL SECURITY;

-- Users can view their own mentions
CREATE POLICY "Users can view their own mentions"
  ON comment_mentions FOR SELECT
  TO authenticated
  USING (mentioned_user_id = auth.uid());

-- Users can create mentions when creating comments
CREATE POLICY "Users can create mentions"
  ON comment_mentions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM report_comments rc
      WHERE rc.id = comment_id
      AND rc.user_id = auth.uid()
    )
  );

-- Users can update their own mention read status
CREATE POLICY "Users can update their own mentions"
  ON comment_mentions FOR UPDATE
  TO authenticated
  USING (mentioned_user_id = auth.uid())
  WITH CHECK (mentioned_user_id = auth.uid());
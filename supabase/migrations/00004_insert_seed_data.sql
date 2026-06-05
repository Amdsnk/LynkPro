-- Insert default proposal templates (will be associated with firms when they're created)
-- Note: These are placeholder templates that will be copied to each firm

-- Insert default disclaimer for field reports
CREATE TABLE IF NOT EXISTS public.system_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO system_settings (key, value) VALUES 
('default_report_disclaimer', 'This field review report is provided for informational purposes only and does not constitute a comprehensive inspection or warranty. The observations and recommendations contained herein are based on visual inspection and professional judgment at the time of the site visit. The firm assumes no liability for conditions not visible or apparent during the review. This report should not be relied upon as the sole basis for construction, design, or financial decisions without further investigation and verification by qualified professionals.');
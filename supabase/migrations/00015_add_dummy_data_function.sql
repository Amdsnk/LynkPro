-- Create a function to add dummy data that respects RLS
CREATE OR REPLACE FUNCTION add_dummy_analytics_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_firm_id uuid;
  v_client_id uuid;
  v_project_id uuid;
  v_file_ids uuid[];
  v_share_ids uuid[];
BEGIN
  -- Get current user or create a system user reference
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No authenticated user found. Please log in first.';
  END IF;

  -- Get or create firm
  SELECT id INTO v_firm_id FROM firms WHERE created_by = v_user_id LIMIT 1;
  IF v_firm_id IS NULL THEN
    INSERT INTO firms (name, created_at, created_by)
    VALUES ('Demo Architecture Firm', NOW() - INTERVAL '180 days', v_user_id)
    RETURNING id INTO v_firm_id;
  END IF;

  -- Create client
  INSERT INTO clients (firm_id, name, email, phone, created_by, created_at)
  VALUES (v_firm_id, 'Demo Client Corp', 'demo@client.com', '+1-555-0100', v_user_id, NOW() - INTERVAL '150 days')
  RETURNING id INTO v_client_id;

  -- Create project
  INSERT INTO projects (firm_id, client_id, name, description, status, created_by, created_at, updated_at)
  VALUES (
    v_firm_id,
    v_client_id,
    'Downtown Office Tower',
    'Modern 25-story office building with advanced MEP systems',
    'active',
    v_user_id,
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '5 days'
  )
  RETURNING id INTO v_project_id;

  -- Create files
  WITH file_inserts AS (
    INSERT INTO files (project_id, file_name, file_path, file_size, mime_type, uploaded_by, created_at)
    VALUES
      (v_project_id, 'Floor_Plans_Level_1-5.pdf', 'projects/downtown/Floor_Plans_Level_1-5.pdf', 15728640, 'application/pdf', v_user_id, NOW() - INTERVAL '85 days'),
      (v_project_id, 'Structural_Calculations.xlsx', 'projects/downtown/Structural_Calculations.xlsx', 2097152, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', v_user_id, NOW() - INTERVAL '80 days'),
      (v_project_id, 'Building_Model_Rev3.rvt', 'projects/downtown/Building_Model_Rev3.rvt', 104857600, 'application/octet-stream', v_user_id, NOW() - INTERVAL '75 days'),
      (v_project_id, 'Site_Plan.dwg', 'projects/downtown/Site_Plan.dwg', 8388608, 'application/acad', v_user_id, NOW() - INTERVAL '70 days'),
      (v_project_id, 'MEP_Specifications.docx', 'projects/downtown/MEP_Specifications.docx', 1048576, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', v_user_id, NOW() - INTERVAL '65 days'),
      (v_project_id, 'Facade_Details.pdf', 'projects/downtown/Facade_Details.pdf', 20971520, 'application/pdf', v_user_id, NOW() - INTERVAL '60 days'),
      (v_project_id, 'Cost_Estimate_Q2.xlsx', 'projects/downtown/Cost_Estimate_Q2.xlsx', 3145728, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', v_user_id, NOW() - INTERVAL '55 days'),
      (v_project_id, 'Foundation_Plans.pdf', 'projects/downtown/Foundation_Plans.pdf', 12582912, 'application/pdf', v_user_id, NOW() - INTERVAL '50 days'),
      (v_project_id, 'HVAC_Layout.dwg', 'projects/downtown/HVAC_Layout.dwg', 6291456, 'application/acad', v_user_id, NOW() - INTERVAL '45 days'),
      (v_project_id, 'Project_Schedule.pdf', 'projects/downtown/Project_Schedule.pdf', 2621440, 'application/pdf', v_user_id, NOW() - INTERVAL '40 days'),
      (v_project_id, 'Electrical_Schematics.pdf', 'projects/downtown/Electrical_Schematics.pdf', 9437184, 'application/pdf', v_user_id, NOW() - INTERVAL '35 days'),
      (v_project_id, 'Interior_Renderings.pdf', 'projects/downtown/Interior_Renderings.pdf', 31457280, 'application/pdf', v_user_id, NOW() - INTERVAL '30 days'),
      (v_project_id, 'Plumbing_Details.dwg', 'projects/downtown/Plumbing_Details.dwg', 5242880, 'application/acad', v_user_id, NOW() - INTERVAL '25 days'),
      (v_project_id, 'Fire_Safety_Plan.pdf', 'projects/downtown/Fire_Safety_Plan.pdf', 7340032, 'application/pdf', v_user_id, NOW() - INTERVAL '20 days'),
      (v_project_id, 'Landscape_Design.pdf', 'projects/downtown/Landscape_Design.pdf', 18874368, 'application/pdf', v_user_id, NOW() - INTERVAL '15 days')
    RETURNING id
  )
  SELECT array_agg(id) INTO v_file_ids FROM file_inserts;

  -- Create file shares with various states
  WITH share_inserts AS (
    INSERT INTO file_shares (
      file_id, share_token, created_by, shared_with_email, expires_at, 
      permission_level, view_count, is_bulk, auto_renew, expiration_duration, created_at, updated_at
    )
    VALUES
      -- Active shares
      (v_file_ids[1], 'share_' || gen_random_uuid(), v_user_id, 'client1@example.com', NOW() + INTERVAL '30 days', 'view', 15, false, true, 30, NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days'),
      (v_file_ids[2], 'share_' || gen_random_uuid(), v_user_id, 'engineer@example.com', NOW() + INTERVAL '45 days', 'download', 8, false, false, NULL, NOW() - INTERVAL '55 days', NOW() - INTERVAL '55 days'),
      (v_file_ids[3], 'share_' || gen_random_uuid(), v_user_id, NULL, NOW() + INTERVAL '60 days', 'view', 23, false, true, 60, NOW() - INTERVAL '50 days', NOW() - INTERVAL '50 days'),
      (v_file_ids[4], 'share_' || gen_random_uuid(), v_user_id, 'contractor@example.com', NOW() + INTERVAL '15 days', 'download', 12, false, false, NULL, NOW() - INTERVAL '45 days', NOW() - INTERVAL '45 days'),
      (v_file_ids[5], 'share_' || gen_random_uuid(), v_user_id, 'consultant@example.com', NOW() + INTERVAL '90 days', 'view', 6, false, true, 90, NOW() - INTERVAL '40 days', NOW() - INTERVAL '40 days'),
      -- Expiring soon
      (v_file_ids[6], 'share_' || gen_random_uuid(), v_user_id, 'reviewer@example.com', NOW() + INTERVAL '3 days', 'view', 19, false, false, NULL, NOW() - INTERVAL '35 days', NOW() - INTERVAL '35 days'),
      (v_file_ids[7], 'share_' || gen_random_uuid(), v_user_id, NULL, NOW() + INTERVAL '5 days', 'download', 11, false, false, NULL, NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
      -- Expired shares
      (v_file_ids[8], 'share_' || gen_random_uuid(), v_user_id, 'oldclient@example.com', NOW() - INTERVAL '10 days', 'view', 7, false, false, NULL, NOW() - INTERVAL '40 days', NOW() - INTERVAL '40 days'),
      (v_file_ids[9], 'share_' || gen_random_uuid(), v_user_id, 'partner@example.com', NOW() - INTERVAL '5 days', 'download', 4, false, false, NULL, NOW() - INTERVAL '35 days', NOW() - INTERVAL '35 days'),
      (v_file_ids[10], 'share_' || gen_random_uuid(), v_user_id, NULL, NOW() - INTERVAL '20 days', 'view', 2, false, false, NULL, NOW() - INTERVAL '50 days', NOW() - INTERVAL '50 days'),
      -- Bulk shares
      (NULL, 'bulk_' || gen_random_uuid(), v_user_id, 'team@example.com', NOW() + INTERVAL '30 days', 'download', 31, true, false, NULL, NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days'),
      (NULL, 'bulk_' || gen_random_uuid(), v_user_id, NULL, NOW() + INTERVAL '60 days', 'view', 18, true, true, 60, NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days')
    RETURNING id
  )
  SELECT array_agg(id) INTO v_share_ids FROM share_inserts;

  -- Create bulk share items for the bulk shares
  INSERT INTO file_share_items (share_id, file_id)
  SELECT v_share_ids[11], unnest(v_file_ids[1:5]);
  
  INSERT INTO file_share_items (share_id, file_id)
  SELECT v_share_ids[12], unnest(v_file_ids[6:10]);

  -- Create access logs with various devices and actions
  INSERT INTO share_access_logs (share_id, action, accessed_at, ip_address, user_agent)
  SELECT 
    v_share_ids[i],
    CASE WHEN random() < 0.6 THEN 'view' ELSE 'download' END,
    NOW() - (random() * INTERVAL '60 days'),
    '192.168.' || floor(random() * 255)::int || '.' || floor(random() * 255)::int,
    CASE floor(random() * 5)::int
      WHEN 0 THEN 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      WHEN 1 THEN 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      WHEN 2 THEN 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
      WHEN 3 THEN 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
      ELSE 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    END
  FROM generate_series(1, 10) i, generate_series(1, 3) j
  WHERE i <= array_length(v_share_ids, 1);

  -- Create email templates
  INSERT INTO email_templates (user_id, name, subject, message, formats, created_at, updated_at)
  VALUES
    (v_user_id, 'Weekly Progress Report', 'LynkPro Weekly Analytics - Week of {{date}}', 'Hi team,

Please find attached the weekly analytics report for our file sharing activity. This report includes key metrics and insights from the past 7 days.

Best regards,
Project Management Team', ARRAY['pdf', 'excel'], NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
    (v_user_id, 'Monthly Summary', 'Monthly Share Analytics Summary - {{month}}', 'Dear stakeholders,

Attached is the comprehensive monthly analytics report showing all file sharing activity, access patterns, and key performance indicators.

Please review and let us know if you have any questions.

Regards,
Analytics Team', ARRAY['pdf', 'csv', 'excel'], NOW() - INTERVAL '25 days', NOW() - INTERVAL '10 days'),
    (v_user_id, 'Client Report', 'LynkPro Share Analytics Report', 'Hello,

As requested, please find the analytics report for your review. This includes detailed information about file access and download statistics.

Feel free to reach out if you need any clarification.

Best,
Account Manager', ARRAY['pdf'], NOW() - INTERVAL '20 days', NOW() - INTERVAL '5 days'),
    (v_user_id, 'Quick Stats', 'Quick Analytics Snapshot', NULL, ARRAY['csv'], NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
    (v_user_id, 'Executive Summary', 'Executive Analytics Dashboard - {{quarter}}', 'Executive Team,

Quarterly analytics summary attached. Key highlights:
- Total shares and growth trends
- User engagement metrics  
- Download conversion rates

Review at your convenience.

Analytics Department', ARRAY['pdf', 'excel'], NOW() - INTERVAL '10 days', NOW() - INTERVAL '2 days');

  RAISE NOTICE 'Dummy data created successfully!';
  RAISE NOTICE 'Files created: %', array_length(v_file_ids, 1);
  RAISE NOTICE 'Shares created: %', array_length(v_share_ids, 1);
  RAISE NOTICE 'Templates created: 5';
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION add_dummy_analytics_data() TO authenticated;

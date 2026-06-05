-- Add productivity metrics and project photos demo data

DO $$
DECLARE
  demo_firm_id uuid := '00000000-0000-0000-0000-000000000001';
  demo_project_1 uuid := '00000000-0000-0000-0000-000000000020';
  demo_project_2 uuid := '00000000-0000-0000-0000-000000000021';
  demo_project_3 uuid := '00000000-0000-0000-0000-000000000022';
  pm_user_id uuid;
  field_user_id uuid;
BEGIN
  SELECT id INTO pm_user_id FROM profiles WHERE email = 'pm@lynkpro.com' LIMIT 1;
  SELECT id INTO field_user_id FROM profiles WHERE email = 'field@lynkpro.com' LIMIT 1;

  IF pm_user_id IS NOT NULL THEN

    -- Productivity Metrics
    INSERT INTO productivity_metrics (id, firm_id, project_id, date, trade, hours_worked, units_completed, unit_type, productivity_rate, weather_condition, notes, created_by)
    VALUES
      (gen_random_uuid(), demo_firm_id, demo_project_1, CURRENT_DATE - 7, 'Structural', 76.0, 12, 'beams', 6.33, 'Clear', 'Excellent progress on steel framing', field_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_1, CURRENT_DATE - 6, 'Structural', 64.0, 10, 'beams', 6.40, 'Partly Cloudy', 'Good productivity, minor weather delays', field_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_1, CURRENT_DATE - 5, 'Structural', 80.0, 14, 'beams', 5.71, 'Clear', 'Outstanding day, all targets met', field_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_2, CURRENT_DATE - 7, 'HVAC', 64.0, 8, 'units', 8.00, 'Clear', 'HVAC coordination meetings', pm_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_2, CURRENT_DATE - 6, 'Electrical', 72.0, 12, 'circuits', 6.00, 'Clear', 'Electrical work progressing well', pm_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_3, CURRENT_DATE - 7, 'Sitework', 80.0, 450, 'cubic_yards', 5.63, 'Clear', 'Excavation work completed ahead of schedule', field_user_id),
      (gen_random_uuid(), demo_firm_id, demo_project_3, CURRENT_DATE - 6, 'Concrete', 76.0, 120, 'cubic_yards', 6.33, 'Clear', 'Foundation forms installation', field_user_id)
    ON CONFLICT DO NOTHING;

    -- Project Photos
    INSERT INTO project_photos (id, firm_id, project_id, uploaded_by, title, description, photo_url, photo_type, taken_at, tags)
    VALUES
      (gen_random_uuid(), demo_firm_id, demo_project_1, pm_user_id, 'Foundation Complete', 'Foundation concrete work - excellent quality',
       'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_cb1e1f64-ef9d-4082-b62e-0423c839ed10.jpg',
       'progress', CURRENT_DATE - 25, ARRAY['foundation', 'concrete']),
      
      (gen_random_uuid(), demo_firm_id, demo_project_1, field_user_id, 'Steel Erection', 'Steel beam installation in progress',
       'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_20bacd36-1454-4899-8079-cff3f985439a.jpg',
       'progress', CURRENT_DATE - 10, ARRAY['structural', 'steel']),
      
      (gen_random_uuid(), demo_firm_id, demo_project_1, field_user_id, 'Electrical Rough-In', 'Electrical rough-in second floor',
       'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_d4b6ec98-3695-42d3-ad9b-fd4f2b1f5c14.jpg',
       'progress', CURRENT_DATE - 2, ARRAY['electrical', 'mep']),
      
      (gen_random_uuid(), demo_firm_id, demo_project_2, pm_user_id, 'HVAC Complete', 'New HVAC system installation complete',
       'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_b62f415b-e6d4-46f8-b592-cd4b805c096e.jpg',
       'completion', CURRENT_DATE - 15, ARRAY['hvac', 'mechanical']),
      
      (gen_random_uuid(), demo_firm_id, demo_project_2, pm_user_id, 'Lobby Renovation', 'Lobby renovation - marble flooring',
       'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_de2ab686-15e9-435a-861e-8acfc09fa2b3.jpg',
       'progress', CURRENT_DATE - 5, ARRAY['interior', 'finishes', 'lobby']),
      
      (gen_random_uuid(), demo_firm_id, demo_project_3, field_user_id, 'Site Grading', 'Site grading operations complete',
       'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_e19f1f05-f1b5-4610-90c0-59492c57f2cf.jpg',
       'completion', CURRENT_DATE - 20, ARRAY['sitework', 'grading']),
      
      (gen_random_uuid(), demo_firm_id, demo_project_3, field_user_id, 'Foundation Excavation', 'Foundation excavation with shoring',
       'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_daecd1a9-d667-4dca-a484-b278dd1853d7.jpg',
       'progress', CURRENT_DATE - 8, ARRAY['excavation', 'foundation', 'safety'])
    ON CONFLICT DO NOTHING;

  END IF;
END $$;
-- Add demo field reports

DO $$
DECLARE
  demo_firm_id uuid;
  demo_user_id uuid;
  demo_project_id uuid;
  demo_project_id_2 uuid;
  report_id_1 uuid;
  report_id_2 uuid;
  report_id_3 uuid;
BEGIN
  -- Get IDs
  SELECT id INTO demo_firm_id FROM firms LIMIT 1;
  SELECT id INTO demo_user_id FROM profiles WHERE firm_id = demo_firm_id LIMIT 1;
  SELECT id INTO demo_project_id FROM projects WHERE firm_id = demo_firm_id ORDER BY created_at LIMIT 1;
  SELECT id INTO demo_project_id_2 FROM projects WHERE firm_id = demo_firm_id ORDER BY created_at OFFSET 1 LIMIT 1;

  -- Add field reports if table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'field_reports') THEN
    IF demo_project_id IS NOT NULL AND demo_user_id IS NOT NULL THEN
      -- Report 1: Site Inspection
      INSERT INTO field_reports (
        firm_id, project_id, created_by, title, report_type, weather_conditions,
        temperature, observations, recommendations, safety_notes, created_at
      ) VALUES (
        demo_firm_id, demo_project_id, demo_user_id,
        'Weekly Site Inspection - Foundation Phase',
        'inspection',
        'Clear skies, light breeze',
        '72°F',
        'Foundation work progressing well. Concrete pour completed yesterday with proper curing procedures in place. Rebar placement inspected and approved. Forms are secure and level. Site drainage adequate. No standing water observed. Equipment in good working condition. Material storage organized and protected from weather.',
        '1. Schedule city inspector for foundation approval before proceeding to framing. 2. Order structural steel for next phase - lead time 2 weeks. 3. Coordinate with electrical contractor for underground conduit installation. 4. Review updated architectural drawings for any changes.',
        'All workers wearing proper PPE. Fall protection systems in place. Excavation properly shored. No safety violations observed. Daily toolbox talks being conducted. First aid station stocked and accessible.',
        now() - interval '5 days'
      ) RETURNING id INTO report_id_1;

      -- Report 2: Progress Update
      INSERT INTO field_reports (
        firm_id, project_id, created_by, title, report_type, weather_conditions,
        temperature, observations, recommendations, safety_notes, created_at
      ) VALUES (
        demo_firm_id, demo_project_id, demo_user_id,
        'Mid-Week Progress Report',
        'progress',
        'Partly cloudy, humid',
        '78°F',
        'Framing crew made excellent progress this week. Second floor deck completed. Wall framing 75% complete. Plumbing rough-in started in completed sections. HVAC contractor on site for ductwork layout. Windows delivered and stored on site. Roofing materials scheduled for delivery next Monday.',
        'Coordinate final electrical walk-through with architect. Confirm window installation schedule. Review change order for additional outlets in master bedroom. Schedule drywall delivery for next phase.',
        'Scaffolding inspected and tagged. Ladder safety training completed for new crew members. Fire extinguishers checked and accessible. Emergency contact numbers posted at site entrance.',
        now() - interval '2 days'
      ) RETURNING id INTO report_id_2;

      -- Report 3: Quality Check
      INSERT INTO field_reports (
        firm_id, project_id, created_by, title, report_type, weather_conditions,
        temperature, observations, recommendations, safety_notes, created_at
      ) VALUES (
        demo_firm_id, demo_project_id_2, demo_user_id,
        'Quality Control Inspection',
        'quality_check',
        'Overcast, light rain',
        '65°F',
        'Conducted detailed quality inspection of completed work. Drywall finish meets specifications. Paint application even and consistent. Trim work properly installed and caulked. Flooring installation excellent quality. Fixtures properly aligned and functional. Minor punch list items identified and documented.',
        'Address punch list items before final inspection. Touch up paint in stairwell. Adjust cabinet door alignment in kitchen. Replace cracked floor tile in bathroom. Clean and test all plumbing fixtures.',
        'Wet floor signs posted in areas with recent cleaning. Proper ventilation maintained during painting. VOC-compliant materials used throughout. Dust containment measures effective.',
        now() - interval '1 day'
      ) RETURNING id INTO report_id_3;

      -- Add audit logs for reports
      INSERT INTO audit_logs (firm_id, entity_type, entity_id, action, details, user_id, created_at) VALUES
      (demo_firm_id, 'field_report', report_id_1, 'created', '{"title": "Weekly Site Inspection", "type": "inspection"}', demo_user_id, now() - interval '5 days'),
      (demo_firm_id, 'field_report', report_id_2, 'created', '{"title": "Mid-Week Progress Report", "type": "progress"}', demo_user_id, now() - interval '2 days'),
      (demo_firm_id, 'field_report', report_id_3, 'created', '{"title": "Quality Control Inspection", "type": "quality_check"}', demo_user_id, now() - interval '1 day');
    END IF;
  END IF;

  -- Add documents with correct structure
  IF demo_project_id IS NOT NULL AND demo_user_id IS NOT NULL THEN
    INSERT INTO documents (
      firm_id, entity_type, entity_id, uploaded_by, name, file_path, mime_type, file_size, created_at
    ) VALUES
    (demo_firm_id, 'project', demo_project_id, demo_user_id, 'Structural Drawings - Rev 3.pdf', 'documents/structural_drawings_rev3.pdf', 'application/pdf', 2457600, now() - interval '10 days'),
    (demo_firm_id, 'project', demo_project_id, demo_user_id, 'Building Permit.pdf', 'documents/building_permit.pdf', 'application/pdf', 524288, now() - interval '25 days'),
    (demo_firm_id, 'project', demo_project_id, demo_user_id, 'Site Photos - Week 4.zip', 'documents/site_photos_week4.zip', 'application/zip', 15728640, now() - interval '7 days'),
    (demo_firm_id, 'project', demo_project_id, demo_user_id, 'Material Specifications.xlsx', 'documents/material_specs.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 102400, now() - interval '15 days'),
    (demo_firm_id, 'project', demo_project_id_2, demo_user_id, 'Change Order #3.pdf', 'documents/change_order_3.pdf', 'application/pdf', 204800, now() - interval '3 days'),
    (demo_firm_id, 'project', demo_project_id_2, demo_user_id, 'Inspection Report.pdf', 'documents/inspection_report.pdf', 'application/pdf', 409600, now() - interval '5 days');
  END IF;

END $$;

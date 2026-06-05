-- Add comprehensive demo data for all features

DO $$
DECLARE
  demo_firm_id uuid;
  demo_user_id uuid;
  demo_client_id uuid;
  demo_project_id uuid;
  demo_project_id_2 uuid;
  demo_project_id_3 uuid;
BEGIN
  -- Get first firm and user
  SELECT id INTO demo_firm_id FROM firms LIMIT 1;
  SELECT id INTO demo_user_id FROM profiles WHERE firm_id = demo_firm_id LIMIT 1;
  SELECT id INTO demo_client_id FROM clients WHERE firm_id = demo_firm_id LIMIT 1;
  
  -- Get existing projects
  SELECT id INTO demo_project_id FROM projects WHERE firm_id = demo_firm_id ORDER BY created_at LIMIT 1;
  SELECT id INTO demo_project_id_2 FROM projects WHERE firm_id = demo_firm_id ORDER BY created_at OFFSET 1 LIMIT 1;
  SELECT id INTO demo_project_id_3 FROM projects WHERE firm_id = demo_firm_id ORDER BY created_at OFFSET 2 LIMIT 1;

  -- Update projects with detailed notes
  IF demo_project_id IS NOT NULL THEN
    UPDATE projects 
    SET internal_notes = '## Project Status Update - ' || to_char(now(), 'YYYY-MM-DD') || chr(10) || chr(10) || '### Current Progress' || chr(10) || '- Foundation work completed ahead of schedule' || chr(10) || '- Structural steel delivery confirmed for next week' || chr(10) || '- Weather conditions favorable for concrete pour' || chr(10) || chr(10) || '### Key Milestones' || chr(10) || '✅ Site preparation completed' || chr(10) || '✅ Foundation excavation done' || chr(10) || '✅ Utility connections established' || chr(10) || '⏳ Structural framing in progress' || chr(10) || '⏳ Electrical rough-in scheduled' || chr(10) || chr(10) || '### Risk Factors' || chr(10) || '- Potential material shortage for specialty items' || chr(10) || '- Need to coordinate with city inspector for next phase' || chr(10) || '- Budget tracking shows 5% variance, within acceptable range' || chr(10) || chr(10) || '### Next Steps' || chr(10) || '1. Complete structural steel installation' || chr(10) || '2. Schedule building inspection' || chr(10) || '3. Order HVAC equipment' || chr(10) || '4. Review updated architectural drawings' || chr(10) || chr(10) || '### Team Notes' || chr(10) || 'Project manager reports excellent collaboration with subcontractors. Client is satisfied with progress and quality of work.'
    WHERE id = demo_project_id;
  END IF;

  IF demo_project_id_2 IS NOT NULL THEN
    UPDATE projects 
    SET internal_notes = '## Weekly Project Review' || chr(10) || chr(10) || '### Accomplishments This Week' || chr(10) || '- Completed electrical rough-in for 2nd floor' || chr(10) || '- Plumbing inspection passed with no issues' || chr(10) || '- Drywall installation 60% complete' || chr(10) || chr(10) || '### Challenges' || chr(10) || '- Minor delay due to HVAC equipment delivery' || chr(10) || '- Need to reschedule final inspection' || chr(10) || '- Coordinating with multiple trades on site' || chr(10) || chr(10) || '### Budget Status' || chr(10) || '- Current spend: 72% of total budget' || chr(10) || '- Projected completion: On budget' || chr(10) || '- No change orders this week' || chr(10) || chr(10) || '### Safety Notes' || chr(10) || '- Zero incidents this week' || chr(10) || '- All workers completed safety briefing' || chr(10) || '- New fall protection equipment installed' || chr(10) || chr(10) || '### Client Communication' || chr(10) || 'Client visited site yesterday, very pleased with progress. Requested minor modification to lighting layout - change order prepared.'
    WHERE id = demo_project_id_2;
  END IF;

  IF demo_project_id_3 IS NOT NULL THEN
    UPDATE projects 
    SET internal_notes = '## Project Kickoff Notes' || chr(10) || chr(10) || '### Initial Planning' || chr(10) || '- Project scope finalized with client' || chr(10) || '- All permits obtained and posted' || chr(10) || '- Site mobilization completed' || chr(10) || chr(10) || '### Team Assignments' || chr(10) || '- Project Manager: Leading overall coordination' || chr(10) || '- Site Supervisor: Daily operations management' || chr(10) || '- Safety Officer: Compliance and training' || chr(10) || chr(10) || '### Schedule Overview' || chr(10) || '- Phase 1: Site prep (2 weeks) - COMPLETE' || chr(10) || '- Phase 2: Foundation (3 weeks) - IN PROGRESS' || chr(10) || '- Phase 3: Framing (4 weeks) - UPCOMING' || chr(10) || '- Phase 4: MEP rough-in (3 weeks) - PLANNED' || chr(10) || '- Phase 5: Finishes (6 weeks) - PLANNED'
    WHERE id = demo_project_id_3;
  END IF;

  -- Add comprehensive audit logs
  IF demo_project_id IS NOT NULL AND demo_user_id IS NOT NULL AND demo_firm_id IS NOT NULL THEN
    INSERT INTO audit_logs (firm_id, entity_type, entity_id, action, details, user_id, created_at) VALUES
    (demo_firm_id, 'project', demo_project_id, 'created', '{"name": "Project initiated", "status": "active"}', demo_user_id, now() - interval '30 days'),
    (demo_firm_id, 'project', demo_project_id, 'updated', '{"field": "status", "old_value": "planning", "new_value": "active"}', demo_user_id, now() - interval '25 days'),
    (demo_firm_id, 'project', demo_project_id, 'updated', '{"field": "budget", "old_value": "95000", "new_value": "100000"}', demo_user_id, now() - interval '20 days'),
    (demo_firm_id, 'project', demo_project_id, 'note_added', '{"note": "Foundation inspection passed"}', demo_user_id, now() - interval '15 days'),
    (demo_firm_id, 'project', demo_project_id, 'milestone_completed', '{"milestone": "Site preparation"}', demo_user_id, now() - interval '12 days'),
    (demo_firm_id, 'project', demo_project_id, 'file_uploaded', '{"filename": "structural_drawings_rev2.pdf"}', demo_user_id, now() - interval '10 days'),
    (demo_firm_id, 'project', demo_project_id, 'updated', '{"field": "completion_percentage", "old_value": "45", "new_value": "60"}', demo_user_id, now() - interval '7 days'),
    (demo_firm_id, 'project', demo_project_id, 'meeting_scheduled', '{"title": "Weekly progress review"}', demo_user_id, now() - interval '5 days'),
    (demo_firm_id, 'project', demo_project_id, 'risk_identified', '{"risk": "Potential material delay", "severity": "medium"}', demo_user_id, now() - interval '3 days'),
    (demo_firm_id, 'project', demo_project_id, 'note_added', '{"note": "Client approved change order"}', demo_user_id, now() - interval '1 day');

    -- Client activities
    IF demo_client_id IS NOT NULL THEN
      INSERT INTO audit_logs (firm_id, entity_type, entity_id, action, details, user_id, created_at) VALUES
      (demo_firm_id, 'client', demo_client_id, 'created', '{"name": "New client onboarded"}', demo_user_id, now() - interval '45 days'),
      (demo_firm_id, 'client', demo_client_id, 'updated', '{"field": "contact_info"}', demo_user_id, now() - interval '30 days'),
      (demo_firm_id, 'client', demo_client_id, 'meeting_held', '{"type": "Initial consultation"}', demo_user_id, now() - interval '28 days'),
      (demo_firm_id, 'client', demo_client_id, 'contract_signed', '{"contract_type": "Master Service Agreement"}', demo_user_id, now() - interval '26 days');
    END IF;

    -- System activities
    INSERT INTO audit_logs (firm_id, entity_type, entity_id, action, details, user_id, created_at) VALUES
    (demo_firm_id, 'system', demo_user_id, 'login', '{"device": "Chrome on MacOS"}', demo_user_id, now() - interval '1 hour'),
    (demo_firm_id, 'system', demo_user_id, 'report_generated', '{"type": "Monthly financial summary"}', demo_user_id, now() - interval '2 days'),
    (demo_firm_id, 'system', demo_user_id, 'export_data', '{"type": "Project list", "format": "CSV"}', demo_user_id, now() - interval '5 days');
  END IF;

END $$;

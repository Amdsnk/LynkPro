-- Add demo data for reports, tasks, time entries, and comments

DO $$
DECLARE
  demo_firm_id uuid;
  demo_user_id uuid;
  demo_user_id_2 uuid;
  demo_project_id uuid;
  demo_project_id_2 uuid;
  task_id_1 uuid;
  task_id_2 uuid;
  report_id_1 uuid;
  report_id_2 uuid;
  report_id_3 uuid;
  default_disclaimer text;
BEGIN
  SELECT id INTO demo_firm_id FROM firms LIMIT 1;
  SELECT id INTO demo_user_id FROM profiles WHERE firm_id = demo_firm_id ORDER BY created_at LIMIT 1;
  SELECT id INTO demo_user_id_2 FROM profiles WHERE firm_id = demo_firm_id ORDER BY created_at OFFSET 1 LIMIT 1;
  SELECT id INTO demo_project_id FROM projects WHERE firm_id = demo_firm_id ORDER BY created_at LIMIT 1;
  SELECT id INTO demo_project_id_2 FROM projects WHERE firm_id = demo_firm_id ORDER BY created_at OFFSET 1 LIMIT 1;
  SELECT value INTO default_disclaimer FROM system_settings WHERE key = 'default_report_disclaimer';

  IF demo_user_id_2 IS NULL THEN demo_user_id_2 := demo_user_id; END IF;

  -- REPORTS
  IF demo_project_id IS NOT NULL THEN
    INSERT INTO reports (firm_id, project_id, created_by, title, field_notes, ai_narrative, disclaimer, status, sent_at, created_at) VALUES
    (demo_firm_id, demo_project_id, demo_user_id, 'Weekly Site Inspection - Foundation Phase',
     'Site Visit: ' || to_char(now() - interval '5 days', 'YYYY-MM-DD') || chr(10) || 'Weather: Clear, 72F' || chr(10) || chr(10) || 'OBSERVATIONS:' || chr(10) || '- Foundation pour completed' || chr(10) || '- Rebar inspected and approved' || chr(10) || '- Site drainage effective' || chr(10) || chr(10) || 'SAFETY: All PPE worn, fall protection installed' || chr(10) || chr(10) || 'RECOMMENDATIONS:' || chr(10) || '1. Schedule city inspector' || chr(10) || '2. Order structural steel',
     'Foundation work progressing ahead of schedule with excellent quality. Ready for framing phase.',
     default_disclaimer, 'sent', now() - interval '5 days', now() - interval '5 days') RETURNING id INTO report_id_1;

    INSERT INTO reports (firm_id, project_id, created_by, title, field_notes, ai_narrative, disclaimer, status, sent_at, created_at) VALUES
    (demo_firm_id, demo_project_id, demo_user_id, 'Mid-Week Progress Report',
     'Site Visit: ' || to_char(now() - interval '2 days', 'YYYY-MM-DD') || chr(10) || 'Weather: Partly cloudy, 78F' || chr(10) || chr(10) || 'PROGRESS:' || chr(10) || '- Floor framing completed' || chr(10) || '- Wall framing 75% done' || chr(10) || '- Plumbing rough-in started' || chr(10) || chr(10) || 'NEXT: Complete framing, schedule electrical',
     'Excellent progress with framing work moving faster than scheduled. Project on track.',
     default_disclaimer, 'sent', now() - interval '2 days', now() - interval '2 days') RETURNING id INTO report_id_2;

    INSERT INTO reports (firm_id, project_id, created_by, title, field_notes, ai_narrative, disclaimer, status, created_at) VALUES
    (demo_firm_id, demo_project_id_2, demo_user_id, 'Quality Control Inspection',
     'Inspection: ' || to_char(now() - interval '1 day', 'YYYY-MM-DD') || chr(10) || chr(10) || 'QUALITY:' || chr(10) || '- Drywall meets specs' || chr(10) || '- Paint even and consistent' || chr(10) || '- Flooring excellent' || chr(10) || chr(10) || 'PUNCH LIST:' || chr(10) || '1. Touch up paint' || chr(10) || '2. Adjust cabinet doors' || chr(10) || '3. Replace cracked tile',
     'Project quality exceptional with only minor punch list items. Ready for final inspection.',
     default_disclaimer, 'draft', now() - interval '1 day') RETURNING id INTO report_id_3;
  END IF;

  -- TASKS
  IF demo_project_id IS NOT NULL THEN
    INSERT INTO tasks (firm_id, project_id, created_by, assigned_to, title, description, status, priority, due_date, created_at) VALUES
    (demo_firm_id, demo_project_id, demo_user_id, demo_user_id, 'Review Structural Drawings', 'Review and approve updated drawings from engineer.', 'in_progress', 'high', now() + interval '2 days', now() - interval '3 days') RETURNING id INTO task_id_1;

    INSERT INTO tasks (firm_id, project_id, created_by, assigned_to, title, description, status, priority, due_date, created_at) VALUES
    (demo_firm_id, demo_project_id, demo_user_id, demo_user_id_2, 'Schedule Building Inspection', 'Coordinate with city for foundation inspection.', 'todo', 'high', now() + interval '5 days', now() - interval '2 days') RETURNING id INTO task_id_2;

    INSERT INTO tasks (firm_id, project_id, created_by, assigned_to, title, description, status, priority, due_date, created_at) VALUES
    (demo_firm_id, demo_project_id, demo_user_id, demo_user_id, 'Order HVAC Equipment', 'Place order for HVAC units and ductwork.', 'todo', 'medium', now() + interval '7 days', now() - interval '1 day'),
    (demo_firm_id, demo_project_id_2, demo_user_id, demo_user_id, 'Complete Punch List Items', 'Address all items from quality inspection.', 'in_progress', 'high', now() + interval '3 days', now() - interval '1 day'),
    (demo_firm_id, demo_project_id_2, demo_user_id, demo_user_id_2, 'Final Cleaning', 'Coordinate final cleaning crew.', 'todo', 'medium', now() + interval '5 days', now()),
    (demo_firm_id, demo_project_id, demo_user_id, demo_user_id, 'Submit Permit Application', 'Submit electrical permit to city.', 'done', 'high', now() - interval '2 days', now() - interval '10 days'),
    (demo_firm_id, demo_project_id, demo_user_id_2, demo_user_id_2, 'Update Project Schedule', 'Review and update master schedule.', 'todo', 'medium', now() + interval '4 days', now() - interval '1 day'),
    (demo_firm_id, demo_project_id_2, demo_user_id, demo_user_id, 'Client Final Walkthrough', 'Schedule final walkthrough with client.', 'todo', 'high', now() + interval '6 days', now());
  END IF;

  -- TIME ENTRIES
  IF demo_project_id IS NOT NULL AND task_id_1 IS NOT NULL THEN
    INSERT INTO time_entries (firm_id, user_id, project_id, task_id, description, start_time, end_time, duration_minutes, is_billable, hourly_rate, created_at) VALUES
    (demo_firm_id, demo_user_id, demo_project_id, task_id_1, 'Reviewed structural drawings', now() - interval '6 hours', now() - interval '4 hours', 120, true, 150.00, now() - interval '4 hours'),
    (demo_firm_id, demo_user_id, demo_project_id, NULL, 'Site inspection and documentation', now() - interval '1 day 3 hours', now() - interval '1 day', 180, true, 150.00, now() - interval '1 day'),
    (demo_firm_id, demo_user_id_2, demo_project_id, NULL, 'Client meeting and coordination', now() - interval '2 days 1 hour 30 minutes', now() - interval '2 days', 90, true, 125.00, now() - interval '2 days'),
    (demo_firm_id, demo_user_id, demo_project_id_2, NULL, 'Quality inspection and punch list', now() - interval '1 day 2 hours', now() - interval '1 day', 120, true, 150.00, now() - interval '1 day'),
    (demo_firm_id, demo_user_id_2, demo_project_id_2, NULL, 'Subcontractor coordination', now() - interval '3 days 2 hours', now() - interval '3 days', 120, true, 125.00, now() - interval '3 days'),
    (demo_firm_id, demo_user_id, demo_project_id, task_id_2, 'Coordinating inspection schedule', now() - interval '4 days 1 hour 30 minutes', now() - interval '4 days', 90, true, 150.00, now() - interval '4 days'),
    (demo_firm_id, demo_user_id_2, demo_project_id, NULL, 'Material procurement', now() - interval '5 days 3 hours', now() - interval '5 days', 180, true, 125.00, now() - interval '5 days'),
    (demo_firm_id, demo_user_id, demo_project_id, NULL, 'Team meeting and planning', now() - interval '6 days 2 hours', now() - interval '6 days', 120, false, 150.00, now() - interval '6 days'),
    (demo_firm_id, demo_user_id_2, demo_project_id_2, NULL, 'Budget review and reporting', now() - interval '7 days 1 hour', now() - interval '7 days', 60, true, 125.00, now() - interval '7 days');
  END IF;

  -- COMMENTS
  IF demo_project_id IS NOT NULL AND report_id_1 IS NOT NULL THEN
    INSERT INTO comments (firm_id, entity_type, entity_id, created_by, content, created_at) VALUES
    (demo_firm_id, 'project', demo_project_id, demo_user_id, 'Great progress this week! Framing crew doing excellent work.', now() - interval '3 days'),
    (demo_firm_id, 'project', demo_project_id, demo_user_id_2, 'Client visited and was very impressed. Change order approved.', now() - interval '2 days'),
    (demo_firm_id, 'project', demo_project_id, demo_user_id, 'Reminder: Inspector scheduled Friday at 10 AM.', now() - interval '1 day'),
    (demo_firm_id, 'report', report_id_1, demo_user_id_2, 'Excellent report. Foundation looks solid. Approved for next phase.', now() - interval '4 days'),
    (demo_firm_id, 'report', report_id_2, demo_user_id, 'Thanks for update. Good to see we are ahead of schedule!', now() - interval '1 day'),
    (demo_firm_id, 'project', demo_project_id_2, demo_user_id, 'Punch list items being addressed. Complete by end of week.', now() - interval '6 hours'),
    (demo_firm_id, 'task', task_id_1, demo_user_id_2, 'Reviewed drawings. Minor questions for engineer but looks good.', now() - interval '2 days'),
    (demo_firm_id, 'report', report_id_3, demo_user_id, 'Quality inspection complete. Project looking excellent!', now() - interval '12 hours'),
    (demo_firm_id, 'task', task_id_2, demo_user_id, 'Inspector confirmed for Friday. Documentation ready.', now() - interval '1 day'),
    (demo_firm_id, 'project', demo_project_id_2, demo_user_id_2, 'Client very happy. Mentioned potential future projects.', now() - interval '8 hours');
  END IF;

END $$;

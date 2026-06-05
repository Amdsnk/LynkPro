-- Add AI Intelligence demo data: ML models, predictions, and risk assessments

DO $$
DECLARE
  demo_firm_id uuid := '00000000-0000-0000-0000-000000000001';
  demo_project_1 uuid := '00000000-0000-0000-0000-000000000020';
  demo_project_2 uuid := '00000000-0000-0000-0000-000000000021';
  demo_project_3 uuid := '00000000-0000-0000-0000-000000000022';
  delay_model_id uuid;
  cost_model_id uuid;
  risk_model_id uuid;
BEGIN

  -- ============================================
  -- ML MODELS (AI Model Definitions)
  -- ============================================
  INSERT INTO ml_models (id, firm_id, model_name, model_type, version, accuracy_metrics, training_data_range, is_active, deployed_at)
  VALUES
    (gen_random_uuid(), demo_firm_id, 'Delay Prediction Model', 'delay_prediction', 'v2.1.0',
     '{"accuracy": 0.87, "precision": 0.84, "recall": 0.89, "f1_score": 0.86, "mae_days": 3.2}'::jsonb,
     daterange('2024-01-01', '2026-03-01'), true, CURRENT_DATE - 30),
    (gen_random_uuid(), demo_firm_id, 'Cost Overrun Predictor', 'cost_prediction', 'v1.8.5',
     '{"accuracy": 0.82, "precision": 0.79, "recall": 0.85, "f1_score": 0.82, "mae_percentage": 4.5}'::jsonb,
     daterange('2024-01-01', '2026-03-01'), true, CURRENT_DATE - 45),
    (gen_random_uuid(), demo_firm_id, 'Safety Risk Analyzer', 'risk_prediction', 'v3.0.2',
     '{"accuracy": 0.91, "precision": 0.88, "recall": 0.93, "f1_score": 0.90, "auc_roc": 0.94}'::jsonb,
     daterange('2023-06-01', '2026-03-01'), true, CURRENT_DATE - 15)
  ON CONFLICT DO NOTHING;

  -- Get model IDs
  SELECT id INTO delay_model_id FROM ml_models WHERE model_type = 'delay_prediction' AND firm_id = demo_firm_id ORDER BY created_at DESC LIMIT 1;
  SELECT id INTO cost_model_id FROM ml_models WHERE model_type = 'cost_prediction' AND firm_id = demo_firm_id ORDER BY created_at DESC LIMIT 1;
  SELECT id INTO risk_model_id FROM ml_models WHERE model_type = 'risk_prediction' AND firm_id = demo_firm_id ORDER BY created_at DESC LIMIT 1;

  IF delay_model_id IS NOT NULL AND cost_model_id IS NOT NULL THEN

    -- ============================================
    -- ML PREDICTIONS (AI Predictions)
    -- ============================================
    
    -- Delay Predictions
    INSERT INTO ml_predictions (id, firm_id, project_id, model_id, prediction_type, prediction_data, confidence_score, actual_outcome, feedback_score, expires_at)
    VALUES
      -- Project 1 Delay Predictions
      (gen_random_uuid(), demo_firm_id, demo_project_1, delay_model_id, 'delay_prediction',
       '{"predicted_delay_days": 12, "completion_date": "2026-08-15", "risk_factors": ["weather_delays", "material_shortages"], "mitigation_suggestions": ["Order materials 2 weeks early", "Add weather buffer to schedule"]}'::jsonb,
       0.85, '{"actual_delay_days": 10, "actual_completion": "2026-08-13"}'::jsonb, 4, CURRENT_DATE + 90),
      
      (gen_random_uuid(), demo_firm_id, demo_project_1, delay_model_id, 'delay_prediction',
       '{"predicted_delay_days": 5, "completion_date": "2026-09-20", "risk_factors": ["inspection_delays"], "mitigation_suggestions": ["Schedule inspections early", "Have backup inspector contacts"]}'::jsonb,
       0.78, NULL, NULL, CURRENT_DATE + 120),
      
      -- Project 2 Delay Predictions
      (gen_random_uuid(), demo_firm_id, demo_project_2, delay_model_id, 'delay_prediction',
       '{"predicted_delay_days": 8, "completion_date": "2026-07-10", "risk_factors": ["hvac_delivery", "electrical_coordination"], "mitigation_suggestions": ["Expedite HVAC delivery", "Weekly coordination meetings"]}'::jsonb,
       0.82, NULL, NULL, CURRENT_DATE + 75),
      
      -- Project 3 Delay Predictions
      (gen_random_uuid(), demo_firm_id, demo_project_3, delay_model_id, 'delay_prediction',
       '{"predicted_delay_days": 15, "completion_date": "2027-02-28", "risk_factors": ["site_conditions", "permit_delays", "weather"], "mitigation_suggestions": ["Conduct soil tests early", "Submit permits ASAP", "Plan for winter delays"]}'::jsonb,
       0.88, NULL, NULL, CURRENT_DATE + 180)
    ON CONFLICT DO NOTHING;

    -- Cost Predictions
    INSERT INTO ml_predictions (id, firm_id, project_id, model_id, prediction_type, prediction_data, confidence_score, actual_outcome, feedback_score, expires_at)
    VALUES
      -- Project 1 Cost Predictions
      (gen_random_uuid(), demo_firm_id, demo_project_1, cost_model_id, 'cost_prediction',
       '{"predicted_overrun_percentage": 6.5, "predicted_final_cost": 2822500, "original_budget": 2650000, "cost_drivers": ["steel_price_increase", "labor_shortage"], "savings_opportunities": ["Negotiate bulk steel discount", "Use local labor pool"]}'::jsonb,
       0.79, '{"actual_overrun_percentage": 5.8, "actual_cost": 2803700}'::jsonb, 5, CURRENT_DATE + 90),
      
      -- Project 2 Cost Predictions
      (gen_random_uuid(), demo_firm_id, demo_project_2, cost_model_id, 'cost_prediction',
       '{"predicted_overrun_percentage": 3.2, "predicted_final_cost": 1455120, "original_budget": 1410000, "cost_drivers": ["hvac_upgrade"], "savings_opportunities": ["Energy rebates available", "Reuse existing ductwork where possible"]}'::jsonb,
       0.84, NULL, NULL, CURRENT_DATE + 75),
      
      -- Project 3 Cost Predictions
      (gen_random_uuid(), demo_firm_id, demo_project_3, cost_model_id, 'cost_prediction',
       '{"predicted_overrun_percentage": 8.3, "predicted_final_cost": 3519750, "original_budget": 3250000, "cost_drivers": ["site_prep_complexity", "material_escalation"], "savings_opportunities": ["Value engineering on finishes", "Phased construction approach"]}'::jsonb,
       0.81, NULL, NULL, CURRENT_DATE + 180)
    ON CONFLICT DO NOTHING;

    -- ============================================
    -- RISK PREDICTIONS (AI Risk Analysis)
    -- ============================================
    INSERT INTO risk_predictions (id, firm_id, project_id, prediction_date, predicted_risk_score, confidence_level, high_risk_activities, recommendations)
    VALUES
      -- Project 1 Risk Predictions
      (gen_random_uuid(), demo_firm_id, demo_project_1, CURRENT_DATE, 6.8, 0.86,
       '[
         {"activity": "Steel erection at height", "risk_level": "high", "probability": 0.35, "impact": "severe"},
         {"activity": "Concrete pouring in hot weather", "risk_level": "medium", "probability": 0.45, "impact": "moderate"},
         {"activity": "Electrical work near water", "risk_level": "medium", "probability": 0.28, "impact": "severe"}
       ]'::jsonb,
       'Increase safety monitoring during steel erection. Implement heat management protocols for concrete work. Ensure all electrical work follows wet location standards. Schedule daily safety briefings.'),
      
      (gen_random_uuid(), demo_firm_id, demo_project_1, CURRENT_DATE + 7, 5.2, 0.82,
       '[
         {"activity": "Roofing work", "risk_level": "medium", "probability": 0.32, "impact": "moderate"},
         {"activity": "Interior finishing", "risk_level": "low", "probability": 0.15, "impact": "minor"}
       ]'::jsonb,
       'Maintain fall protection systems for roofing. Ensure proper ventilation during interior finishing work.'),
      
      -- Project 2 Risk Predictions
      (gen_random_uuid(), demo_firm_id, demo_project_2, CURRENT_DATE, 4.5, 0.88,
       '[
         {"activity": "HVAC installation in occupied building", "risk_level": "medium", "probability": 0.38, "impact": "moderate"},
         {"activity": "Demolition work", "risk_level": "medium", "probability": 0.42, "impact": "moderate"}
       ]'::jsonb,
       'Coordinate HVAC work with building occupants. Implement dust control measures. Ensure proper PPE for demolition crews.'),
      
      -- Project 3 Risk Predictions
      (gen_random_uuid(), demo_firm_id, demo_project_3, CURRENT_DATE, 7.5, 0.84,
       '[
         {"activity": "Deep excavation", "risk_level": "high", "probability": 0.48, "impact": "severe"},
         {"activity": "Heavy equipment operation", "risk_level": "high", "probability": 0.52, "impact": "severe"},
         {"activity": "Underground utility work", "risk_level": "medium", "probability": 0.35, "impact": "moderate"}
       ]'::jsonb,
       'Implement comprehensive shoring system. Require certified operators for all heavy equipment. Conduct utility locates before any excavation. Daily equipment inspections mandatory.')
    ON CONFLICT DO NOTHING;

  END IF;
END $$;
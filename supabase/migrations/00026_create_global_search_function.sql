-- Create global search function
CREATE OR REPLACE FUNCTION global_search(
  search_query TEXT,
  firm_id_param UUID
)
RETURNS TABLE (
  entity_type TEXT,
  entity_id UUID,
  title TEXT,
  description TEXT,
  metadata JSONB,
  relevance FLOAT
) AS $$
BEGIN
  RETURN QUERY
  
  -- Search projects
  SELECT
    'project'::TEXT as entity_type,
    p.id as entity_id,
    p.name as title,
    COALESCE(p.description, '') as description,
    jsonb_build_object(
      'status', p.status,
      'client_name', c.name,
      'start_date', p.start_date,
      'end_date', p.end_date
    ) as metadata,
    ts_rank(
      to_tsvector('english', p.name || ' ' || COALESCE(p.description, '')),
      plainto_tsquery('english', search_query)
    ) as relevance
  FROM projects p
  LEFT JOIN clients c ON p.client_id = c.id
  WHERE p.firm_id = firm_id_param
    AND (
      p.name ILIKE '%' || search_query || '%'
      OR p.description ILIKE '%' || search_query || '%'
      OR c.name ILIKE '%' || search_query || '%'
    )
  
  UNION ALL
  
  -- Search clients
  SELECT
    'client'::TEXT as entity_type,
    cl.id as entity_id,
    cl.name as title,
    COALESCE(cl.email, '') as description,
    jsonb_build_object(
      'email', cl.email,
      'phone', cl.phone,
      'company', cl.company
    ) as metadata,
    ts_rank(
      to_tsvector('english', cl.name || ' ' || COALESCE(cl.email, '') || ' ' || COALESCE(cl.company, '')),
      plainto_tsquery('english', search_query)
    ) as relevance
  FROM clients cl
  WHERE cl.firm_id = firm_id_param
    AND (
      cl.name ILIKE '%' || search_query || '%'
      OR cl.email ILIKE '%' || search_query || '%'
      OR cl.company ILIKE '%' || search_query || '%'
    )
  
  UNION ALL
  
  -- Search proposals
  SELECT
    'proposal'::TEXT as entity_type,
    pr.id as entity_id,
    pr.title as title,
    COALESCE(pr.description, '') as description,
    jsonb_build_object(
      'status', pr.status,
      'client_name', c.name,
      'total_amount', pr.total_amount
    ) as metadata,
    ts_rank(
      to_tsvector('english', pr.title || ' ' || COALESCE(pr.description, '')),
      plainto_tsquery('english', search_query)
    ) as relevance
  FROM proposals pr
  LEFT JOIN clients c ON pr.client_id = c.id
  WHERE pr.firm_id = firm_id_param
    AND (
      pr.title ILIKE '%' || search_query || '%'
      OR pr.description ILIKE '%' || search_query || '%'
    )
  
  UNION ALL
  
  -- Search invoices
  SELECT
    'invoice'::TEXT as entity_type,
    i.id as entity_id,
    i.invoice_number as title,
    COALESCE(i.notes, '') as description,
    jsonb_build_object(
      'status', i.status,
      'client_name', c.name,
      'total_amount', i.total_amount,
      'due_date', i.due_date
    ) as metadata,
    ts_rank(
      to_tsvector('english', i.invoice_number || ' ' || COALESCE(i.notes, '')),
      plainto_tsquery('english', search_query)
    ) as relevance
  FROM invoices i
  LEFT JOIN clients c ON i.client_id = c.id
  WHERE i.firm_id = firm_id_param
    AND (
      i.invoice_number ILIKE '%' || search_query || '%'
      OR i.notes ILIKE '%' || search_query || '%'
    )
  
  UNION ALL
  
  -- Search reports
  SELECT
    'report'::TEXT as entity_type,
    r.id as entity_id,
    r.title as title,
    COALESCE(r.description, '') as description,
    jsonb_build_object(
      'report_type', r.report_type,
      'created_at', r.created_at
    ) as metadata,
    ts_rank(
      to_tsvector('english', r.title || ' ' || COALESCE(r.description, '')),
      plainto_tsquery('english', search_query)
    ) as relevance
  FROM reports r
  WHERE r.firm_id = firm_id_param
    AND (
      r.title ILIKE '%' || search_query || '%'
      OR r.description ILIKE '%' || search_query || '%'
    )
  
  ORDER BY relevance DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
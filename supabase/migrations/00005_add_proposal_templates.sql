-- Insert default proposal templates
-- Note: These will be associated with firms when they create proposals
-- For now, we'll create system-level templates that can be copied to firms

-- First, we need to get or create a system firm for templates
-- Since we can't guarantee a firm exists, we'll modify the proposal_templates table to allow null firm_id for system templates

ALTER TABLE proposal_templates ALTER COLUMN firm_id DROP NOT NULL;

-- Insert default AEC proposal templates
INSERT INTO proposal_templates (id, firm_id, name, content) VALUES
(
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  NULL,
  'Standard AEC Proposal',
  '{
    "sections": [
      {
        "title": "Project Overview",
        "content": "This proposal outlines the scope of work, deliverables, and terms for the proposed project."
      },
      {
        "title": "Scope of Work",
        "content": "The following services will be provided as part of this engagement:"
      },
      {
        "title": "Deliverables",
        "content": "Upon completion, the following deliverables will be provided to the client:"
      },
      {
        "title": "Timeline",
        "content": "The estimated timeline for project completion is outlined below."
      }
    ],
    "terms": "Payment terms: Net 30 days from invoice date. A 50% deposit is required to commence work. Final payment is due upon project completion and delivery of all deliverables. This proposal is valid for 30 days from the date of issue."
  }'
),
(
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  NULL,
  'Design Services Proposal',
  '{
    "sections": [
      {
        "title": "Design Approach",
        "content": "Our design approach focuses on creating functional, aesthetically pleasing solutions that meet all project requirements and regulatory standards."
      },
      {
        "title": "Design Phases",
        "content": "The design process will be completed in the following phases: Schematic Design, Design Development, and Construction Documents."
      },
      {
        "title": "Client Collaboration",
        "content": "We believe in close collaboration with our clients throughout the design process to ensure the final product exceeds expectations."
      }
    ],
    "terms": "Payment schedule: 25% upon contract signing, 25% upon completion of schematic design, 25% upon completion of design development, and 25% upon delivery of construction documents. This proposal is valid for 45 days."
  }'
),
(
  'c3d4e5f6-a7b8-9012-cdef-123456789012',
  NULL,
  'Construction Management Proposal',
  '{
    "sections": [
      {
        "title": "Project Management Services",
        "content": "Our construction management services include project planning, scheduling, cost control, quality assurance, and safety management."
      },
      {
        "title": "Site Supervision",
        "content": "Our team will provide on-site supervision to ensure work is completed according to plans, specifications, and industry standards."
      },
      {
        "title": "Reporting",
        "content": "Regular progress reports will be provided to keep all stakeholders informed of project status, issues, and milestones."
      }
    ],
    "terms": "Fee structure: Monthly retainer based on project duration. Additional services billed at hourly rates. Payment due within 15 days of invoice. This proposal is valid for 60 days."
  }'
);
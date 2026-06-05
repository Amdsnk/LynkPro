-- Add latitude and longitude columns to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add sample coordinates for existing projects (using various US cities)
UPDATE projects SET latitude = 34.0522, longitude = -118.2437 WHERE name = 'Downtown Office Complex';
UPDATE projects SET latitude = 40.7128, longitude = -74.0060 WHERE name = 'Riverside Residential Development';
UPDATE projects SET latitude = 41.8781, longitude = -87.6298 WHERE name = 'Tech Campus Expansion';
UPDATE projects SET latitude = 37.7749, longitude = -122.4194 WHERE name = 'Historic Building Renovation';
UPDATE projects SET latitude = 33.4484, longitude = -112.0740 WHERE name = 'Waterfront Mixed-Use Project';
UPDATE projects SET latitude = 29.7604, longitude = -95.3698 WHERE name = 'Suburban Retail Center';
UPDATE projects SET latitude = 39.7392, longitude = -104.9903 WHERE name = 'Industrial Warehouse Facility';
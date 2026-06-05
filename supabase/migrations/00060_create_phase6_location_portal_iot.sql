-- Geofences table
CREATE TABLE geofences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  coordinates JSONB NOT NULL,
  radius_meters INT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Location History table
CREATE TABLE location_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  firm_id UUID NOT NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  accuracy_meters DECIMAL(8,2),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  geofence_id UUID REFERENCES geofences(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portal Access table
CREATE TABLE portal_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  firm_id UUID NOT NULL,
  portal_type TEXT NOT NULL,
  project_ids UUID[],
  permissions JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- IoT Devices table
CREATE TABLE iot_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL,
  device_id TEXT NOT NULL,
  device_type TEXT NOT NULL,
  device_name TEXT,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  equipment_id UUID,
  status TEXT DEFAULT 'active',
  last_reading_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(firm_id, device_id)
);

-- Sensor Readings table
CREATE TABLE sensor_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES iot_devices(id) ON DELETE CASCADE,
  firm_id UUID NOT NULL,
  reading_type TEXT NOT NULL,
  value DECIMAL(15,4),
  unit TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Geofences
CREATE INDEX idx_geofences_firm_id ON geofences(firm_id);
CREATE INDEX idx_geofences_project_id ON geofences(project_id);
CREATE INDEX idx_geofences_active ON geofences(is_active) WHERE is_active = true;

-- Indexes for Location History
CREATE INDEX idx_location_history_user_id ON location_history(user_id);
CREATE INDEX idx_location_history_firm_id ON location_history(firm_id);
CREATE INDEX idx_location_history_timestamp ON location_history(timestamp DESC);
CREATE INDEX idx_location_history_geofence_id ON location_history(geofence_id);

-- Indexes for Portal Access
CREATE INDEX idx_portal_access_user_id ON portal_access(user_id);
CREATE INDEX idx_portal_access_firm_id ON portal_access(firm_id);
CREATE INDEX idx_portal_access_type ON portal_access(portal_type);
CREATE INDEX idx_portal_access_active ON portal_access(is_active) WHERE is_active = true;

-- Indexes for IoT Devices
CREATE INDEX idx_iot_devices_firm_id ON iot_devices(firm_id);
CREATE INDEX idx_iot_devices_device_id ON iot_devices(device_id);
CREATE INDEX idx_iot_devices_project_id ON iot_devices(project_id);
CREATE INDEX idx_iot_devices_status ON iot_devices(status);

-- Indexes for Sensor Readings
CREATE INDEX idx_sensor_readings_device_id ON sensor_readings(device_id);
CREATE INDEX idx_sensor_readings_firm_id ON sensor_readings(firm_id);
CREATE INDEX idx_sensor_readings_timestamp ON sensor_readings(timestamp DESC);
CREATE INDEX idx_sensor_readings_reading_type ON sensor_readings(reading_type);

-- RLS Policies for Geofences
ALTER TABLE geofences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their firm's geofences"
  ON geofences FOR SELECT
  TO authenticated
  USING (
    firm_id IN (
      SELECT firm_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage geofences"
  ON geofences FOR ALL
  TO authenticated
  USING (
    firm_id IN (
      SELECT firm_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for Location History
ALTER TABLE location_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own location history"
  ON location_history FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    firm_id IN (
      SELECT firm_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can create their own location history"
  ON location_history FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );

-- RLS Policies for Portal Access
ALTER TABLE portal_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own portal access"
  ON portal_access FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    firm_id IN (
      SELECT firm_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage portal access"
  ON portal_access FOR ALL
  TO authenticated
  USING (
    firm_id IN (
      SELECT firm_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for IoT Devices
ALTER TABLE iot_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their firm's IoT devices"
  ON iot_devices FOR SELECT
  TO authenticated
  USING (
    firm_id IN (
      SELECT firm_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage IoT devices"
  ON iot_devices FOR ALL
  TO authenticated
  USING (
    firm_id IN (
      SELECT firm_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for Sensor Readings
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their firm's sensor readings"
  ON sensor_readings FOR SELECT
  TO authenticated
  USING (
    firm_id IN (
      SELECT firm_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can create sensor readings"
  ON sensor_readings FOR INSERT
  TO authenticated
  WITH CHECK (
    firm_id IN (
      SELECT firm_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Comments
COMMENT ON TABLE geofences IS 'Defines geographic boundaries for projects';
COMMENT ON TABLE location_history IS 'Tracks user location history with consent';
COMMENT ON TABLE portal_access IS 'Manages external portal access for clients and subcontractors';
COMMENT ON TABLE iot_devices IS 'Registers IoT devices for monitoring';
COMMENT ON TABLE sensor_readings IS 'Stores time-series sensor data from IoT devices';
COMMENT ON COLUMN portal_access.portal_type IS 'client, subcontractor';
COMMENT ON COLUMN iot_devices.device_type IS 'gps_tracker, temp_sensor, fuel_monitor, humidity_sensor, air_quality_sensor';
COMMENT ON COLUMN iot_devices.status IS 'active, inactive, error, maintenance';
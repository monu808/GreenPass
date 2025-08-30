-- Add alert columns to weather_data table
-- Run this in your Supabase SQL editor to consolidate weather and alert data

ALTER TABLE public.weather_data 
ADD COLUMN IF NOT EXISTS alert_level TEXT DEFAULT 'none' CHECK (alert_level IN ('none', 'low', 'medium', 'high', 'critical')),
ADD COLUMN IF NOT EXISTS alert_message TEXT,
ADD COLUMN IF NOT EXISTS alert_reason TEXT;

-- Add index for faster alert queries
CREATE INDEX IF NOT EXISTS idx_weather_data_alert_level ON weather_data(alert_level) WHERE alert_level != 'none';
CREATE INDEX IF NOT EXISTS idx_weather_data_destination_recorded ON weather_data(destination_id, recorded_at DESC);

-- Optional: Remove old duplicate weather data (keep only latest 100 records per destination)
-- Uncomment the following if you want to clean up old data:
/*
WITH ranked_weather AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY destination_id ORDER BY recorded_at DESC) as rn
  FROM weather_data
)
DELETE FROM weather_data 
WHERE id IN (
  SELECT id FROM ranked_weather WHERE rn > 100
);
*/

-- Update weather_data table to have proper data types for temperature (if needed)
-- Uncomment if you're getting type conversion errors:
/*
ALTER TABLE public.weather_data 
ALTER COLUMN temperature TYPE NUMERIC(5,2),
ALTER COLUMN pressure TYPE NUMERIC(7,2),
ALTER COLUMN wind_speed TYPE NUMERIC(5,2);
*/

COMMENT ON COLUMN weather_data.alert_level IS 'Alert severity level based on weather conditions';
COMMENT ON COLUMN weather_data.alert_message IS 'Generated alert message for display';
COMMENT ON COLUMN weather_data.alert_reason IS 'Reason why the alert was triggered';

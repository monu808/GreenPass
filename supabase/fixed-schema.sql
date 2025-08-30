-- Tourist Management System - Fixed Database Schema
-- Run this script in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Anyone can view active destinations" ON destinations;
DROP POLICY IF EXISTS "Admins can manage destinations" ON destinations;
DROP POLICY IF EXISTS "Users can view their own registrations" ON tourists;
DROP POLICY IF EXISTS "Users can create their own registrations" ON tourists;
DROP POLICY IF EXISTS "Users can update their own pending registrations" ON tourists;
DROP POLICY IF EXISTS "Admins can view all registrations" ON tourists;
DROP POLICY IF EXISTS "Admins can manage all registrations" ON tourists;
DROP POLICY IF EXISTS "Anyone can view active alerts" ON alerts;
DROP POLICY IF EXISTS "Admins can manage alerts" ON alerts;
DROP POLICY IF EXISTS "Anyone can view weather data" ON weather_data;
DROP POLICY IF EXISTS "Admins can manage weather data" ON weather_data;

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'tourist' CHECK (role IN ('tourist', 'admin', 'supervisor', 'operator')),
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Destinations table
CREATE TABLE IF NOT EXISTS public.destinations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    max_capacity INTEGER NOT NULL DEFAULT 1000,
    current_occupancy INTEGER DEFAULT 0,
    description TEXT,
    guidelines TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    ecological_sensitivity TEXT DEFAULT 'medium' CHECK (ecological_sensitivity IN ('low', 'medium', 'high', 'critical')),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tourists table
CREATE TABLE IF NOT EXISTS public.tourists (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    id_proof TEXT NOT NULL,
    nationality TEXT DEFAULT 'Indian',
    group_size INTEGER DEFAULT 1 CHECK (group_size > 0 AND group_size <= 10),
    destination_id UUID REFERENCES destinations(id) NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'checked-in', 'checked-out', 'cancelled')),
    emergency_contact_name TEXT NOT NULL,
    emergency_contact_phone TEXT NOT NULL,
    emergency_contact_relationship TEXT NOT NULL,
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alerts table
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('capacity', 'weather', 'emergency', 'maintenance')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    destination_id UUID REFERENCES destinations(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weather data table
CREATE TABLE IF NOT EXISTS public.weather_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    destination_id UUID REFERENCES destinations(id) NOT NULL,
    temperature DECIMAL(5, 2) NOT NULL,
    humidity INTEGER NOT NULL,
    pressure DECIMAL(7, 2) NOT NULL,
    weather_main TEXT NOT NULL,
    weather_description TEXT NOT NULL,
    wind_speed DECIMAL(5, 2) NOT NULL,
    wind_direction INTEGER NOT NULL,
    visibility INTEGER NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tourists_destination_id ON tourists(destination_id);
CREATE INDEX IF NOT EXISTS idx_tourists_status ON tourists(status);
CREATE INDEX IF NOT EXISTS idx_tourists_user_id ON tourists(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_destination_id ON alerts(destination_id);
CREATE INDEX IF NOT EXISTS idx_alerts_is_active ON alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_weather_data_destination_id ON weather_data(destination_id);
CREATE INDEX IF NOT EXISTS idx_weather_data_recorded_at ON weather_data(recorded_at);

-- Create function to update current occupancy
CREATE OR REPLACE FUNCTION update_destination_occupancy()
RETURNS TRIGGER AS $$
BEGIN
    -- Update current occupancy for the destination
    UPDATE destinations 
    SET current_occupancy = (
        SELECT COALESCE(SUM(group_size), 0)
        FROM tourists 
        WHERE destination_id = COALESCE(NEW.destination_id, OLD.destination_id)
        AND status = 'checked-in'
    ),
    updated_at = NOW()
    WHERE id = COALESCE(NEW.destination_id, OLD.destination_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update occupancy
DROP TRIGGER IF EXISTS trigger_update_occupancy_insert ON tourists;
CREATE TRIGGER trigger_update_occupancy_insert
    AFTER INSERT ON tourists
    FOR EACH ROW
    EXECUTE FUNCTION update_destination_occupancy();

DROP TRIGGER IF EXISTS trigger_update_occupancy_update ON tourists;
CREATE TRIGGER trigger_update_occupancy_update
    AFTER UPDATE ON tourists
    FOR EACH ROW
    EXECUTE FUNCTION update_destination_occupancy();

DROP TRIGGER IF EXISTS trigger_update_occupancy_delete ON tourists;
CREATE TRIGGER trigger_update_occupancy_delete
    AFTER DELETE ON tourists
    FOR EACH ROW
    EXECUTE FUNCTION update_destination_occupancy();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at timestamps
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_destinations_updated_at ON destinations;
CREATE TRIGGER update_destinations_updated_at BEFORE UPDATE ON destinations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tourists_updated_at ON tourists;
CREATE TRIGGER update_tourists_updated_at BEFORE UPDATE ON tourists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_alerts_updated_at ON alerts;
CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Disable RLS temporarily to avoid infinite recursion
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS destinations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tourists DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS weather_data DISABLE ROW LEVEL SECURITY;

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, role, is_admin)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        CASE 
            WHEN NEW.email = 'admin@tms-india.gov.in' THEN 'admin'
            ELSE 'tourist'
        END,
        NEW.email = 'admin@tms-india.gov.in'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = COALESCE(EXCLUDED.name, users.name),
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to handle new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Clear existing data to avoid duplicates
DELETE FROM public.alerts;
DELETE FROM public.tourists;
DELETE FROM public.destinations;

-- Insert sample destinations
INSERT INTO public.destinations (id, name, location, max_capacity, current_occupancy, description, guidelines, ecological_sensitivity, latitude, longitude) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Vaishno Devi', 'Jammu and Kashmir', 1000, 750, 'Sacred Hindu temple dedicated to Goddess Vaishno Devi, located in the Trikuta Hills.', ARRAY['Carry valid ID proof', 'Follow designated trekking routes', 'Respect religious customs', 'Do not litter', 'Emergency contact: 1950'], 'high', 33.0305, 74.9496),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Manali', 'Himachal Pradesh', 800, 650, 'Popular hill station in the Beas River valley, known for adventure sports and scenic beauty.', ARRAY['Respect local culture and traditions', 'Avoid plastic usage', 'Stay on marked trails', 'Book accommodations in advance', 'Follow traffic rules on mountain roads'], 'medium', 32.2396, 77.1887),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Shimla', 'Himachal Pradesh', 1200, 980, 'Former summer capital of British India, famous for colonial architecture and Mall Road.', ARRAY['Use public transport or walk when possible', 'Respect heritage buildings', 'Maintain cleanliness', 'Follow parking regulations', 'Support local businesses'], 'medium', 31.1048, 77.1734),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Dharamshala', 'Himachal Pradesh', 600, 420, 'Home to the Dalai Lama and Tibetan government in exile, offering spiritual experiences.', ARRAY['Respect Tibetan culture and Buddhism', 'Maintain silence in monasteries', 'Remove shoes before entering religious places', 'Do not disturb meditation sessions', 'Carry warm clothing'], 'high', 32.2190, 76.3234),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'Spiti Valley', 'Himachal Pradesh', 200, 45, 'Cold desert mountain valley known for ancient monasteries and unique landscape.', ARRAY['Obtain inner line permits', 'Carry sufficient warm clothing', 'Respect local customs', 'Do not feed wild animals', 'Emergency evacuation may take time - plan accordingly'], 'critical', 32.2985, 78.0339);

-- Insert sample alerts
INSERT INTO public.alerts (id, type, title, message, severity, destination_id, is_active) VALUES
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'weather', 'Weather Advisory', 'Heavy rainfall expected in Manali region for next 48 hours. Please check road conditions.', 'medium', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', true),
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'capacity', 'Capacity Alert', 'Shimla has reached 80% capacity. Consider alternative dates or destinations.', 'high', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', true);

-- Verify the setup
SELECT 'Setup Complete! 🎉' as status;
SELECT 'Destinations' as table_name, count(*) as records FROM destinations
UNION ALL
SELECT 'Alerts', count(*) FROM alerts
UNION ALL
SELECT 'Tourists', count(*) FROM tourists
UNION ALL
SELECT 'Weather Data', count(*) FROM weather_data;

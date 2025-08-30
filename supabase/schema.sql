-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'tourist' CHECK (role IN ('tourist', 'admin', 'supervisor', 'operator')),
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Destinations table
CREATE TABLE public.destinations (
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
CREATE TABLE public.tourists (
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
CREATE TABLE public.alerts (
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
CREATE TABLE public.weather_data (
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

-- Insert default destinations with proper UUIDs
INSERT INTO public.destinations (id, name, location, max_capacity, description, guidelines, ecological_sensitivity, latitude, longitude) VALUES 
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Vaishno Devi', 'Jammu and Kashmir', 1000, 'Sacred Hindu temple dedicated to Goddess Vaishno Devi, located in the Trikuta Hills.', ARRAY['Carry valid ID proof', 'Follow designated trekking routes', 'Respect religious customs', 'Do not litter', 'Emergency contact: 1950'], 'high', 33.0305, 74.9496),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Manali', 'Himachal Pradesh', 800, 'Popular hill station in the Beas River valley, known for adventure sports and scenic beauty.', ARRAY['Respect local culture and traditions', 'Avoid plastic usage', 'Stay on marked trails', 'Book accommodations in advance', 'Follow traffic rules on mountain roads'], 'medium', 32.2396, 77.1887),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Shimla', 'Himachal Pradesh', 1200, 'Former summer capital of British India, famous for colonial architecture and Mall Road.', ARRAY['Use public transport or walk when possible', 'Respect heritage buildings', 'Maintain cleanliness', 'Follow parking regulations', 'Support local businesses'], 'medium', 31.1048, 77.1734),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Dharamshala', 'Himachal Pradesh', 600, 'Home to the Dalai Lama and Tibetan government in exile, offering spiritual experiences.', ARRAY['Respect Tibetan culture and Buddhism', 'Maintain silence in monasteries', 'Remove shoes before entering religious places', 'Do not disturb meditation sessions', 'Carry warm clothing'], 'high', 32.2190, 76.3234),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'Spiti Valley', 'Himachal Pradesh', 200, 'Cold desert mountain valley known for ancient monasteries and unique landscape.', ARRAY['Obtain inner line permits', 'Carry sufficient warm clothing', 'Respect local customs', 'Do not feed wild animals', 'Emergency evacuation may take time - plan accordingly'], 'critical', 32.2985, 78.0339);

-- Insert sample weather alert
INSERT INTO public.alerts (type, title, message, severity, destination_id) VALUES 
('weather', 'Weather Advisory', 'Heavy rainfall expected in Manali region for next 48 hours. Please check road conditions.', 'medium', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22');

-- Create indexes for better performance
CREATE INDEX idx_tourists_destination_id ON tourists(destination_id);
CREATE INDEX idx_tourists_status ON tourists(status);
CREATE INDEX idx_tourists_user_id ON tourists(user_id);
CREATE INDEX idx_alerts_destination_id ON alerts(destination_id);
CREATE INDEX idx_alerts_is_active ON alerts(is_active);
CREATE INDEX idx_weather_data_destination_id ON weather_data(destination_id);
CREATE INDEX idx_weather_data_recorded_at ON weather_data(recorded_at);

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
CREATE TRIGGER trigger_update_occupancy_insert
    AFTER INSERT ON tourists
    FOR EACH ROW
    EXECUTE FUNCTION update_destination_occupancy();

CREATE TRIGGER trigger_update_occupancy_update
    AFTER UPDATE ON tourists
    FOR EACH ROW
    EXECUTE FUNCTION update_destination_occupancy();

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
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_destinations_updated_at BEFORE UPDATE ON destinations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tourists_updated_at BEFORE UPDATE ON tourists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tourists ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_data ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all users" ON users FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admins can update all users" ON users FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
);

-- Create policies for destinations table
CREATE POLICY "Anyone can view active destinations" ON destinations FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage destinations" ON destinations FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
);

-- Create policies for tourists table
CREATE POLICY "Users can view their own registrations" ON tourists FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create their own registrations" ON tourists FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own pending registrations" ON tourists FOR UPDATE USING (
    user_id = auth.uid() AND status = 'pending'
);
CREATE POLICY "Admins can view all registrations" ON tourists FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admins can manage all registrations" ON tourists FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
);

-- Create policies for alerts table
CREATE POLICY "Anyone can view active alerts" ON alerts FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage alerts" ON alerts FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
);

-- Create policies for weather data table
CREATE POLICY "Anyone can view weather data" ON weather_data FOR SELECT USING (true);
CREATE POLICY "Admins can manage weather data" ON weather_data FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
);

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
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to handle new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Mock data for testing
-- Destinations
INSERT INTO public.destinations (id, name, location, max_capacity, current_occupancy, description, guidelines, ecological_sensitivity, latitude, longitude, created_at, updated_at) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Vaishno Devi', 'Jammu and Kashmir', 1000, 750, 'Sacred Hindu temple dedicated to Goddess Vaishno Devi, located in the Trikuta Hills.', ARRAY['Carry valid ID proof', 'Follow designated trekking routes', 'Respect religious customs', 'Do not litter', 'Emergency contact: 1950'], 'high', 33.0305, 74.9496, NOW(), NOW()),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Manali', 'Himachal Pradesh', 800, 650, 'Popular hill station in the Beas River valley, known for adventure sports and scenic beauty.', ARRAY['Respect local culture and traditions', 'Avoid plastic usage', 'Stay on marked trails', 'Book accommodations in advance', 'Follow traffic rules on mountain roads'], 'medium', 32.2396, 77.1887, NOW(), NOW()),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Shimla', 'Himachal Pradesh', 1200, 980, 'Former summer capital of British India, famous for colonial architecture and Mall Road.', ARRAY['Use public transport or walk when possible', 'Respect heritage buildings', 'Maintain cleanliness', 'Follow parking regulations', 'Support local businesses'], 'medium', 31.1048, 77.1734, NOW(), NOW()),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Dharamshala', 'Himachal Pradesh', 600, 420, 'Home to the Dalai Lama and Tibetan government in exile, offering spiritual experiences.', ARRAY['Respect Tibetan culture and Buddhism', 'Maintain silence in monasteries', 'Remove shoes before entering religious places', 'Do not disturb meditation sessions', 'Carry warm clothing'], 'high', 32.2190, 76.3234, NOW(), NOW()),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'Spiti Valley', 'Himachal Pradesh', 200, 45, 'Cold desert mountain valley known for ancient monasteries and unique landscape.', ARRAY['Obtain inner line permits', 'Carry sufficient warm clothing', 'Respect local customs', 'Do not feed wild animals', 'Emergency evacuation may take time - plan accordingly'], 'critical', 32.2985, 78.0339, NOW(), NOW());

-- Alerts
INSERT INTO public.alerts (id, type, title, message, severity, destination_id, is_active, created_at, updated_at) VALUES
('alert-001', 'weather', 'Weather Advisory', 'Heavy rainfall expected in Manali region for next 48 hours. Please check road conditions.', 'medium', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', true, NOW(), NOW()),
('alert-002', 'capacity', 'Capacity Alert', 'Shimla has reached 80% capacity. Consider alternative dates or destinations.', 'high', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', true, NOW(), NOW());

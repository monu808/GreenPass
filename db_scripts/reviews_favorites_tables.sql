-- ============================================================================
-- Reviews and Favorites Tables Schema
-- ============================================================================
-- This script creates the reviews and favorites tables for user-generated content
-- and saved destination functionality.
-- ============================================================================

-- ============================================================================
-- REVIEWS TABLE
-- ============================================================================
-- Stores user reviews for destinations with ratings, content, and engagement metrics

CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    destination_id UUID NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
    
    -- Review content
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    photos TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    trip_type VARCHAR(50) NOT NULL CHECK (trip_type IN ('solo', 'couple', 'family', 'friends', 'business')),
    
    -- User display info (denormalized for performance)
    user_name VARCHAR(100) NOT NULL,
    user_avatar VARCHAR(500),
    
    -- Engagement metrics
    helpful_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    
    -- Verification status
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one review per user per destination
    CONSTRAINT unique_user_destination_review UNIQUE (user_id, destination_id)
);

-- Index for faster destination reviews lookup
CREATE INDEX IF NOT EXISTS idx_reviews_destination ON reviews(destination_id);

-- Index for user's reviews
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);

-- Index for sorting by date
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- ============================================================================
-- REVIEW LIKES TABLE
-- ============================================================================
-- Tracks which users have liked which reviews

CREATE TABLE IF NOT EXISTS review_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one like per user per review
    CONSTRAINT unique_user_review_like UNIQUE (user_id, review_id)
);

-- Index for checking if user liked a review
CREATE INDEX IF NOT EXISTS idx_review_likes_user_review ON review_likes(user_id, review_id);

-- ============================================================================
-- REVIEW HELPFUL TABLE
-- ============================================================================
-- Tracks which users have marked which reviews as helpful

CREATE TABLE IF NOT EXISTS review_helpful (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one helpful vote per user per review
    CONSTRAINT unique_user_review_helpful UNIQUE (user_id, review_id)
);

-- Index for checking if user marked review as helpful
CREATE INDEX IF NOT EXISTS idx_review_helpful_user_review ON review_helpful(user_id, review_id);

-- ============================================================================
-- FAVORITES TABLE
-- ============================================================================
-- Stores user's favorite destinations and activities

CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Item reference (either destination or activity)
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('destination', 'activity')),
    item_id UUID NOT NULL,
    
    -- Additional metadata
    notes TEXT,
    is_bucket_list BOOLEAN DEFAULT FALSE,
    visited_date DATE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one favorite per user per item
    CONSTRAINT unique_user_item_favorite UNIQUE (user_id, item_type, item_id)
);

-- Index for user's favorites
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);

-- Index for item type filtering
CREATE INDEX IF NOT EXISTS idx_favorites_item_type ON favorites(item_type);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_favorites_user_type ON favorites(user_id, item_type);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to reviews table
DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to favorites table
DROP TRIGGER IF EXISTS update_favorites_updated_at ON favorites;
CREATE TRIGGER update_favorites_updated_at
    BEFORE UPDATE ON favorites
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TRIGGER FUNCTIONS FOR ENGAGEMENT METRICS
-- ============================================================================

-- Function to update likes count on reviews
CREATE OR REPLACE FUNCTION update_review_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE reviews SET likes_count = likes_count + 1 WHERE id = NEW.review_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE reviews SET likes_count = likes_count - 1 WHERE id = OLD.review_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger for likes count
DROP TRIGGER IF EXISTS update_likes_count ON review_likes;
CREATE TRIGGER update_likes_count
    AFTER INSERT OR DELETE ON review_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_review_likes_count();

-- Function to update helpful count on reviews
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = NEW.review_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE reviews SET helpful_count = helpful_count - 1 WHERE id = OLD.review_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger for helpful count
DROP TRIGGER IF EXISTS update_helpful_count ON review_helpful;
CREATE TRIGGER update_helpful_count
    AFTER INSERT OR DELETE ON review_helpful
    FOR EACH ROW
    EXECUTE FUNCTION update_review_helpful_count();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_helpful ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Reviews: Anyone can read, authenticated users can create/update their own
CREATE POLICY "Reviews are viewable by everyone" ON reviews
    FOR SELECT USING (true);

CREATE POLICY "Users can create their own reviews" ON reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON reviews
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON reviews
    FOR DELETE USING (auth.uid() = user_id);

-- Review Likes: Users can manage their own likes
CREATE POLICY "Users can view all likes" ON review_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can create their own likes" ON review_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON review_likes
    FOR DELETE USING (auth.uid() = user_id);

-- Review Helpful: Users can manage their own helpful votes
CREATE POLICY "Users can view all helpful votes" ON review_helpful
    FOR SELECT USING (true);

CREATE POLICY "Users can create their own helpful votes" ON review_helpful
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own helpful votes" ON review_helpful
    FOR DELETE USING (auth.uid() = user_id);

-- Favorites: Users can only see and manage their own favorites
CREATE POLICY "Users can view their own favorites" ON favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own favorites" ON favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own favorites" ON favorites
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" ON favorites
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for reviews with user like status (requires auth context)
CREATE OR REPLACE VIEW reviews_with_user_status AS
SELECT 
    r.*,
    d.name as destination_name,
    d.location as destination_location,
    EXISTS (
        SELECT 1 FROM review_likes rl 
        WHERE rl.review_id = r.id AND rl.user_id = auth.uid()
    ) as is_liked_by_current_user,
    EXISTS (
        SELECT 1 FROM review_helpful rh 
        WHERE rh.review_id = r.id AND rh.user_id = auth.uid()
    ) as is_marked_helpful_by_current_user
FROM reviews r
LEFT JOIN destinations d ON r.destination_id = d.id;

-- View for favorites with destination details
CREATE OR REPLACE VIEW favorites_with_details AS
SELECT 
    f.*,
    CASE 
        WHEN f.item_type = 'destination' THEN d.name
        ELSE NULL
    END as item_name,
    CASE 
        WHEN f.item_type = 'destination' THEN d.location
        ELSE NULL
    END as item_location,
    CASE 
        WHEN f.item_type = 'destination' THEN d.description
        ELSE NULL
    END as item_description
FROM favorites f
LEFT JOIN destinations d ON f.item_type = 'destination' AND f.item_id = d.id;

-- Payment System Database Schema
-- Add these tables to your existing Supabase database

-- =============================================
-- PAYMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES tourists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Payment details
  amount INTEGER NOT NULL CHECK (amount > 0), -- Amount in smallest unit (paise for INR)
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded', 'requires_action')),
  
  -- Payment method
  payment_method VARCHAR(20)
    CHECK (payment_method IN ('card', 'upi', 'netbanking', 'wallet')),
  
  -- Gateway integration
  gateway VARCHAR(20) NOT NULL CHECK (gateway IN ('razorpay', 'stripe')),
  gateway_payment_id VARCHAR(255),
  gateway_order_id VARCHAR(255),
  
  -- Metadata and tracking
  metadata JSONB,
  failure_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  
  -- Indexes for common queries
  CONSTRAINT unique_gateway_payment UNIQUE (gateway, gateway_payment_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_gateway_order_id ON payments(gateway, gateway_order_id);

-- =============================================
-- REFUNDS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES tourists(id) ON DELETE CASCADE,
  
  -- Refund details
  amount INTEGER NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled')),
  
  -- Gateway tracking
  gateway_refund_id VARCHAR(255),
  
  -- Admin tracking
  processed_by UUID REFERENCES users(id),
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  
  CONSTRAINT unique_gateway_refund UNIQUE (payment_id, gateway_refund_id)
);

-- Indexes for refunds
CREATE INDEX IF NOT EXISTS idx_refunds_payment_id ON refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_booking_id ON refunds(booking_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);
CREATE INDEX IF NOT EXISTS idx_refunds_processed_by ON refunds(processed_by);

-- =============================================
-- PAYMENT RECEIPTS TABLE (for quick lookups)
-- =============================================
CREATE TABLE IF NOT EXISTS payment_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL UNIQUE REFERENCES payments(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES tourists(id) ON DELETE CASCADE,
  receipt_number VARCHAR(50) NOT NULL UNIQUE,
  receipt_url TEXT, -- URL to PDF receipt if stored externally
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receipts_booking_id ON payment_receipts(booking_id);
CREATE INDEX IF NOT EXISTS idx_receipts_receipt_number ON payment_receipts(receipt_number);

-- =============================================
-- PRICING CONFIGURATION TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS pricing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Base pricing
  base_fee_per_person INTEGER NOT NULL DEFAULT 50000, -- ₹500 in paise
  processing_fee_percentage DECIMAL(5,2) NOT NULL DEFAULT 2.0,
  tax_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.0,
  
  -- Multipliers
  destination_multipliers JSONB NOT NULL DEFAULT '{}',
  seasonal_multipliers JSONB NOT NULL DEFAULT '{}',
  group_discounts JSONB NOT NULL DEFAULT '[]',
  
  -- Carbon offset pricing
  carbon_offset_fee_per_kg INTEGER NOT NULL DEFAULT 1000, -- ₹10 per kg in paise
  
  -- Version control
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_until TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only one active pricing config at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_pricing ON pricing_config(is_active) 
WHERE is_active = true;

-- =============================================
-- UPDATE TOURISTS TABLE
-- =============================================
-- Add payment-related fields to tourists table
ALTER TABLE tourists ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) 
  CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'refunded', 'failed'))
  DEFAULT 'unpaid';

ALTER TABLE tourists ADD COLUMN IF NOT EXISTS payment_amount INTEGER;
ALTER TABLE tourists ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES payments(id);

CREATE INDEX IF NOT EXISTS idx_tourists_payment_status ON tourists(payment_status);
CREATE INDEX IF NOT EXISTS idx_tourists_payment_id ON tourists(payment_id);

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_refunds_updated_at ON refunds;
CREATE TRIGGER update_refunds_updated_at BEFORE UPDATE ON refunds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pricing_config_updated_at ON pricing_config;
CREATE TRIGGER update_pricing_config_updated_at BEFORE UPDATE ON pricing_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to calculate booking price
CREATE OR REPLACE FUNCTION calculate_booking_price(
  p_destination_id UUID,
  p_group_size INTEGER,
  p_check_in_date DATE,
  p_carbon_footprint DECIMAL DEFAULT 0
)
RETURNS TABLE (
  base_amount INTEGER,
  destination_fee INTEGER,
  seasonal_adjustment INTEGER,
  group_discount INTEGER,
  carbon_offset_fee INTEGER,
  processing_fee INTEGER,
  tax_amount INTEGER,
  total_amount INTEGER
) AS $$
DECLARE
  v_config RECORD;
  v_base_amount INTEGER;
  v_destination_multiplier DECIMAL := 1.0;
  v_seasonal_multiplier DECIMAL := 1.0;
  v_discount_percentage DECIMAL := 0.0;
  v_subtotal INTEGER;
BEGIN
  -- Get active pricing config
  SELECT * INTO v_config FROM pricing_config 
  WHERE is_active = true 
  ORDER BY effective_from DESC 
  LIMIT 1;
  
  -- Calculate base amount
  v_base_amount := v_config.base_fee_per_person * p_group_size;
  
  -- Get destination multiplier based on ecological sensitivity
  SELECT 
    CASE 
      WHEN d.ecological_sensitivity = 'critical' THEN 2.0
      WHEN d.ecological_sensitivity = 'high' THEN 1.5
      WHEN d.ecological_sensitivity = 'medium' THEN 1.2
      ELSE 1.0
    END INTO v_destination_multiplier
  FROM destinations d
  WHERE d.id = p_destination_id;
  
  -- Get seasonal multiplier (simplified - can be enhanced)
  v_seasonal_multiplier := CASE 
    WHEN EXTRACT(MONTH FROM p_check_in_date) IN (4, 5, 6, 10, 11) THEN 1.3 -- Peak season
    ELSE 1.0 -- Off-peak
  END;
  
  -- Calculate group discount with COALESCE to handle NULL
  SELECT COALESCE(discount_percentage, 0) INTO v_discount_percentage
  FROM (
    SELECT 
      (elem->>'min_size')::INTEGER as min_size,
      (elem->>'discount_percentage')::DECIMAL as discount_percentage
    FROM jsonb_array_elements(v_config.group_discounts) elem
  ) discounts
  WHERE p_group_size >= min_size
  ORDER BY min_size DESC
  LIMIT 1;
  
  -- Ensure discount percentage is not NULL
  v_discount_percentage := COALESCE(v_discount_percentage, 0);
  
  -- Calculate fees
  v_subtotal := v_base_amount;
  
  RETURN QUERY SELECT
    v_base_amount,
    (v_base_amount * (v_destination_multiplier - 1))::INTEGER,
    (v_base_amount * (v_seasonal_multiplier - 1))::INTEGER,
    -(v_base_amount * v_discount_percentage / 100)::INTEGER,
    (p_carbon_footprint * v_config.carbon_offset_fee_per_kg)::INTEGER,
    ((v_subtotal * v_config.processing_fee_percentage / 100))::INTEGER,
    ((v_subtotal * v_config.tax_percentage / 100))::INTEGER,
    (v_base_amount * v_destination_multiplier * v_seasonal_multiplier * 
     (1 - v_discount_percentage/100) + 
     (p_carbon_footprint * v_config.carbon_offset_fee_per_kg) +
     (v_subtotal * v_config.processing_fee_percentage / 100) +
     (v_subtotal * v_config.tax_percentage / 100))::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Function to get payment statistics
CREATE OR REPLACE FUNCTION get_payment_statistics(
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  total_revenue BIGINT,
  total_transactions BIGINT,
  successful_payments BIGINT,
  failed_payments BIGINT,
  pending_payments BIGINT,
  total_refunds BIGINT,
  refund_amount BIGINT,
  average_transaction_value DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN status = 'succeeded' THEN amount ELSE 0 END), 0)::BIGINT as total_revenue,
    COUNT(*)::BIGINT as total_transactions,
    COUNT(CASE WHEN status = 'succeeded' THEN 1 END)::BIGINT as successful_payments,
    COUNT(CASE WHEN status = 'failed' THEN 1 END)::BIGINT as failed_payments,
    COUNT(CASE WHEN status IN ('pending', 'processing') THEN 1 END)::BIGINT as pending_payments,
    (SELECT COUNT(*) FROM refunds WHERE status = 'succeeded' 
     AND created_at BETWEEN p_start_date AND p_end_date)::BIGINT as total_refunds,
    COALESCE((SELECT SUM(amount) FROM refunds WHERE status = 'succeeded' 
     AND created_at BETWEEN p_start_date AND p_end_date), 0)::BIGINT as refund_amount,
    COALESCE(AVG(CASE WHEN status = 'succeeded' THEN amount END), 0)::DECIMAL as average_transaction_value
  FROM payments
  WHERE created_at BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_config ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
DROP POLICY IF EXISTS "System can insert payments" ON payments;
DROP POLICY IF EXISTS "System can update payments" ON payments;
DROP POLICY IF EXISTS "Users can view refunds for their payments" ON refunds;
DROP POLICY IF EXISTS "Admins can manage refunds" ON refunds;
DROP POLICY IF EXISTS "Users can view their own receipts" ON payment_receipts;
DROP POLICY IF EXISTS "Admins can view all receipts" ON payment_receipts;
DROP POLICY IF EXISTS "Anyone can view active pricing" ON pricing_config;
DROP POLICY IF EXISTS "Admins can manage pricing" ON pricing_config;

-- Policies for payments
CREATE POLICY "Users can view their own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments" ON payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

-- Tightened insert/update policies - only through service role or admin
CREATE POLICY "Admins can insert payments" ON payments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update payments" ON payments
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

-- Policies for refunds
CREATE POLICY "Users can view refunds for their payments" ON refunds
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM payments WHERE id = refunds.payment_id AND user_id = auth.uid())
  );

CREATE POLICY "Admins can manage refunds" ON refunds
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

-- Policies for receipts
CREATE POLICY "Users can view their own receipts" ON payment_receipts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM payments WHERE id = payment_receipts.payment_id AND user_id = auth.uid())
  );

CREATE POLICY "Admins can view all receipts" ON payment_receipts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

-- Policies for pricing config (read-only for users, write for admins)
CREATE POLICY "Anyone can view active pricing" ON pricing_config
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage pricing" ON pricing_config
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

-- =============================================
-- INITIAL DATA
-- =============================================

-- Insert default pricing configuration
INSERT INTO pricing_config (
  base_fee_per_person,
  processing_fee_percentage,
  tax_percentage,
  destination_multipliers,
  seasonal_multipliers,
  group_discounts,
  carbon_offset_fee_per_kg
) VALUES (
  50000, -- ₹500 base fee
  2.0,   -- 2% processing fee
  0.0,   -- 0% tax (can be updated based on requirements)
  '{"critical": 2.0, "high": 1.5, "medium": 1.2, "low": 1.0}'::jsonb,
  '{"peak": 1.3, "offpeak": 1.0}'::jsonb,
  '[{"min_size": 5, "discount_percentage": 10}, {"min_size": 10, "discount_percentage": 15}]'::jsonb,
  1000  -- ₹10 per kg carbon offset
) ON CONFLICT DO NOTHING;

-- =============================================
-- HELPFUL QUERIES & VIEWS
-- =============================================

-- View for payment summary with booking details
-- Fixed to prevent duplicate rows and include gateway IDs
DROP VIEW IF EXISTS payment_summary;
CREATE VIEW payment_summary AS
SELECT 
  p.id,
  p.booking_id,
  p.user_id,
  p.amount,
  p.currency,
  p.status as payment_status,
  p.payment_method,
  p.gateway,
  p.gateway_payment_id,
  p.gateway_order_id,
  p.created_at,
  p.paid_at,
  t.name as customer_name,
  t.email as customer_email,
  t.phone as customer_phone,
  t.status as booking_status,
  d.name as destination_name,
  t.check_in_date,
  t.check_out_date,
  t.group_size,
  CASE 
    WHEN EXISTS (SELECT 1 FROM refunds r WHERE r.payment_id = p.id AND r.status = 'succeeded') THEN 'refunded'
    ELSE p.status
  END as effective_status
FROM payments p
JOIN tourists t ON p.booking_id = t.id
JOIN destinations d ON t.destination_id = d.id;

COMMENT ON VIEW payment_summary IS 'Comprehensive view of payments with booking and customer details';
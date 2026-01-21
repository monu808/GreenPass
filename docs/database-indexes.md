# Database Index Documentation

This document outlines the required database indexes to optimize query performance for batch operations and common access patterns in the GreenPass application.

## Recommended Indexes

To ensure optimal performance, the following indexes should be applied to the Supabase PostgreSQL database.

### 1. Weather Data - Latest Queries
**Purpose:** Optimizes queries fetching the most recent weather information for a specific destination.
- **Table:** `weather_data`
- **Columns:** `destination_id`, `recorded_at DESC`
- **SQL:**
  ```sql
  CREATE INDEX IF NOT EXISTS idx_weather_data_destination_recorded_at 
  ON weather_data (destination_id, recorded_at DESC);
  ```

### 2. Tourists - Occupancy Calculations
**Purpose:** Speeds up calculations of current occupancy and capacity utilization per destination.
- **Table:** `tourists`
- **Columns:** `destination_id`
- **SQL:**
  ```sql
  CREATE INDEX IF NOT EXISTS idx_tourists_destination_id 
  ON tourists (destination_id);
  ```

### 3. Policy Violations - Lookup
**Purpose:** Improves performance when looking up violations for specific destinations.
- **Table:** `policy_violations`
- **Columns:** `destination_id`
- **SQL:**
  ```sql
  CREATE INDEX IF NOT EXISTS idx_policy_violations_destination_id 
  ON policy_violations (destination_id);
  ```

---

## Application Instructions

### Option 1: Supabase SQL Editor (Recommended)

1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project.
3. Click on the **SQL Editor** in the left sidebar.
4. Click **New Query**.
5. Copy and paste the following SQL script:

```sql
-- Optimization Indexes for Batch Operations

-- 1. Weather Data Index
CREATE INDEX IF NOT EXISTS idx_weather_data_destination_recorded_at 
ON weather_data (destination_id, recorded_at DESC);

-- 2. Tourists Index
CREATE INDEX IF NOT EXISTS idx_tourists_destination_id 
ON tourists (destination_id);

-- 3. Policy Violations Index
CREATE INDEX IF NOT EXISTS idx_policy_violations_destination_id 
ON policy_violations (destination_id);
```

6. Click **Run**.

### Option 2: Supabase CLI / Migration Tool

If you are using the Supabase CLI for local development or migrations:

1. Create a new migration file:
   ```bash
   supabase migration new add_performance_indexes
   ```
2. Paste the SQL script above into the newly created file in `supabase/migrations/`.
3. Apply the migration:
   ```bash
   supabase db push
   ```

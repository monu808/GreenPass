-- DATABASE MIGRATION: Fix for Issue #127 (Race Conditions)
-- Maintainer: Run this in Supabase SQL Editor.

CREATE OR REPLACE FUNCTION create_tourist_booking(p_tourist_data JSONB)
RETURNS JSONB AS $$
DECLARE
  v_dest_id UUID;
  v_group_size INT;
  v_status TEXT;
  v_current INT;
  v_max INT;
  v_new_tourist JSONB;
BEGIN
  -- Extract details
  v_dest_id := (p_tourist_data->>'destination_id')::UUID;
  v_group_size := (p_tourist_data->>'group_size')::INT;
  v_status := p_tourist_data->>'status';

  -- Validation: Ensure group size is valid
  IF v_group_size IS NULL OR v_group_size <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid group size');
  END IF;

  -- 🔒 LOCKING STEP
  SELECT current_occupancy, max_capacity
  INTO v_current, v_max
  FROM destinations
  WHERE id = v_dest_id
  FOR UPDATE;

  -- Validation: Destination must exist
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Destination not found');
  END IF;

  -- 🛡️ CAPACITY CHECK
  -- Only enforce hard capacity limits if the user is actually consuming space now
  IF (v_status = 'checked-in' OR v_status = 'approved') THEN
      IF (v_current + v_group_size) > v_max THEN
        RETURN jsonb_build_object('success', false, 'error', 'Capacity exceeded');
      END IF;
  END IF;

  -- 📝 INSERT
  INSERT INTO tourists
  SELECT * FROM jsonb_populate_record(NULL::tourists, p_tourist_data)
  RETURNING to_jsonb(tourists.*) INTO v_new_tourist;

  -- 🔄 UPDATE OCCUPANCY (Conditional)
  -- Only increment if the user is counted as "occupying" (checked-in or approved)
  IF (v_status = 'checked-in' OR v_status = 'approved') THEN
    UPDATE destinations
    SET current_occupancy = current_occupancy + v_group_size
    WHERE id = v_dest_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'data', v_new_tourist);

EXCEPTION WHEN OTHERS THEN
   RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;
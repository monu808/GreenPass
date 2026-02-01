-- DATABASE MIGRATION: Fix for Issue #127 (Race Conditions)
-- Maintainer: Please run this SQL in your Supabase SQL Editor to enable atomic bookings.

CREATE OR REPLACE FUNCTION create_tourist_booking(p_tourist_data JSONB)
RETURNS JSONB AS $$
DECLARE
  v_dest_id UUID;
  v_group_size INT;
  v_current INT;
  v_max INT;
  v_new_tourist JSONB;
BEGIN
  -- Extract destination and group size from the input JSON
  v_dest_id := (p_tourist_data->>'destination_id')::UUID;
  v_group_size := (p_tourist_data->>'group_size')::INT;

  -- 🔒 LOCKING STEP:
  -- Select the destination row FOR UPDATE. 
  -- This locks the row so no other transaction can read/write it until this one finishes.
  SELECT current_occupancy, max_capacity
  INTO v_current, v_max
  FROM destinations
  WHERE id = v_dest_id
  FOR UPDATE;

  -- 🛡️ CAPACITY CHECK:
  -- Verify capacity inside the lock
  IF (v_current + v_group_size) > v_max THEN
    RETURN jsonb_build_object('success', false, 'error', 'Capacity exceeded');
  END IF;

  -- 📝 INSERT:
  INSERT INTO tourists
  SELECT * FROM jsonb_populate_record(NULL::tourists, p_tourist_data)
  RETURNING to_jsonb(tourists.*) INTO v_new_tourist;

  -- 🔄 UPDATE:
  UPDATE destinations
  SET current_occupancy = current_occupancy + v_group_size
  WHERE id = v_dest_id;

  -- Return success with the new record
  RETURN jsonb_build_object('success', true, 'data', v_new_tourist);

EXCEPTION WHEN OTHERS THEN
   -- Catch any other SQL errors
   RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;
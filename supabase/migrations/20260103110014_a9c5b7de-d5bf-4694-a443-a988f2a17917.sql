-- Add new columns to nearby_sales for REINZ CSV data
ALTER TABLE nearby_sales ADD COLUMN IF NOT EXISTS days_to_sell integer;
ALTER TABLE nearby_sales ADD COLUMN IF NOT EXISTS valuation numeric;
ALTER TABLE nearby_sales ADD COLUMN IF NOT EXISTS bedrooms integer;
ALTER TABLE nearby_sales ADD COLUMN IF NOT EXISTS floor_area numeric;
ALTER TABLE nearby_sales ADD COLUMN IF NOT EXISTS land_area numeric;
ALTER TABLE nearby_sales ADD COLUMN IF NOT EXISTS source_file text;

-- Create unique constraint for deduplication (drop if exists first)
DROP INDEX IF EXISTS nearby_sales_unique_address;
CREATE UNIQUE INDEX nearby_sales_unique_address 
  ON nearby_sales (street_number, street_name, suburb, city);
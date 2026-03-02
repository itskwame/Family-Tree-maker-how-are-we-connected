/*
  # Add Profile Location Metadata

  ## Goals
  - Capture city, state, country, and postal code on every profile
  - Keep postal code validation flexible enough for international formats
  - Surface locations efficiently through a composite index
  - Keep existing constraints and policies untouched so RLS behavior is preserved
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
      AND column_name = 'city'
  ) THEN
    ALTER TABLE profiles ADD COLUMN city text;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
      AND column_name = 'state'
  ) THEN
    ALTER TABLE profiles ADD COLUMN state text;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
      AND column_name = 'country'
  ) THEN
    ALTER TABLE profiles ADD COLUMN country text;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
      AND column_name = 'zip'
  ) THEN
    ALTER TABLE profiles ADD COLUMN zip text;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_zip_format'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_zip_format
      CHECK (zip ~* '^[A-Za-z0-9\\- ]{2,20}$' OR zip IS NULL);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_location_path
  ON profiles(country, state, city, zip);

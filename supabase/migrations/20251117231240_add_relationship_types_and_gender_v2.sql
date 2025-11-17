/*
  # Add Relationship Types and Gender Support

  ## Overview
  Adds critical fields to properly model family relationships and enable relationship-based tree building.

  ## Changes to `family_members` table
    - Add `gender` column (male, female, other)
    - Add `death_date` column for deceased members
    - Add `is_deceased` boolean flag
    - Add `mother_id` and `father_id` for direct parent links
    - Add `mother_name` and `father_name` for manual entry
    - Add indexes for parent lookups

  ## Changes to `relationships` table
    - Add `relationship_type` column (parent, child, spouse, sibling, step_parent, step_child, etc.)
    - Add check constraint to prevent self-relationships

  ## Changes to `profiles` table
    - Add `gender` column
    - Add `onboarding_completed` flag
    - Add `is_family_admin` boolean flag
    - Add `can_edit_tree` boolean flag for collaborators
    - Add `mother_name` and `father_name` for onboarding

  ## New Tables
    - `family_groups` - Main family group/tree
    - `family_group_members` - Links users to family groups

  ## Security
    - Enable RLS on all new tables
    - Add policies for family group access
*/

-- Add gender and parent tracking to family_members
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'family_members' AND column_name = 'gender') THEN
    ALTER TABLE family_members ADD COLUMN gender text CHECK (gender IN ('male', 'female', 'other'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'family_members' AND column_name = 'death_date') THEN
    ALTER TABLE family_members ADD COLUMN death_date date;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'family_members' AND column_name = 'is_deceased') THEN
    ALTER TABLE family_members ADD COLUMN is_deceased boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'family_members' AND column_name = 'mother_id') THEN
    ALTER TABLE family_members ADD COLUMN mother_id uuid REFERENCES family_members(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'family_members' AND column_name = 'father_id') THEN
    ALTER TABLE family_members ADD COLUMN father_id uuid REFERENCES family_members(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'family_members' AND column_name = 'mother_name') THEN
    ALTER TABLE family_members ADD COLUMN mother_name text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'family_members' AND column_name = 'father_name') THEN
    ALTER TABLE family_members ADD COLUMN father_name text;
  END IF;
END $$;

-- Add relationship type to relationships table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'relationships' AND column_name = 'relationship_type') THEN
    ALTER TABLE relationships ADD COLUMN relationship_type text CHECK (relationship_type IN (
      'parent', 'child', 'spouse', 'sibling', 
      'step_parent', 'step_child', 'half_sibling',
      'grandparent', 'grandchild', 'aunt_uncle', 'niece_nephew', 'cousin'
    ));
  END IF;
END $$;

-- Add check constraint to prevent self-relationships
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'no_self_relationship') THEN
    ALTER TABLE relationships ADD CONSTRAINT no_self_relationship 
      CHECK (parent_id != child_id);
  END IF;
END $$;

-- Add onboarding and role fields to profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'gender') THEN
    ALTER TABLE profiles ADD COLUMN gender text CHECK (gender IN ('male', 'female', 'other'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'onboarding_completed') THEN
    ALTER TABLE profiles ADD COLUMN onboarding_completed boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_family_admin') THEN
    ALTER TABLE profiles ADD COLUMN is_family_admin boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'can_edit_tree') THEN
    ALTER TABLE profiles ADD COLUMN can_edit_tree boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'mother_name') THEN
    ALTER TABLE profiles ADD COLUMN mother_name text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'father_name') THEN
    ALTER TABLE profiles ADD COLUMN father_name text;
  END IF;
END $$;

-- Create family_groups table
CREATE TABLE IF NOT EXISTS family_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  admin_user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Create family_group_members table (must be created before RLS policies reference it)
CREATE TABLE IF NOT EXISTS family_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id uuid REFERENCES family_groups(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'member' CHECK (role IN ('admin', 'collaborator', 'member')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(family_group_id, user_id)
);

-- Enable RLS on family_groups
ALTER TABLE family_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their family groups"
  ON family_groups FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM family_group_members
      WHERE family_group_members.family_group_id = family_groups.id
      AND family_group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update family groups"
  ON family_groups FOR UPDATE
  TO authenticated
  USING (admin_user_id = auth.uid())
  WITH CHECK (admin_user_id = auth.uid());

CREATE POLICY "Users can create family groups"
  ON family_groups FOR INSERT
  TO authenticated
  WITH CHECK (admin_user_id = auth.uid());

-- Enable RLS on family_group_members
ALTER TABLE family_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their family group memberships"
  ON family_group_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM family_group_members fgm
      WHERE fgm.family_group_id = family_group_members.family_group_id
      AND fgm.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage group members"
  ON family_group_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM family_groups
      WHERE family_groups.id = family_group_members.family_group_id
      AND family_groups.admin_user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_family_members_mother ON family_members(mother_id);
CREATE INDEX IF NOT EXISTS idx_family_members_father ON family_members(father_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user ON family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_relationships_type ON relationships(relationship_type);
CREATE INDEX IF NOT EXISTS idx_family_group_members_user ON family_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_family_group_members_group ON family_group_members(family_group_id);

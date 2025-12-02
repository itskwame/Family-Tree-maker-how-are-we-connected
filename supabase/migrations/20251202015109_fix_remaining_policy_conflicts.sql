/*
  # Fix Remaining Policy Conflicts

  ## Issues Fixed
  
  1. Multiple Permissive Policies
     - Table `family_group_members` has overlapping SELECT policies
     - Table `subscriptions` has overlapping SELECT policies
  
  ## Solution
  
  Consolidate overlapping policies into single, comprehensive policies that handle all cases.
  
  ## Security Notes
  
  - Maintains all existing access patterns
  - No data access changes
  - Cleaner, more maintainable security model
*/

-- ============================================
-- Fix family_group_members duplicate SELECT policies
-- ============================================

-- Drop existing overlapping policies
DROP POLICY IF EXISTS "Users can view family group members" ON family_group_members;
DROP POLICY IF EXISTS "Admins can manage group members" ON family_group_members;

-- Create consolidated SELECT policy
CREATE POLICY "Users can view family group members"
  ON family_group_members FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM family_groups
      WHERE family_groups.id = family_group_members.family_group_id
      AND family_groups.admin_user_id = (select auth.uid())
    )
  );

-- Create separate policies for other actions (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can add group members"
  ON family_group_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM family_groups
      WHERE family_groups.id = family_group_members.family_group_id
      AND family_groups.admin_user_id = (select auth.uid())
    )
  );

CREATE POLICY "Admins can update group members"
  ON family_group_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM family_groups
      WHERE family_groups.id = family_group_members.family_group_id
      AND family_groups.admin_user_id = (select auth.uid())
    )
  );

CREATE POLICY "Admins can remove group members"
  ON family_group_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM family_groups
      WHERE family_groups.id = family_group_members.family_group_id
      AND family_groups.admin_user_id = (select auth.uid())
    )
  );

-- ============================================
-- Fix subscriptions duplicate SELECT policies
-- ============================================

-- Drop existing overlapping policies
DROP POLICY IF EXISTS "Admins and family admins can view subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can manage subscriptions" ON subscriptions;

-- Create consolidated SELECT policy
CREATE POLICY "View subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('admin', 'staff')
    ) OR
    EXISTS (
      SELECT 1 FROM family_groups
      WHERE family_groups.id = subscriptions.family_group_id
      AND family_groups.admin_user_id = (select auth.uid())
    )
  );

-- Create separate policies for admin-only actions
CREATE POLICY "Admins can create subscriptions"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admins can update subscriptions"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admins can delete subscriptions"
  ON subscriptions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('admin', 'staff')
    )
  );

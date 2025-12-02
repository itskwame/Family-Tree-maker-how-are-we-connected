/*
  # Fix Security and Performance Issues

  ## 1. Add Missing Indexes on Foreign Keys
  
  Foreign keys without indexes can cause significant performance degradation on DELETE and UPDATE operations.
  Adding indexes on all foreign key columns to improve query performance.

  ### Indexes Added:
  - admin_settings: updated_by
  - businesses: owner_id
  - comments: author_id
  - content_flags: reported_by, reviewed_by
  - event_rsvps: user_id
  - events: creator_id
  - family_groups: admin_user_id
  - family_members: created_by
  - invitations: family_member_id, sender_id
  - notifications: actor_id
  - post_comments: post_id, profile_id
  - post_likes: profile_id
  - reactions: user_id
  - subscriptions: family_group_id
  - tree_templates: root_member_id, user_id

  ## 2. Optimize RLS Policies with SELECT Wrapper
  
  Wrapping auth.uid() calls in SELECT prevents re-evaluation for each row, significantly improving performance at scale.
  All RLS policies updated to use (select auth.uid()) pattern.

  ## 3. Remove Duplicate Policies
  
  Multiple permissive policies for the same action can cause confusion and performance issues.
  Consolidating duplicate policies into single, clear policies.

  ## 4. Remove Duplicate Indexes
  
  Duplicate indexes waste storage and slow down write operations.
  Removing idx_family_members_user (keeping idx_family_members_user_id).

  ## 5. Fix Function Search Path
  
  Mutable search paths in functions can cause security vulnerabilities.
  Setting explicit search path for handle_new_user function.
*/

-- ============================================
-- PART 1: Add Missing Foreign Key Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_admin_settings_updated_by ON admin_settings(updated_by);
CREATE INDEX IF NOT EXISTS idx_businesses_owner_id ON businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_content_flags_reported_by ON content_flags(reported_by);
CREATE INDEX IF NOT EXISTS idx_content_flags_reviewed_by ON content_flags(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_user_id ON event_rsvps(user_id);
CREATE INDEX IF NOT EXISTS idx_events_creator_id ON events(creator_id);
CREATE INDEX IF NOT EXISTS idx_family_groups_admin_user_id ON family_groups(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_created_by ON family_members(created_by);
CREATE INDEX IF NOT EXISTS idx_invitations_family_member_id ON invitations(family_member_id);
CREATE INDEX IF NOT EXISTS idx_invitations_sender_id ON invitations(sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_actor_id ON notifications(actor_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_profile_id ON post_comments(profile_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_profile_id ON post_likes(profile_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_family_group_id ON subscriptions(family_group_id);
CREATE INDEX IF NOT EXISTS idx_tree_templates_root_member_id ON tree_templates(root_member_id);
CREATE INDEX IF NOT EXISTS idx_tree_templates_user_id ON tree_templates(user_id);

-- ============================================
-- PART 2: Remove Duplicate Index
-- ============================================

DROP INDEX IF EXISTS idx_family_members_user;

-- ============================================
-- PART 3: Optimize RLS Policies
-- ============================================

-- Profiles table
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()));

-- Family members table
DROP POLICY IF EXISTS "Users can create family members" ON family_members;
DROP POLICY IF EXISTS "Users can update family members they created" ON family_members;

CREATE POLICY "Users can create family members"
  ON family_members FOR INSERT
  TO authenticated
  WITH CHECK (created_by = (select auth.uid()));

CREATE POLICY "Users can update family members they created"
  ON family_members FOR UPDATE
  TO authenticated
  USING (created_by = (select auth.uid()))
  WITH CHECK (created_by = (select auth.uid()));

-- Posts table - Remove duplicates and optimize
DROP POLICY IF EXISTS "Users can view family posts" ON posts;
DROP POLICY IF EXISTS "Anyone can view posts" ON posts;
DROP POLICY IF EXISTS "Users can create posts" ON posts;
DROP POLICY IF EXISTS "Users create own posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users update own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
DROP POLICY IF EXISTS "Users delete own posts" ON posts;

CREATE POLICY "Users can view posts"
  ON posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (author_id = (select auth.uid()));

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  TO authenticated
  USING (author_id = (select auth.uid()))
  WITH CHECK (author_id = (select auth.uid()));

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  TO authenticated
  USING (author_id = (select auth.uid()));

-- Comments table
DROP POLICY IF EXISTS "Users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;

CREATE POLICY "Users can create comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (author_id = (select auth.uid()));

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (author_id = (select auth.uid()))
  WITH CHECK (author_id = (select auth.uid()));

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (author_id = (select auth.uid()));

-- Reactions table
DROP POLICY IF EXISTS "Users can create own reactions" ON reactions;
DROP POLICY IF EXISTS "Users can delete own reactions" ON reactions;

CREATE POLICY "Users can create reactions"
  ON reactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete reactions"
  ON reactions FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Businesses table - Remove duplicates and optimize
DROP POLICY IF EXISTS "Users can create own businesses" ON businesses;
DROP POLICY IF EXISTS "Users create own business" ON businesses;
DROP POLICY IF EXISTS "Users can update own businesses" ON businesses;
DROP POLICY IF EXISTS "Users update own business" ON businesses;
DROP POLICY IF EXISTS "Users can delete own businesses" ON businesses;
DROP POLICY IF EXISTS "Users delete own business" ON businesses;
DROP POLICY IF EXISTS "Anyone can view businesses" ON businesses;
DROP POLICY IF EXISTS "Users can view all businesses" ON businesses;

CREATE POLICY "Users can view businesses"
  ON businesses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create businesses"
  ON businesses FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = (select auth.uid()));

CREATE POLICY "Users can update own businesses"
  ON businesses FOR UPDATE
  TO authenticated
  USING (owner_id = (select auth.uid()))
  WITH CHECK (owner_id = (select auth.uid()));

CREATE POLICY "Users can delete own businesses"
  ON businesses FOR DELETE
  TO authenticated
  USING (owner_id = (select auth.uid()));

-- Messages table
DROP POLICY IF EXISTS "Users can view messages they sent or received" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update messages they received" ON messages;

CREATE POLICY "Users can view their messages"
  ON messages FOR SELECT
  TO authenticated
  USING (sender_id = (select auth.uid()) OR recipient_id = (select auth.uid()));

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = (select auth.uid()));

CREATE POLICY "Users can update received messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (recipient_id = (select auth.uid()))
  WITH CHECK (recipient_id = (select auth.uid()));

-- Tree templates table
DROP POLICY IF EXISTS "Users can view own templates" ON tree_templates;
DROP POLICY IF EXISTS "Users can create own templates" ON tree_templates;
DROP POLICY IF EXISTS "Users can update own templates" ON tree_templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON tree_templates;

CREATE POLICY "Users can view own templates"
  ON tree_templates FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create templates"
  ON tree_templates FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own templates"
  ON tree_templates FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own templates"
  ON tree_templates FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Family groups table
DROP POLICY IF EXISTS "Users can view their family groups" ON family_groups;
DROP POLICY IF EXISTS "Admins can update family groups" ON family_groups;
DROP POLICY IF EXISTS "Users can create family groups" ON family_groups;

CREATE POLICY "Users can view their family groups"
  ON family_groups FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM family_group_members
      WHERE family_group_members.family_group_id = family_groups.id
      AND family_group_members.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Admins can update family groups"
  ON family_groups FOR UPDATE
  TO authenticated
  USING (admin_user_id = (select auth.uid()))
  WITH CHECK (admin_user_id = (select auth.uid()));

CREATE POLICY "Users can create family groups"
  ON family_groups FOR INSERT
  TO authenticated
  WITH CHECK (admin_user_id = (select auth.uid()));

-- Family group members table
DROP POLICY IF EXISTS "Users can view their family group memberships" ON family_group_members;
DROP POLICY IF EXISTS "Admins can manage group members" ON family_group_members;

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

CREATE POLICY "Admins can manage group members"
  ON family_group_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM family_groups
      WHERE family_groups.id = family_group_members.family_group_id
      AND family_groups.admin_user_id = (select auth.uid())
    )
  );

-- Post comments table
DROP POLICY IF EXISTS "Users create comments" ON post_comments;
DROP POLICY IF EXISTS "Users update own comments" ON post_comments;
DROP POLICY IF EXISTS "Users delete own comments" ON post_comments;

CREATE POLICY "Users can create comments"
  ON post_comments FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = (select auth.uid()));

CREATE POLICY "Users can update own comments"
  ON post_comments FOR UPDATE
  TO authenticated
  USING (profile_id = (select auth.uid()))
  WITH CHECK (profile_id = (select auth.uid()));

CREATE POLICY "Users can delete own comments"
  ON post_comments FOR DELETE
  TO authenticated
  USING (profile_id = (select auth.uid()));

-- Post likes table
DROP POLICY IF EXISTS "Users can like" ON post_likes;
DROP POLICY IF EXISTS "Users can unlike" ON post_likes;

CREATE POLICY "Users can like posts"
  ON post_likes FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = (select auth.uid()));

CREATE POLICY "Users can unlike posts"
  ON post_likes FOR DELETE
  TO authenticated
  USING (profile_id = (select auth.uid()));

-- Events table
DROP POLICY IF EXISTS "Users can create events" ON events;
DROP POLICY IF EXISTS "Creators can update their events" ON events;
DROP POLICY IF EXISTS "Creators can delete their events" ON events;

CREATE POLICY "Users can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = (select auth.uid()));

CREATE POLICY "Creators can update events"
  ON events FOR UPDATE
  TO authenticated
  USING (creator_id = (select auth.uid()))
  WITH CHECK (creator_id = (select auth.uid()));

CREATE POLICY "Creators can delete events"
  ON events FOR DELETE
  TO authenticated
  USING (creator_id = (select auth.uid()));

-- Event RSVPs table
DROP POLICY IF EXISTS "Users can manage their own RSVPs" ON event_rsvps;
DROP POLICY IF EXISTS "Users can update their own RSVPs" ON event_rsvps;
DROP POLICY IF EXISTS "Users can delete their own RSVPs" ON event_rsvps;

CREATE POLICY "Users can manage their RSVPs"
  ON event_rsvps FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their RSVPs"
  ON event_rsvps FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their RSVPs"
  ON event_rsvps FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Notifications table
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;

CREATE POLICY "Users can view their notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can update their notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Invitations table
DROP POLICY IF EXISTS "Users can view invitations they sent" ON invitations;
DROP POLICY IF EXISTS "Anyone can view invitations by code" ON invitations;
DROP POLICY IF EXISTS "Users can create invitations" ON invitations;
DROP POLICY IF EXISTS "Users can update their sent invitations" ON invitations;

CREATE POLICY "Users can view invitations"
  ON invitations FOR SELECT
  TO authenticated
  USING (sender_id = (select auth.uid()) OR true);

CREATE POLICY "Users can create invitations"
  ON invitations FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = (select auth.uid()));

CREATE POLICY "Users can update invitations"
  ON invitations FOR UPDATE
  TO authenticated
  USING (sender_id = (select auth.uid()))
  WITH CHECK (sender_id = (select auth.uid()));

-- Admin settings table
DROP POLICY IF EXISTS "Admins can manage settings" ON admin_settings;

CREATE POLICY "Admins can manage settings"
  ON admin_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Audit logs table
DROP POLICY IF EXISTS "Admins can view logs" ON audit_logs;

CREATE POLICY "Admins can view logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Subscriptions table
DROP POLICY IF EXISTS "Admins can manage subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Family admins can view their subscription" ON subscriptions;

CREATE POLICY "Admins and family admins can view subscriptions"
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

CREATE POLICY "Admins can manage subscriptions"
  ON subscriptions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Content flags table
DROP POLICY IF EXISTS "Admins can manage flags" ON content_flags;
DROP POLICY IF EXISTS "Users can create flags" ON content_flags;

CREATE POLICY "Authenticated users can view flags"
  ON content_flags FOR SELECT
  TO authenticated
  USING (
    reported_by = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Users can create flags"
  ON content_flags FOR INSERT
  TO authenticated
  WITH CHECK (reported_by = (select auth.uid()));

CREATE POLICY "Admins can manage flags"
  ON content_flags FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- ============================================
-- PART 4: Fix Function Search Path
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at)
  VALUES (NEW.id, NEW.email, NEW.created_at)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

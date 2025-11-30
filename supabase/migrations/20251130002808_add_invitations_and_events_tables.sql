/*
  # Add Invitations and Events Tables for Viral Growth

  ## 1. New Tables
    
    ### `invitations`
      - `id` (uuid, primary key)
      - `sender_id` (uuid, references auth.users) - Who sent the invite
      - `recipient_email` (text) - Email of person being invited
      - `recipient_phone` (text, nullable) - Phone of person being invited
      - `family_member_id` (uuid, nullable) - The family member profile being claimed
      - `invite_code` (text, unique) - Unique shareable code
      - `status` (text) - pending, accepted, expired
      - `message` (text, nullable) - Optional personal message
      - `expires_at` (timestamptz) - When the invite expires
      - `accepted_at` (timestamptz, nullable) - When accepted
      - `created_at` (timestamptz)
    
    ### `events`
      - `id` (uuid, primary key)
      - `creator_id` (uuid, references auth.users)
      - `title` (text) - Event name
      - `description` (text, nullable)
      - `event_type` (text) - reunion, birthday, anniversary, etc.
      - `event_date` (timestamptz)
      - `location` (text, nullable)
      - `cover_image_url` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    ### `event_rsvps`
      - `id` (uuid, primary key)
      - `event_id` (uuid, references events)
      - `user_id` (uuid, references auth.users)
      - `status` (text) - attending, maybe, not_attending
      - `guest_count` (integer) - Number of additional guests
      - `notes` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    ### `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users) - Who receives the notification
      - `actor_id` (uuid, nullable) - Who triggered it
      - `type` (text) - new_member, photo_added, event_created, etc.
      - `title` (text)
      - `message` (text)
      - `link` (text, nullable) - Where to go when clicked
      - `read` (boolean) - Has user seen it
      - `created_at` (timestamptz)

  ## 2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their data
*/

-- Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_email text,
  recipient_phone text,
  family_member_id uuid REFERENCES family_members(id) ON DELETE SET NULL,
  invite_code text UNIQUE NOT NULL DEFAULT substring(md5(random()::text) from 1 for 12),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  message text,
  expires_at timestamptz DEFAULT (now() + interval '30 days'),
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invitations they sent"
  ON invitations FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid());

CREATE POLICY "Users can create invitations"
  ON invitations FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update their sent invitations"
  ON invitations FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Anyone can view invitations by code"
  ON invitations FOR SELECT
  TO authenticated
  USING (true);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_type text DEFAULT 'other' CHECK (event_type IN ('reunion', 'birthday', 'anniversary', 'graduation', 'memorial', 'wedding', 'holiday', 'other')),
  event_date timestamptz NOT NULL,
  location text,
  cover_image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view events"
  ON events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Creators can update their events"
  ON events FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Creators can delete their events"
  ON events FOR DELETE
  TO authenticated
  USING (creator_id = auth.uid());

-- Create event_rsvps table
CREATE TABLE IF NOT EXISTS event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'attending' CHECK (status IN ('attending', 'maybe', 'not_attending')),
  guest_count integer DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view RSVPs"
  ON event_rsvps FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their own RSVPs"
  ON event_rsvps FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own RSVPs"
  ON event_rsvps FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own RSVPs"
  ON event_rsvps FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('new_member', 'photo_added', 'event_created', 'event_updated', 'rsvp_update', 'business_added', 'post_created', 'comment_added', 'profile_update', 'invitation_sent', 'connection_found')),
  title text NOT NULL,
  message text NOT NULL,
  link text,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invitations_code ON invitations(invite_code);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

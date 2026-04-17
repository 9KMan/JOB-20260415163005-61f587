-- Supabase Database Schema for Amanda AI MVP
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Trips table
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'abandoned')),
  stripe_session_id TEXT,
  stripe_payment_status TEXT,
  share_code TEXT UNIQUE NOT NULL,
  results JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Participants table
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  consent_terms BOOLEAN DEFAULT FALSE,
  consent_privacy BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'abandoned')),
  current_question_index INTEGER DEFAULT 0,
  reminder_count INTEGER DEFAULT 0,
  last_response_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trip_id, phone)
);

-- Questions table (predefined for golf trips)
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  options TEXT[] NOT NULL,
  question_order INTEGER NOT NULL,
  UNIQUE(trip_id, question_order)
);

-- Responses table
CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant_id, question_id)
);

-- Create indexes
CREATE INDEX idx_participants_trip_id ON participants(trip_id);
CREATE INDEX idx_participants_status ON participants(status);
CREATE INDEX idx_responses_participant_id ON responses(participant_id);
CREATE INDEX idx_questions_trip_id ON questions(trip_id);

-- Enable Row Level Security
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Trips: Admin can manage their own trips, public can read active trips
CREATE POLICY "Admin manages own trips" ON trips
  FOR ALL USING (auth.uid() = admin_id);

CREATE POLICY "Public can view active trips" ON trips
  FOR SELECT USING (status = 'active');

-- Participants: Anyone can insert participants, admin can view all for their trips
CREATE POLICY "Anyone can join a trip" ON participants
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can view participants" ON participants
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM trips WHERE trips.id = participants.trip_id AND trips.admin_id = auth.uid())
  );

CREATE POLICY "Participants can update own status" ON participants
  FOR UPDATE USING (true);

-- Questions: Readable by all, writable only by admin of the trip
CREATE POLICY "Anyone can view questions" ON questions
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage questions" ON questions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM trips WHERE trips.id = questions.trip_id AND trips.admin_id = auth.uid())
  );

-- Responses: Participants can insert their own, admin can view all
CREATE POLICY "Participants can insert responses" ON responses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can view responses" ON responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM participants p
      JOIN trips t ON t.id = p.trip_id
      WHERE p.id = responses.participant_id AND t.admin_id = auth.uid()
    )
  );

-- Functions

-- Function to generate share code
CREATE OR REPLACE FUNCTION generate_share_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_participants_updated_at
  BEFORE UPDATE ON participants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

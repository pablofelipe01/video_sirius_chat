-- Migration 004: Add transcriptions table for meeting transcriptions
-- This table will store transcriptions from AssemblyAI

CREATE TABLE IF NOT EXISTS meeting_transcriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  assembly_id VARCHAR(255), -- AssemblyAI transcript ID
  transcript_text TEXT, -- Full transcript text
  transcript_json JSONB, -- Complete AssemblyAI response with timestamps, words, etc.
  status VARCHAR(50) DEFAULT 'processing', -- processing, completed, failed
  audio_url TEXT, -- URL to the audio file that was transcribed
  language_code VARCHAR(10) DEFAULT 'es', -- Language of transcription
  confidence DECIMAL(3,2), -- Overall confidence score
  audio_duration INTEGER, -- Duration in seconds
  word_count INTEGER, -- Number of words in transcript
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE -- When transcription was completed
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_meeting_transcriptions_meeting_id ON meeting_transcriptions(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_transcriptions_status ON meeting_transcriptions(status);
CREATE INDEX IF NOT EXISTS idx_meeting_transcriptions_assembly_id ON meeting_transcriptions(assembly_id);

-- Add RLS policies for meeting_transcriptions
ALTER TABLE meeting_transcriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view transcriptions for meetings they're involved in
CREATE POLICY "Allow users to view transcriptions for their meetings" ON meeting_transcriptions
FOR SELECT USING (
  meeting_id IN (
    SELECT id FROM meetings 
    WHERE host_cedula = auth.jwt() ->> 'cedula'
    OR id IN (
      SELECT meeting_id FROM meeting_participants 
      WHERE participant_cedula = auth.jwt() ->> 'cedula'
    )
  )
);

-- Policy: Only hosts can create transcriptions for their meetings
CREATE POLICY "Allow hosts to create transcriptions" ON meeting_transcriptions
FOR INSERT WITH CHECK (
  meeting_id IN (
    SELECT id FROM meetings 
    WHERE host_cedula = auth.jwt() ->> 'cedula'
  )
);

-- Policy: Only hosts can update transcriptions for their meetings
CREATE POLICY "Allow hosts to update transcriptions" ON meeting_transcriptions
FOR UPDATE USING (
  meeting_id IN (
    SELECT id FROM meetings 
    WHERE host_cedula = auth.jwt() ->> 'cedula'
  )
);

-- Policy: Only hosts can delete transcriptions for their meetings
CREATE POLICY "Allow hosts to delete transcriptions" ON meeting_transcriptions
FOR DELETE USING (
  meeting_id IN (
    SELECT id FROM meetings 
    WHERE host_cedula = auth.jwt() ->> 'cedula'
  )
);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_meeting_transcriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_meeting_transcriptions_updated_at
  BEFORE UPDATE ON meeting_transcriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_meeting_transcriptions_updated_at();

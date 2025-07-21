-- Migration 002: Add missing RLS policies for meeting_participants
-- Date: 2025-07-21
-- Description: Add Row Level Security policies for meeting_participants table

-- Políticas para meeting_participants
CREATE POLICY "Allow insert meeting participants" ON meeting_participants 
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow select meeting participants" ON meeting_participants 
FOR SELECT USING (true);

CREATE POLICY "Allow update meeting participants" ON meeting_participants 
FOR UPDATE USING (true);

CREATE POLICY "Allow delete meeting participants" ON meeting_participants 
FOR DELETE USING (true);

-- Políticas para meeting_summaries
CREATE POLICY "Allow insert meeting summaries" ON meeting_summaries 
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow select meeting summaries" ON meeting_summaries 
FOR SELECT USING (true);

CREATE POLICY "Allow update meeting summaries" ON meeting_summaries 
FOR UPDATE USING (true);

-- Política adicional para permitir updates en meetings
CREATE POLICY "Allow update meetings" ON meetings 
FOR UPDATE USING (true);

-- Comentarios
COMMENT ON POLICY "Allow insert meeting participants" ON meeting_participants IS 'Permite insertar participantes en reuniones';
COMMENT ON POLICY "Allow select meeting participants" ON meeting_participants IS 'Permite leer participantes de reuniones';
COMMENT ON POLICY "Allow update meeting participants" ON meeting_participants IS 'Permite actualizar datos de participantes';
COMMENT ON POLICY "Allow delete meeting participants" ON meeting_participants IS 'Permite eliminar participantes de reuniones';

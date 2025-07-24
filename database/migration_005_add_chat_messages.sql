-- Migration 005: Add chat messages table for SuperChat functionality
-- Video Chat Platform - Sirius Regenerative Solutions

-- Tabla de mensajes de chat durante videollamadas
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    room_id VARCHAR(100) NOT NULL, -- Para relacionar con videollamadas activas
    sender_cedula VARCHAR(20) REFERENCES employees(cedula),
    sender_name VARCHAR(200) NOT NULL, -- Para invitados externos
    sender_type VARCHAR(20) DEFAULT 'internal' CHECK (sender_type IN ('internal', 'external', 'system')),
    message_text TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'reaction', 'file', 'join', 'leave')),
    reply_to_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}', -- Para datos adicionales (archivos, reacciones, etc.)
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_meeting_id ON chat_messages(meeting_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_cedula);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_chat_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chat_messages_updated_at
    BEFORE UPDATE ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_messages_updated_at();

-- RLS (Row Level Security) para chat_messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: Los usuarios pueden ver mensajes de reuniones donde participan
CREATE POLICY "Users can view chat messages from their meetings" ON chat_messages
    FOR SELECT USING (
        -- Si es empleado, puede ver mensajes de reuniones donde participa
        (sender_cedula = auth.jwt() ->> 'cedula') OR
        EXISTS (
            SELECT 1 FROM meeting_participants mp 
            WHERE mp.meeting_id = chat_messages.meeting_id 
            AND mp.participant_cedula = auth.jwt() ->> 'cedula'
        ) OR
        -- Si es host de la reunión
        EXISTS (
            SELECT 1 FROM meetings m 
            WHERE m.id = chat_messages.meeting_id 
            AND m.host_cedula = auth.jwt() ->> 'cedula'
        )
    );

-- Política para INSERT: Los usuarios pueden enviar mensajes a reuniones donde participan
CREATE POLICY "Users can send messages to their meetings" ON chat_messages
    FOR INSERT WITH CHECK (
        -- Verificar que el usuario participa en la reunión
        EXISTS (
            SELECT 1 FROM meeting_participants mp 
            WHERE mp.meeting_id = chat_messages.meeting_id 
            AND mp.participant_cedula = auth.jwt() ->> 'cedula'
        ) OR
        -- O es el host
        EXISTS (
            SELECT 1 FROM meetings m 
            WHERE m.id = chat_messages.meeting_id 
            AND m.host_cedula = auth.jwt() ->> 'cedula'
        )
    );

-- Política para UPDATE: Solo el sender puede editar sus propios mensajes
CREATE POLICY "Users can edit their own messages" ON chat_messages
    FOR UPDATE USING (sender_cedula = auth.jwt() ->> 'cedula');

-- Política para DELETE: Solo el sender puede borrar sus propios mensajes
CREATE POLICY "Users can delete their own messages" ON chat_messages
    FOR DELETE USING (sender_cedula = auth.jwt() ->> 'cedula');

-- Función para obtener mensajes de chat de una reunión
CREATE OR REPLACE FUNCTION get_chat_messages(
    input_room_id VARCHAR(100),
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    room_id VARCHAR(100),
    sender_name VARCHAR(200),
    sender_type VARCHAR(20),
    message_text TEXT,
    message_type VARCHAR(20),
    reply_to_id UUID,
    metadata JSONB,
    is_edited BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cm.id,
        cm.room_id,
        cm.sender_name,
        cm.sender_type,
        cm.message_text,
        cm.message_type,
        cm.reply_to_id,
        cm.metadata,
        cm.is_edited,
        cm.created_at
    FROM chat_messages cm
    WHERE cm.room_id = input_room_id
    ORDER BY cm.created_at ASC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$;

-- Función para enviar mensaje de chat
CREATE OR REPLACE FUNCTION send_chat_message(
    input_room_id VARCHAR(100),
    input_meeting_id UUID,
    input_sender_cedula VARCHAR(20),
    input_sender_name VARCHAR(200),
    input_sender_type VARCHAR(20),
    input_message_text TEXT,
    input_message_type VARCHAR(20) DEFAULT 'text',
    input_reply_to_id UUID DEFAULT NULL,
    input_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_message_id UUID;
BEGIN
    INSERT INTO chat_messages (
        room_id,
        meeting_id,
        sender_cedula,
        sender_name,
        sender_type,
        message_text,
        message_type,
        reply_to_id,
        metadata
    ) VALUES (
        input_room_id,
        input_meeting_id,
        input_sender_cedula,
        input_sender_name,
        input_sender_type,
        input_message_text,
        input_message_type,
        input_reply_to_id,
        input_metadata
    ) RETURNING id INTO new_message_id;
    
    RETURN new_message_id;
END;
$$;

-- Comentarios para documentación
COMMENT ON TABLE chat_messages IS 'Mensajes de chat durante videollamadas con persistencia para IA';
COMMENT ON COLUMN chat_messages.room_id IS 'ID de la sala de videollamada (Stream.io)';
COMMENT ON COLUMN chat_messages.sender_type IS 'Tipo de remitente: internal, external, system';
COMMENT ON COLUMN chat_messages.message_type IS 'Tipo de mensaje: text, system, reaction, file, join, leave';
COMMENT ON COLUMN chat_messages.metadata IS 'Datos adicionales en formato JSON para extensibilidad';

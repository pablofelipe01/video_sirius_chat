-- Migración temporal para desactivar RLS en chat_messages durante desarrollo
-- Fecha: 2025-01-24

-- Temporalmente desactivar RLS para chat_messages
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_cedula);

-- Función simplificada para obtener mensajes
CREATE OR REPLACE FUNCTION get_chat_messages_simple(input_room_id TEXT, limit_count INTEGER DEFAULT 100)
RETURNS TABLE (
    id UUID,
    meeting_id UUID,
    room_id TEXT,
    sender_cedula TEXT,
    sender_name TEXT,
    sender_type TEXT,
    message_text TEXT,
    message_type TEXT,
    reply_to_id UUID,
    metadata JSONB,
    is_edited BOOLEAN,
    edited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cm.id,
        cm.meeting_id,
        cm.room_id,
        cm.sender_cedula,
        cm.sender_name,
        cm.sender_type,
        cm.message_text,
        cm.message_type,
        cm.reply_to_id,
        cm.metadata,
        cm.is_edited,
        cm.edited_at,
        cm.created_at,
        cm.updated_at
    FROM chat_messages cm
    WHERE cm.room_id = input_room_id
    ORDER BY cm.created_at ASC
    LIMIT limit_count;
END;
$$;

-- Dar permisos de ejecución
GRANT EXECUTE ON FUNCTION get_chat_messages_simple TO anon, authenticated;

-- Permitir acceso directo a la tabla para usuarios autenticados
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_messages TO anon;

COMMENT ON FUNCTION get_chat_messages_simple IS 'Función simplificada para obtener mensajes de chat sin RLS';

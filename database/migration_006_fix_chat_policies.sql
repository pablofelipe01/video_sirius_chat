-- Migración para arreglar las políticas de RLS del SuperChat
-- Fecha: 2025-01-24

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view chat messages from their meetings" ON chat_messages;
DROP POLICY IF EXISTS "Users can send messages to their meetings" ON chat_messages;
DROP POLICY IF EXISTS "Users can edit their own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON chat_messages;

-- Política mejorada para SELECT: Permitir ver mensajes por room_id
CREATE POLICY "Users can view chat messages from rooms" ON chat_messages
    FOR SELECT USING (
        -- Verificar autenticación básica
        auth.jwt() ->> 'cedula' IS NOT NULL AND
        (
            -- Si es el sender del mensaje
            sender_cedula = auth.jwt() ->> 'cedula' OR
            -- O participa en la reunión asociada
            EXISTS (
                SELECT 1 FROM meeting_participants mp 
                WHERE mp.meeting_id = chat_messages.meeting_id 
                AND mp.participant_cedula = auth.jwt() ->> 'cedula'
            ) OR
            -- O es host de la reunión
            EXISTS (
                SELECT 1 FROM meetings m 
                WHERE m.id = chat_messages.meeting_id 
                AND m.host_cedula = auth.jwt() ->> 'cedula'
            ) OR
            -- O accede al room directamente (para invitados)
            (chat_messages.room_id IS NOT NULL)
        )
    );

-- Política mejorada para INSERT: Permitir enviar mensajes autenticados
CREATE POLICY "Users can send messages" ON chat_messages
    FOR INSERT WITH CHECK (
        -- Verificar autenticación básica
        auth.jwt() ->> 'cedula' IS NOT NULL AND
        -- El sender debe coincidir con el usuario autenticado
        sender_cedula = auth.jwt() ->> 'cedula' AND
        (
            -- Si hay meeting_id, verificar participación
            (
                chat_messages.meeting_id IS NOT NULL AND
                (
                    EXISTS (
                        SELECT 1 FROM meeting_participants mp 
                        WHERE mp.meeting_id = chat_messages.meeting_id 
                        AND mp.participant_cedula = auth.jwt() ->> 'cedula'
                    ) OR
                    EXISTS (
                        SELECT 1 FROM meetings m 
                        WHERE m.id = chat_messages.meeting_id 
                        AND m.host_cedula = auth.jwt() ->> 'cedula'
                    )
                )
            ) OR
            -- O si solo hay room_id, permitir acceso directo
            (chat_messages.room_id IS NOT NULL)
        )
    );

-- Política para UPDATE: Solo el sender puede editar sus propios mensajes
CREATE POLICY "Users can edit their own messages" ON chat_messages
    FOR UPDATE USING (
        auth.jwt() ->> 'cedula' IS NOT NULL AND
        sender_cedula = auth.jwt() ->> 'cedula'
    )
    WITH CHECK (
        auth.jwt() ->> 'cedula' IS NOT NULL AND
        sender_cedula = auth.jwt() ->> 'cedula'
    );

-- Política para DELETE: Solo el sender puede eliminar sus propios mensajes
CREATE POLICY "Users can delete their own messages" ON chat_messages
    FOR DELETE USING (
        auth.jwt() ->> 'cedula' IS NOT NULL AND
        sender_cedula = auth.jwt() ->> 'cedula'
    );

-- Función auxiliar para obtener mensajes con datos de participantes
CREATE OR REPLACE FUNCTION get_chat_messages_with_participants(input_room_id TEXT, limit_count INTEGER DEFAULT 100)
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

-- Dar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION get_chat_messages_with_participants TO authenticated;

COMMENT ON FUNCTION get_chat_messages_with_participants IS 'Obtiene mensajes de chat para una sala específica con información de participantes';

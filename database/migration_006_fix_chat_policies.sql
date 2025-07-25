-- Migración para arreglar el tiempo real del chat
-- Fecha: 2025-01-24

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view chat messages from rooms" ON chat_messages;

-- Política mejorada para SELECT: Permitir ver todos los mensajes del room
CREATE POLICY "Users can view chat messages from rooms" ON chat_messages
    FOR SELECT USING (
        -- Verificar autenticación básica
        auth.jwt() ->> 'cedula' IS NOT NULL AND
        (
            -- Permitir ver todos los mensajes del room_id si el usuario está autenticado
            room_id IS NOT NULL OR
            -- Si es el sender del mensaje
            sender_cedula = auth.jwt() ->> 'cedula' OR
            -- O participa en la reunión asociada (si hay meeting_id)
            (
                meeting_id IS NOT NULL AND
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
            )
        )
    );

-- Habilitar realtime para la tabla chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

COMMENT ON POLICY "Users can view chat messages from rooms" ON chat_messages IS 'Permite ver mensajes de chat a usuarios autenticados en cualquier room';

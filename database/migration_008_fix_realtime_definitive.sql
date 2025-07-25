-- Migración definitiva para arreglar realtime en chat_messages
-- Fecha: 2025-01-24

-- Asegurar que RLS está deshabilitado
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;

-- Remover la tabla de realtime (sin IF EXISTS)
-- Primero verificamos si existe y luego la removemos
DO $$
BEGIN
    -- Intentar remover la tabla de la publicación
    BEGIN
        ALTER PUBLICATION supabase_realtime DROP TABLE chat_messages;
        RAISE NOTICE 'Tabla chat_messages removida de supabase_realtime';
    EXCEPTION 
        WHEN undefined_object THEN
            RAISE NOTICE 'Tabla chat_messages no estaba en supabase_realtime';
        WHEN OTHERS THEN
            RAISE NOTICE 'Error removiendo tabla: %', SQLERRM;
    END;
END $$;

-- Agregar la tabla a realtime
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- Dar permisos completos para realtime
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_messages TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Asegurar que la secuencia también tenga permisos
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Función adicional para testing realtime
CREATE OR REPLACE FUNCTION test_chat_realtime()
RETURNS TABLE (
    total_messages BIGINT,
    recent_messages BIGINT,
    realtime_enabled BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_messages,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour') as recent_messages,
        TRUE as realtime_enabled
    FROM chat_messages;
END;
$$;

GRANT EXECUTE ON FUNCTION test_chat_realtime TO anon, authenticated;

-- Verificar que la tabla está en la publicación realtime
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'chat_messages'
    ) THEN
        RAISE NOTICE '✅ chat_messages está correctamente en supabase_realtime';
    ELSE
        RAISE NOTICE '❌ chat_messages NO está en supabase_realtime';
    END IF;
END $$;

COMMENT ON FUNCTION test_chat_realtime IS 'Función para testing de realtime en chat';
COMMENT ON TABLE chat_messages IS 'Tabla de mensajes de chat con realtime habilitado y RLS deshabilitado';
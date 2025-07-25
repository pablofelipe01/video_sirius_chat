-- Script para verificar el estado de realtime
-- Ejecutar en Supabase SQL Editor

-- Verificar si la tabla está en la publicación realtime
SELECT 
    schemaname,
    tablename,
    'chat_messages en realtime: ' || CASE 
        WHEN tablename = 'chat_messages' THEN '✅ SÍ'
        ELSE '❌ NO'
    END as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'chat_messages';

-- Verificar permisos en la tabla
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'chat_messages'
AND grantee IN ('anon', 'authenticated');

-- Verificar RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '❌ RLS está habilitado'
        ELSE '✅ RLS está deshabilitado'
    END as rls_status
FROM pg_tables 
WHERE tablename = 'chat_messages';

-- Contar mensajes en la tabla
SELECT 
    'Total mensajes: ' || COUNT(*) as message_count,
    'Mensajes última hora: ' || COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour') as recent_count
FROM chat_messages;
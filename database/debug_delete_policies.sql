-- Verificar políticas RLS para operaciones DELETE
-- Ejecutar en SQL Editor de Supabase

-- Ver todas las políticas para las tablas de reuniones
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check,
    roles
FROM pg_policies 
WHERE tablename IN ('meetings', 'meeting_participants')
AND cmd = 'DELETE'
ORDER BY tablename, policyname;

-- Ver si RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('meetings', 'meeting_participants');

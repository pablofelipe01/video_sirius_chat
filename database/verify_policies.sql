-- Consulta para verificar que las políticas RLS se crearon correctamente
-- Ejecutar en SQL Editor de Supabase para verificar

SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename IN ('meeting_participants', 'meeting_summaries', 'meetings')
ORDER BY tablename, policyname;

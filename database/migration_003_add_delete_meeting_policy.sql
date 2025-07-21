-- Migration 003: Add DELETE policy for meetings table
-- Date: 2025-07-21
-- Description: Add missing DELETE policy for meetings table

-- Política para eliminar reuniones
CREATE POLICY "Allow delete meetings" ON meetings 
FOR DELETE USING (true);

-- Comentario
COMMENT ON POLICY "Allow delete meetings" ON meetings IS 'Permite eliminar reuniones';

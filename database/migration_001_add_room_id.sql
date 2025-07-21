-- ==============================================
-- MIGRACIÓN 001: Agregar columna room_id para Stream.io
-- ==============================================
-- Ejecutar DESPUÉS del setup.sql existente

-- Agregar columna room_id para compatibilidad con Stream.io
ALTER TABLE meetings 
ADD COLUMN IF NOT EXISTS room_id VARCHAR(100) UNIQUE;

-- Generar room_id para meetings existentes (si las hay)
UPDATE meetings 
SET room_id = 'room-' || EXTRACT(EPOCH FROM NOW())::text || '-' || SUBSTRING(id::text, 1, 8)
WHERE room_id IS NULL;

-- Hacer room_id obligatorio después de rellenar valores existentes
ALTER TABLE meetings 
ALTER COLUMN room_id SET NOT NULL;

-- Agregar índice para room_id
CREATE INDEX IF NOT EXISTS idx_meetings_room_id ON meetings(room_id);

-- Comentario para documentación
COMMENT ON COLUMN meetings.room_id IS 'ID único para Stream.io SDK (diferente de meeting_id para ZegoCloud)';

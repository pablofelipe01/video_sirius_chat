-- Script SQL para crear las tablas necesarias en Supabase
-- Video Chat Platform - Sirius Regenerative Solutions

-- 1. Tabla de empleados de Sirius
CREATE TABLE IF NOT EXISTS employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cedula VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de reuniones
CREATE TABLE IF NOT EXISTS meetings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    meeting_id VARCHAR(100) UNIQUE NOT NULL, -- ID único para ZegoCloud
    host_cedula VARCHAR(20) NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER DEFAULT 60,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
    meeting_type VARCHAR(20) DEFAULT 'internal' CHECK (meeting_type IN ('internal', 'external', 'mixed')),
    invite_link TEXT,
    summary TEXT,
    recording_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (host_cedula) REFERENCES employees(cedula) ON DELETE CASCADE
);

-- 3. Tabla de participantes de reuniones
CREATE TABLE IF NOT EXISTS meeting_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    meeting_id UUID NOT NULL,
    participant_cedula VARCHAR(20),
    participant_name VARCHAR(200), -- Para participantes externos
    participant_email VARCHAR(255),
    participant_type VARCHAR(20) DEFAULT 'internal' CHECK (participant_type IN ('internal', 'external')),
    joined_at TIMESTAMP WITH TIME ZONE,
    left_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    is_invited BOOLEAN DEFAULT false,
    invitation_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
    FOREIGN KEY (participant_cedula) REFERENCES employees(cedula) ON DELETE SET NULL
);

-- 4. Tabla de resúmenes ejecutivos
CREATE TABLE IF NOT EXISTS meeting_summaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    meeting_id UUID NOT NULL,
    summary_type VARCHAR(20) DEFAULT 'executive' CHECK (summary_type IN ('executive', 'detailed', 'action_items')),
    content TEXT NOT NULL,
    generated_by VARCHAR(20), -- cedula del empleado que generó el resumen
    ai_generated BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
    FOREIGN KEY (generated_by) REFERENCES employees(cedula) ON DELETE SET NULL
);

-- 5. Insertar empleados de Sirius
INSERT INTO employees (cedula, first_name, last_name, department) VALUES
('79454772', 'Pablo', 'Acebedo', 'CTO'),
('1006834877', 'Santiago', 'Amaya', 'Pirólisis'),
('1057014925', 'Yesenia', 'Ramirez', 'Lab'),
('1019090206', 'Luisa', 'Ramirez', 'Admin'),
('1018497693', 'Alejandro', 'Uricoechea', 'Financiero'),
('1123561461', 'Alexandra', 'Orosco', 'Lab'),
('1122626068', 'Angi Yohana', 'Cardenas', 'Admin'),
('1006774686', 'David', 'Hernandez', 'Tech'),
('1016080562', 'Carolina', 'Casas', 'Admin'),
('1006866318', 'Kevin', 'Avila', 'Pirólisis'),
('1003625031', 'Fabián', 'Bejarano', 'Lab'),
('1018502606', 'Juan Manuel', 'Triana', 'Creative'),
('1006416103', 'Yeison', 'Cogua', 'Music'),
('1019887392', 'Luis', 'Obando', 'Pirólisis'),
('1018422135', 'Martin', 'Herrera', 'CEO'),
('52586323', 'Lina', 'Loaiza', 'Consult'),
('1122626299', 'Mario', 'Barrera', 'Pirólisis'),
('1026272126', 'Joys', 'Moreno', 'Admin')
ON CONFLICT (cedula) DO NOTHING;

-- 6. Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_employees_cedula ON employees(cedula);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_meetings_host ON meetings(host_cedula);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
CREATE INDEX IF NOT EXISTS idx_meetings_scheduled_at ON meetings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_meeting_participants_meeting ON meeting_participants(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_participants_cedula ON meeting_participants(participant_cedula);
CREATE INDEX IF NOT EXISTS idx_meeting_summaries_meeting ON meeting_summaries(meeting_id);

-- 7. Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger a las tablas necesarias
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meeting_summaries_updated_at BEFORE UPDATE ON meeting_summaries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Row Level Security (RLS) - Opcional pero recomendado
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_summaries ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad básicas (ajustar según necesidades)
CREATE POLICY "Employees can view all employees" ON employees FOR SELECT USING (true);
CREATE POLICY "Employees can view meetings" ON meetings FOR SELECT USING (true);
CREATE POLICY "Employees can create meetings" ON meetings FOR INSERT WITH CHECK (true);
CREATE POLICY "Host can update their meetings" ON meetings FOR UPDATE USING (host_cedula = current_setting('app.current_user_cedula', true));

-- 9. Función para verificar si un empleado existe
CREATE OR REPLACE FUNCTION verify_employee(input_cedula VARCHAR(20))
RETURNS TABLE(
    id UUID,
    cedula VARCHAR(20),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    department VARCHAR(100),
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.cedula,
        e.first_name,
        e.last_name,
        e.department,
        e.is_active
    FROM employees e
    WHERE e.cedula = input_cedula AND e.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Función para obtener empleados para dropdown (excluyendo al usuario actual)
CREATE OR REPLACE FUNCTION get_employees_for_invite(current_user_cedula VARCHAR(20) DEFAULT NULL)
RETURNS TABLE(
    cedula VARCHAR(20),
    full_name TEXT,
    department VARCHAR(100)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.cedula,
        CONCAT(e.first_name, ' ', e.last_name) as full_name,
        e.department
    FROM employees e
    WHERE e.is_active = true 
    AND (current_user_cedula IS NULL OR e.cedula != current_user_cedula)
    ORDER BY e.first_name, e.last_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentarios para documentación
COMMENT ON TABLE employees IS 'Tabla de empleados de Sirius Regenerative Solutions';
COMMENT ON TABLE meetings IS 'Tabla de reuniones de video chat';
COMMENT ON TABLE meeting_participants IS 'Participantes de cada reunión';
COMMENT ON TABLE meeting_summaries IS 'Resúmenes ejecutivos de las reuniones';

COMMENT ON COLUMN meetings.meeting_id IS 'ID único para integración con ZegoCloud SDK';
COMMENT ON COLUMN meetings.status IS 'Estado de la reunión: scheduled, active, completed, cancelled';
COMMENT ON COLUMN meetings.meeting_type IS 'Tipo de reunión: internal (solo empleados), external (con invitados), mixed';
COMMENT ON COLUMN meeting_participants.participant_type IS 'Tipo de participante: internal (empleado de Sirius), external (invitado externo)';

// Types for Sirius Video Chat Platform

export interface Employee {
  id: string
  cedula: string
  first_name: string
  last_name: string
  department: string
  email?: string
  phone?: string
  avatar_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Meeting {
  id: string
  title: string
  description?: string
  meeting_id: string // ID único para ZegoCloud
  host_cedula: string
  scheduled_at?: string
  duration_minutes: number
  status: 'scheduled' | 'active' | 'completed' | 'cancelled'
  meeting_type: 'internal' | 'external' | 'mixed'
  invite_link?: string
  summary?: string
  recording_url?: string
  created_at: string
  updated_at: string
}

export interface MeetingParticipant {
  id: string
  meeting_id: string
  participant_cedula?: string
  participant_name?: string // Para participantes externos
  participant_email?: string
  participant_type: 'internal' | 'external'
  joined_at?: string
  left_at?: string
  duration_minutes?: number
  is_invited: boolean
  invitation_sent_at?: string
  created_at: string
}

export interface MeetingSummary {
  id: string
  meeting_id: string
  summary_type: 'executive' | 'detailed' | 'action_items'
  content: string
  generated_by?: string
  ai_generated: boolean
  created_at: string
  updated_at: string
}

// Tipos para componentes y UI
export interface CreateMeetingData {
  title: string
  description?: string
  scheduled_at?: string
  duration_minutes: number
  meeting_type: 'internal' | 'external' | 'mixed'
  participants: string[] // cédulas de empleados
  external_participants?: ExternalParticipant[]
}

export interface ExternalParticipant {
  name: string
  email: string
}

export interface EmployeeSelectOption {
  cedula: string
  full_name: string
  department: string
}

// Estados de autenticación
export interface AuthState {
  isAuthenticated: boolean
  employee: Employee | null
  loading: boolean
  error: string | null
}

// Props para componentes
export interface DashboardStats {
  total_meetings: number
  upcoming_meetings: number
  completed_meetings: number
  total_participants: number
}

export interface MeetingCardProps {
  meeting: Meeting
  participants?: MeetingParticipant[]
  onJoin?: (meetingId: string) => void
  onEdit?: (meetingId: string) => void
  onDelete?: (meetingId: string) => void
  onCopyLink?: (link: string) => void
}

export interface CreateMeetingModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateMeeting: (data: CreateMeetingData) => Promise<void>
  employees: EmployeeSelectOption[]
  loading?: boolean
}

// Respuestas de API
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

export interface VerifyEmployeeResponse {
  id: string
  cedula: string
  first_name: string
  last_name: string
  department: string
  is_active: boolean
}

// Configuración de Supabase
export interface SupabaseConfig {
  url: string
  anonKey: string
}

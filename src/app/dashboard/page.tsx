'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Meeting } from '@/types'
import DashboardHeader from '@/components/DashboardHeader'
import CreateMeetingModal from '@/components/CreateMeetingModal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Tipo para reunión con participantes cargados
interface MeetingWithParticipants extends Meeting {
  room_id: string
  participants: Array<{
    id: string
    employee_cedula: string
    first_name: string
    last_name: string
  }>
}

// Tipos para los datos que vienen de Supabase
interface SupabaseMeetingParticipant {
  participant_cedula: string
  employees: {
    cedula: string
    first_name: string
    last_name: string
  } | null
}

interface SupabaseMeeting {
  id: string
  title: string
  description: string
  scheduled_at: string
  duration_minutes: number
  status: string
  host_cedula: string
  room_id: string
  meeting_id?: string
  meeting_type?: string
  created_at?: string
  updated_at?: string
  meeting_participants: SupabaseMeetingParticipant[]
}

import { 
  Video, 
  Plus, 
  Calendar, 
  Users, 
  Clock, 
  Edit, 
  Trash2, 
  Copy,
  BarChart3,
  FileText
} from 'lucide-react'

export default function Dashboard() {
  const { employee, loading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'meetings' | 'summaries' | 'analytics'>('meetings')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [joinRoomId, setJoinRoomId] = useState('')
  const [meetings, setMeetings] = useState<MeetingWithParticipants[]>([])
  const [loadingMeetings, setLoadingMeetings] = useState(true)

  useEffect(() => {
    if (!loading && !employee) {
      router.push('/')
      return
    } 
    
    if (!employee) return

    // Cargar reuniones del usuario actual
    const loadMeetings = async () => {
      try {
        setLoadingMeetings(true)
        
        // Primero buscar reuniones donde el usuario es host
        const { data: hostMeetings, error: hostError } = await supabase
          .from('meetings')
          .select(`
            *,
            meeting_participants (
              participant_cedula,
              employees (
                cedula,
                first_name,
                last_name
              )
            )
          `)
          .eq('host_cedula', employee.cedula)
          .order('scheduled_at', { ascending: true })

        if (hostError) {
          console.error('Error loading host meetings:', hostError)
          console.error('Error details:', JSON.stringify(hostError, null, 2))
          return
        }

        // Luego buscar reuniones donde el usuario es participante
        const { data: participantMeetingIds, error: participantError } = await supabase
          .from('meeting_participants')
          .select('meeting_id')
          .eq('participant_cedula', employee.cedula)

        if (participantError) {
          console.error('Error finding participant meetings:', participantError)
          console.error('Error details:', JSON.stringify(participantError, null, 2))
          return
        }

        let participantMeetings: SupabaseMeeting[] = []
        if (participantMeetingIds && participantMeetingIds.length > 0) {
          const meetingIds = participantMeetingIds.map(p => p.meeting_id)
          
          const { data: pMeetings, error: pError } = await supabase
            .from('meetings')
            .select(`
              *,
              meeting_participants (
                participant_cedula,
                employees (
                  cedula,
                  first_name,
                  last_name
                )
              )
            `)
            .in('id', meetingIds)
            .order('scheduled_at', { ascending: true })

          if (pError) {
            console.error('Error loading participant meetings:', pError)
            console.error('Error details:', JSON.stringify(pError, null, 2))
            return
          }

          participantMeetings = pMeetings || []
        }

        // Combinar y eliminar duplicados
        const allMeetings = [...(hostMeetings || []), ...participantMeetings]
        const uniqueMeetings = allMeetings.filter((meeting, index, self) => 
          index === self.findIndex(m => m.id === meeting.id)
        )

        // Procesar reuniones con participantes detallados
        const meetingsWithParticipants: MeetingWithParticipants[] = uniqueMeetings.map((meeting: SupabaseMeeting) => {
          // Extraer participantes de la relación meeting_participants
          const participants = (meeting.meeting_participants || []).map((mp: SupabaseMeetingParticipant) => ({
            id: mp.participant_cedula,
            employee_cedula: mp.participant_cedula,
            first_name: mp.employees?.first_name || 'Desconocido',
            last_name: mp.employees?.last_name || ''
          }))

          return {
            id: meeting.id,
            title: meeting.title,
            description: meeting.description,
            scheduled_at: meeting.scheduled_at,
            duration_minutes: meeting.duration_minutes,
            status: meeting.status,
            host_cedula: meeting.host_cedula,
            room_id: meeting.room_id,
            meeting_id: meeting.meeting_id || meeting.id,
            meeting_type: meeting.meeting_type || 'video',
            created_at: meeting.created_at || new Date().toISOString(),
            updated_at: meeting.updated_at || new Date().toISOString(),
            participants
          } as MeetingWithParticipants
        })

        setMeetings(meetingsWithParticipants)
      } catch (error) {
        console.error('Error loading meetings:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
      } finally {
        setLoadingMeetings(false)
      }
    }

    loadMeetings()
  }, [employee, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!employee) {
    return null
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Fecha no disponible'
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-700',
      active: 'bg-green-100 text-green-700',
      completed: 'bg-slate-100 text-slate-700',
      cancelled: 'bg-red-100 text-red-700'
    }
    return colors[status as keyof typeof colors] || colors.scheduled
  }

  const handleJoinMeeting = () => {
    if (joinRoomId.trim()) {
      router.push(`/video-room/${joinRoomId.trim()}`)
    }
  }

  const handleDeleteMeeting = async (meetingId: string, meetingTitle: string) => {
    if (!employee) return
    
    const confirmDelete = window.confirm(`¿Estás seguro de que quieres eliminar la reunión "${meetingTitle}"? Esta acción no se puede deshacer.`)
    
    if (!confirmDelete) return

    try {
      console.log('Iniciando eliminación de reunión:', meetingId)

      // Primero eliminar participantes
      console.log('Eliminando participantes...')
      const { error: participantsError, count: participantsCount } = await supabase
        .from('meeting_participants')
        .delete()
        .eq('meeting_id', meetingId)

      if (participantsError) {
        console.error('Error deleting participants:', participantsError)
        console.error('Error details:', JSON.stringify(participantsError, null, 2))
        alert('Error al eliminar los participantes de la reunión')
        return
      }

      console.log(`Participantes eliminados: ${participantsCount || 0}`)

      // Luego eliminar la reunión
      console.log('Eliminando reunión...')
      const { error: meetingError, count: meetingCount } = await supabase
        .from('meetings')
        .delete()
        .eq('id', meetingId)

      if (meetingError) {
        console.error('Error deleting meeting:', meetingError)
        console.error('Error details:', JSON.stringify(meetingError, null, 2))
        alert('Error al eliminar la reunión')
        return
      }

      console.log(`Reuniones eliminadas: ${meetingCount || 0}`)

      if (meetingCount === 0) {
        console.warn('No se eliminó ninguna reunión. Verificar permisos o si la reunión existe.')
        alert('No se pudo eliminar la reunión. Puede que no tengas permisos o la reunión ya no existe.')
        return
      }

      // Actualizar la lista de reuniones eliminando la reunión borrada
      setMeetings(prevMeetings => prevMeetings.filter(meeting => meeting.id !== meetingId))
      
      console.log('Reunión eliminada exitosamente')
      alert('Reunión eliminada exitosamente')
    } catch (error) {
      console.error('Error deleting meeting:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      alert('Error inesperado al eliminar la reunión')
    }
  }

  return (
    <div className="min-h-screen relative">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/imagen4.png)',
            filter: 'brightness(0.4)'
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/60 via-slate-800/40 to-emerald-900/30"></div>
      </div>

      {/* Header Componente */}
      <DashboardHeader />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 mt-16 sm:mt-20">
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeTab === 'meetings' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('meetings')}
              className={`flex items-center gap-2 text-sm ${
                activeTab === 'meetings' 
                  ? 'bg-emerald-500/80 text-white hover:bg-emerald-600/80 backdrop-blur-md' 
                  : 'bg-white/20 text-white border-white/30 hover:bg-white/30 backdrop-blur-md'
              }`}
              size="sm"
            >
              <Video className="w-4 h-4" />
              <span className="hidden sm:inline">Reuniones</span>
            </Button>
            <Button
              variant={activeTab === 'summaries' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('summaries')}
              className={`flex items-center gap-2 text-sm ${
                activeTab === 'summaries' 
                  ? 'bg-emerald-500/80 text-white hover:bg-emerald-600/80 backdrop-blur-md' 
                  : 'bg-white/20 text-white border-white/30 hover:bg-white/30 backdrop-blur-md'
              }`}
              size="sm"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Resúmenes</span>
            </Button>
            <Button
              variant={activeTab === 'analytics' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 text-sm ${
                activeTab === 'analytics' 
                  ? 'bg-emerald-500/80 text-white hover:bg-emerald-600/80 backdrop-blur-md' 
                  : 'bg-white/20 text-white border-white/30 hover:bg-white/30 backdrop-blur-md'
              }`}
              size="sm"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Analíticas</span>
            </Button>
          </div>

          <Button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-emerald-500/80 hover:bg-emerald-600/80 text-white shadow-lg w-full sm:w-auto backdrop-blur-md"
          >
            <Plus className="w-4 h-4" />
            <span className="sm:hidden">Nueva</span>
            <span className="hidden sm:inline">Nueva Reunión</span>
          </Button>

          {/* Botón para unirse a reunión */}
          <Button 
            onClick={() => setShowJoinModal(true)}
            className="flex items-center gap-2 bg-purple-500/80 hover:bg-purple-600/80 text-white shadow-lg w-full sm:w-auto backdrop-blur-md"
          >
            <Users className="w-4 h-4" />
            <span className="sm:hidden">Unirse</span>
            <span className="hidden sm:inline">Unirse a Reunión</span>
          </Button>
        </div>

        {/* Content Area */}
        {activeTab === 'meetings' && (
          <div className="space-y-4">
            {loadingMeetings ? (
              <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-lg">
                <CardContent className="p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                  <p className="text-white">Cargando reuniones...</p>
                </CardContent>
              </Card>
            ) : meetings.length === 0 ? (
              <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-lg">
                <CardContent className="p-8 text-center">
                  <Video className="w-12 h-12 text-white/60 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No hay reuniones programadas</h3>
                  <p className="text-white/80 mb-4">
                    Crea tu primera reunión para comenzar a colaborar con tu equipo
                  </p>
                  <Button 
                    onClick={() => setShowCreateModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Reunión
                  </Button>
                </CardContent>
              </Card>
            ) : (
              meetings.map((meeting) => (
              <Card key={meeting.id} className="bg-white/10 backdrop-blur-md border-white/20 shadow-lg hover:bg-white/20 transition-all">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                        <h3 className="text-base sm:text-lg font-semibold text-white truncate">
                          {meeting.title}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium self-start ${getStatusBadge(meeting.status || 'scheduled')}`}>
                          {meeting.status === 'scheduled' ? 'Programada' : 
                           meeting.status === 'completed' ? 'Completada' : 
                           meeting.status === 'active' ? 'Activa' : 'Cancelada'}
                        </span>
                      </div>
                      
                      <p className="text-sm sm:text-base text-white/80 mb-3 overflow-hidden">{meeting.description}</p>
                      
                      <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-white/70 mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="truncate">{formatDate(meeting.scheduled_at)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span>{meeting.duration_minutes} min</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span>{meeting.participants.length} participantes</span>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-white/60 mb-1">Participantes:</p>
                        {meeting.participants.length > 0 ? (
                          <p className="text-sm text-white/80">
                            {meeting.participants.map(p => `${p.first_name} ${p.last_name}`).join(', ')}
                          </p>
                        ) : (
                          <p className="text-sm text-white/60 italic">Sin participantes</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-row lg:flex-col items-center gap-2 lg:ml-4 flex-wrap lg:flex-nowrap">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => router.push(`/video-room/${meeting.room_id}`)}
                        className="flex items-center gap-1 bg-emerald-600/80 text-white border-emerald-500/30 hover:bg-emerald-700/80 text-xs sm:text-sm px-2 sm:px-3 backdrop-blur-md"
                      >
                        <Video className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Unirse</span>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          const meetingUrl = `${window.location.origin}/join/${meeting.id}`
                          navigator.clipboard.writeText(meetingUrl)
                          // Mejor UX: mostrar una notificación temporal
                          if (typeof window !== 'undefined') {
                            const originalTitle = document.title
                            document.title = '✓ Link copiado'
                            setTimeout(() => {
                              document.title = originalTitle
                            }, 2000)
                          }
                        }}
                        className="flex items-center gap-1 bg-white/20 text-white border-white/30 hover:bg-white/30 text-xs sm:text-sm px-2 sm:px-3 backdrop-blur-md"
                      >
                        <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden lg:inline">Link</span>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex items-center gap-1 bg-white/20 text-white border-white/30 hover:bg-white/30 text-xs sm:text-sm px-2 sm:px-3 backdrop-blur-md"
                      >
                        <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden lg:inline">Editar</span>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDeleteMeeting(meeting.id, meeting.title)}
                        className="flex items-center gap-1 bg-red-500/20 text-red-300 border-red-400/30 hover:bg-red-500/30 text-xs sm:text-sm px-2 sm:px-3 backdrop-blur-md"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )))}
          </div>
        )}

                        {activeTab === 'summaries' && (
          <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-lg">
            <CardContent className="p-6 sm:p-8 text-center">
              <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-white/60 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Resúmenes Ejecutivos</h3>
              <p className="text-sm sm:text-base text-white/80 mb-4 max-w-md mx-auto">
                Aquí aparecerán los resúmenes automáticos de tus reuniones completadas.
              </p>
              <Button 
                variant="outline" 
                className="bg-white/20 text-white border-white/30 hover:bg-white/30 text-sm sm:text-base backdrop-blur-md"
              >
                Ver Todos los Resúmenes
              </Button>
            </CardContent>
          </Card>
        )}

        {activeTab === 'analytics' && (
          <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-lg">
            <CardContent className="p-6 sm:p-8 text-center">
              <BarChart3 className="w-10 h-10 sm:w-12 sm:h-12 text-white/60 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Analíticas Avanzadas</h3>
              <p className="text-sm sm:text-base text-white/80 mb-4 max-w-md mx-auto">
                Obtén insights detallados sobre la productividad y participación en tus reuniones.
              </p>
              <Button 
                variant="outline" 
                className="bg-white/20 text-white border-white/30 hover:bg-white/30 text-sm sm:text-base backdrop-blur-md"
              >
                Ver Reportes
              </Button>
            </CardContent>
          </Card>
        )}

        {activeTab === 'analytics' && (
          <Card className="bg-white/95 backdrop-blur-md border-white/20 shadow-lg">
            <CardContent className="p-6 sm:p-8 text-center">
              <BarChart3 className="w-10 h-10 sm:w-12 sm:h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">Analíticas Avanzadas</h3>
              <p className="text-sm sm:text-base text-slate-600 mb-4 max-w-md mx-auto">
                Obtén insights detallados sobre la productividad y participación en tus reuniones.
              </p>
              <Button 
                variant="outline" 
                className="bg-white/90 text-slate-700 border-slate-300 hover:bg-white text-sm sm:text-base"
              >
                Ver Reportes
              </Button>
            </CardContent>
          </Card>
        )}

        {activeTab === 'analytics' && (
          <Card>
            <CardContent className="p-8 text-center">
              <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Analíticas</h3>
              <p className="text-slate-600 mb-4">
                Estadísticas detalladas sobre el uso de la plataforma y participación en reuniones.
              </p>
              <Button variant="outline">Ver Reportes Detallados</Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de Crear Reunión */}
      <CreateMeetingModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={async (meeting) => {
          console.log('Reunión creada:', meeting)
          setShowCreateModal(false)
          // Recargar la lista de reuniones usando la misma lógica del useEffect
          if (employee) {
            setLoadingMeetings(true)
            try {
              // Primero buscar reuniones donde el usuario es host
              const { data: hostMeetings, error: hostError } = await supabase
                .from('meetings')
                .select(`
                  *,
                  meeting_participants (
                    participant_cedula,
                    employees (
                      cedula,
                      first_name,
                      last_name
                    )
                  )
                `)
                .eq('host_cedula', employee.cedula)
                .order('scheduled_at', { ascending: true })

              if (hostError) {
                console.error('Error loading host meetings:', hostError)
                return
              }

              // Luego buscar reuniones donde el usuario es participante
              const { data: participantMeetingIds, error: participantError } = await supabase
                .from('meeting_participants')
                .select('meeting_id')
                .eq('participant_cedula', employee.cedula)

              if (participantError) {
                console.error('Error finding participant meetings:', participantError)
                return
              }

              let participantMeetings: SupabaseMeeting[] = []
              if (participantMeetingIds && participantMeetingIds.length > 0) {
                const meetingIds = participantMeetingIds.map(p => p.meeting_id)
                
                const { data: pMeetings, error: pError } = await supabase
                  .from('meetings')
                  .select(`
                    *,
                    meeting_participants (
                      participant_cedula,
                      employees (
                        cedula,
                        first_name,
                        last_name
                      )
                    )
                  `)
                  .in('id', meetingIds)
                  .order('scheduled_at', { ascending: true })

                if (pError) {
                  console.error('Error loading participant meetings:', pError)
                  return
                }

                participantMeetings = pMeetings || []
              }

              // Combinar y eliminar duplicados
              const allMeetings = [...(hostMeetings || []), ...participantMeetings]
              const uniqueMeetings = allMeetings.filter((meeting, index, self) => 
                index === self.findIndex(m => m.id === meeting.id)
              )

              // Procesar reuniones con participantes detallados
              const meetingsWithParticipants: MeetingWithParticipants[] = uniqueMeetings.map((meeting: SupabaseMeeting) => {
                // Extraer participantes de la relación meeting_participants
                const participants = (meeting.meeting_participants || []).map((mp: SupabaseMeetingParticipant) => ({
                  id: mp.participant_cedula,
                  employee_cedula: mp.participant_cedula,
                  first_name: mp.employees?.first_name || 'Desconocido',
                  last_name: mp.employees?.last_name || ''
                }))

                return {
                  id: meeting.id,
                  title: meeting.title,
                  description: meeting.description,
                  scheduled_at: meeting.scheduled_at,
                  duration_minutes: meeting.duration_minutes,
                  status: meeting.status,
                  host_cedula: meeting.host_cedula,
                  room_id: meeting.room_id,
                  meeting_id: meeting.meeting_id || meeting.id,
                  meeting_type: meeting.meeting_type || 'video',
                  created_at: meeting.created_at || new Date().toISOString(),
                  updated_at: meeting.updated_at || new Date().toISOString(),
                  participants
                } as MeetingWithParticipants
              })

              setMeetings(meetingsWithParticipants)
            } catch (error) {
              console.error('Error reloading meetings:', error)
            } finally {
              setLoadingMeetings(false)
            }
          }
        }}
      />

      {/* Modal para unirse a reunión */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4 bg-white/10 backdrop-blur-md border-white/20 shadow-lg">
            <CardHeader className="border-b border-white/20">
              <CardTitle className="text-white">Unirse a Reunión</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="text-center mb-4">
                <Users className="w-12 h-12 text-white/60 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Ingrese el ID de la Reunión</h3>
                <p className="text-white/80 text-sm">
                  Introduzca el código de reunión que le compartieron
                </p>
              </div>
              
              <div className="space-y-4">
                <input
                  type="text"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                  placeholder="Ej: quick-1234567890-abc123"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-md"
                />
                
                <div className="flex gap-3">
                  <Button 
                    onClick={() => {
                      setShowJoinModal(false)
                      setJoinRoomId('')
                    }}
                    variant="outline"
                    className="flex-1 bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-md"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={() => {
                      handleJoinMeeting()
                      setShowJoinModal(false)
                      setJoinRoomId('')
                    }}
                    disabled={!joinRoomId.trim()}
                    className="flex-1 bg-purple-500/80 hover:bg-purple-600/80 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Unirse
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

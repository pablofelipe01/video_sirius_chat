'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Meeting } from '@/types'
import DashboardHeader from '@/components/DashboardHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Video, 
  Plus, 
  Calendar, 
  Users, 
  Clock, 
  Share2, 
  Edit, 
  Trash2, 
  Copy,
  BarChart3,
  FileText
} from 'lucide-react'

// Tipo personalizado para los datos mock que incluye participantes
interface MockMeeting extends Partial<Meeting> {
  id: string
  title: string
  status: 'scheduled' | 'active' | 'completed' | 'cancelled'
  scheduled_at: string
  duration_minutes: number
  participants: string[]
}

// Mock data para mostrar en el dashboard
const mockMeetings: MockMeeting[] = [
  {
    id: '1',
    title: 'Reunión de Pirólisis Semanal',
    description: 'Revisión de avances en el proyecto de pirólisis',
    scheduled_at: '2025-01-19T10:00:00Z',
    duration_minutes: 60,
    status: 'scheduled' as const,
    participants: ['Santiago Amaya', 'Kevin Avila', 'Mario Barrera']
  },
  {
    id: '2',
    title: 'Análisis Lab Mensual',
    description: 'Resultados de análisis de biochar',
    scheduled_at: '2025-01-20T14:30:00Z',
    duration_minutes: 90,
    status: 'scheduled' as const,
    participants: ['Yesenia Ramirez', 'Alexandra Orosco', 'Fabián Bejarano']
  },
  {
    id: '3',
    title: 'Reunión Ejecutiva',
    description: 'Revisión de objetivos trimestrales',
    scheduled_at: '2025-01-18T16:00:00Z',
    duration_minutes: 45,
    status: 'completed' as const,
    participants: ['Martin Herrera', 'Pablo Acebedo', 'Lina Loaiza']
  }
]

const mockStats = {
  total_meetings: 12,
  upcoming_meetings: 3,
  completed_meetings: 8,
  total_participants: 45
}

export default function Dashboard() {
  const { employee, loading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'meetings' | 'summaries' | 'analytics'>('meetings')
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    if (!loading && !employee) {
      router.push('/')
    }
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

  const formatDate = (dateString: string) => {
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
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-lg hover:bg-white/20 transition-all">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-white/90">Total Reuniones</p>
                  <p className="text-xl sm:text-2xl font-bold text-white">{mockStats.total_meetings}</p>
                </div>
                <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-lg hover:bg-white/20 transition-all">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-white/90">Próximas</p>
                  <p className="text-xl sm:text-2xl font-bold text-white">{mockStats.upcoming_meetings}</p>
                </div>
                <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-lg hover:bg-white/20 transition-all">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-white/90">Completadas</p>
                  <p className="text-xl sm:text-2xl font-bold text-white">{mockStats.completed_meetings}</p>
                </div>
                <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-lg hover:bg-white/20 transition-all">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-white/90">Participantes</p>
                  <p className="text-xl sm:text-2xl font-bold text-white">{mockStats.total_participants}</p>
                </div>
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

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
        </div>

        {/* Content Area */}
        {activeTab === 'meetings' && (
          <div className="space-y-4">
            {mockMeetings.map((meeting) => (
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

                      <div className="hidden sm:block">
                        <p className="text-xs text-white/60 mb-1">Participantes:</p>
                        <p className="text-sm text-white/80 truncate">
                          {meeting.participants.join(', ')}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-row lg:flex-col items-center gap-2 lg:ml-4 flex-wrap lg:flex-nowrap">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex items-center gap-1 bg-white/20 text-white border-white/30 hover:bg-white/30 text-xs sm:text-sm px-2 sm:px-3 backdrop-blur-md"
                      >
                        <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Unirse</span>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
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
                        className="flex items-center gap-1 bg-red-500/20 text-red-300 border-red-400/30 hover:bg-red-500/30 text-xs sm:text-sm px-2 sm:px-3 backdrop-blur-md"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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

      {/* Modal Placeholder */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4 bg-white/10 backdrop-blur-md border-white/20 shadow-lg">
            <CardHeader className="border-b border-white/20">
              <CardTitle className="text-white">Crear Nueva Reunión</CardTitle>
            </CardHeader>
            <CardContent className="text-center py-8">
              <Video className="w-12 h-12 text-white/60 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Crear Nueva Reunión</h3>
              <p className="text-white/80 mb-4">
                Funcionalidad en desarrollo. Próximamente podrás crear reuniones desde aquí.
              </p>
              <Button 
                onClick={() => setShowCreateModal(false)}
                className="bg-white/20 text-white border-white/30 hover:bg-white/30 backdrop-blur-md"
              >
                Cerrar
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

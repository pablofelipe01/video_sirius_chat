'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Video, Clock, Calendar } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Meeting {
  id: string
  title: string
  description?: string
  scheduled_at: string
  duration_minutes: number
  status: string
  room_id: string
}

export default function GuestJoinPage() {
  const params = useParams()
  const router = useRouter()
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [guestName, setGuestName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isJoining, setIsJoining] = useState(false)

  const meetingId = params.meetingId as string

  useEffect(() => {
    const loadMeeting = async () => {
      try {
        setIsLoading(true)
        
        const { data, error } = await supabase
          .from('meetings')
          .select('*')
          .eq('id', meetingId)
          .single()

        if (error) {
          setError('Reunión no encontrada')
          return
        }

        if (data.status === 'cancelled') {
          setError('Esta reunión ha sido cancelada')
          return
        }

        setMeeting(data)
      } catch (err) {
        console.error('Error loading meeting:', err)
        setError('Error al cargar la reunión')
      } finally {
        setIsLoading(false)
      }
    }

    if (meetingId) {
      loadMeeting()
    }
  }, [meetingId])

  const handleJoinMeeting = () => {
    if (!guestName.trim()) {
      alert('Por favor ingresa tu nombre')
      return
    }

    setIsJoining(true)
    
    // Guardar el nombre del invitado en localStorage para usarlo en la reunión
    localStorage.setItem('guest_name', guestName.trim())
    
    // Redirigir a la sala de video
    router.push(`/video-room/${meeting?.room_id}?guest=true`)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando reunión...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Video className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!meeting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Video className="w-8 h-8 text-gray-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Reunión no encontrada</h2>
            <p className="text-gray-600">La reunión que buscas no existe o ha sido eliminada.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video className="w-8 h-8 text-emerald-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Sirius Video Chat
          </CardTitle>
          <p className="text-gray-600">Te han invitado a una reunión</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Información de la reunión */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">{meeting.title}</h3>
            
            {meeting.description && (
              <p className="text-gray-600 text-sm">{meeting.description}</p>
            )}

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(meeting.scheduled_at)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{formatTime(meeting.scheduled_at)}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>Duración: {meeting.duration_minutes} minutos</span>
            </div>
          </div>

          {/* Formulario de ingreso */}
          <div className="space-y-4">
            <div>
              <label htmlFor="guestName" className="block text-sm font-medium text-gray-700 mb-2">
                Tu nombre completo
              </label>
              <Input
                id="guestName"
                type="text"
                placeholder="Ej: Juan Pérez"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full"
                maxLength={50}
              />
              <p className="text-xs text-gray-500 mt-1">
                Este nombre aparecerá en la reunión para que otros participantes puedan identificarte
              </p>
            </div>

            <Button 
              onClick={handleJoinMeeting}
              disabled={isJoining || !guestName.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {isJoining ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uniéndose...
                </>
              ) : (
                <>
                  <Video className="w-4 h-4 mr-2" />
                  Unirse a la Reunión
                </>
              )}
            </Button>
          </div>

          {/* Información adicional */}
          <div className="text-center text-xs text-gray-500">
            <p>Al unirte a esta reunión, aceptas que tu audio y video puedan ser grabados.</p>
            <p className="mt-1">Powered by Sirius Video Chat Platform</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

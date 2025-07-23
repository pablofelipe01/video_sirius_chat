'use client'

import { useEffect, useState } from 'react'
import { 
  StreamVideo, 
  StreamCall,
  StreamTheme,
  SpeakerLayout,
  PaginatedGridLayout,
  CallControls,
  CallingState,
  useCallStateHooks,
} from '@stream-io/video-react-sdk'
import '@stream-io/video-react-sdk/dist/css/styles.css'
import '@/styles/video-controls.css'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Video, AlertCircle, Copy, Users, FileText } from 'lucide-react'
import { useStreamVideoClient } from '@/hooks/useStreamVideoClient'
import { StreamTranscription } from '@/components/StreamTranscription'

interface VideoRoomProps {
  roomId: string
  onLeave: () => void
  isGuest?: boolean
}

// Componente interno que maneja el estado de la llamada
function CallInterface({ onLeave, roomId }: { onLeave: () => void; roomId: string }) {
  const { 
    useCallCallingState, 
    useParticipants,
  } = useCallStateHooks()
  
  const [showTranscription, setShowTranscription] = useState(false)
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'fair' | 'poor'>('good')
  
  const callingState = useCallCallingState()
  const participants = useParticipants()

  // Monitor básico de calidad de conexión (simplificado)
  useEffect(() => {
    // Monitorear el estado de la conexión de forma básica
    const interval = setInterval(() => {
      if (navigator.onLine) {
        // Si tenemos conexión, verificar si hay participantes activos
        if (participants.length > 0) {
          setConnectionQuality('good')
        }
      } else {
        setConnectionQuality('poor')
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [participants])

  const getConnectionIcon = () => {
    switch (connectionQuality) {
      case 'good': return '🟢'
      case 'fair': return '🟡'
      case 'poor': return '🔴'
      default: return '⚪'
    }
  }

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId)
    // Mejor UX: mostrar una notificación temporal en lugar de alert
    if (typeof window !== 'undefined') {
      const originalTitle = document.title
      document.title = '✓ ID copiado'
      setTimeout(() => {
        document.title = originalTitle
      }, 2000)
    }
  }

  if (callingState === CallingState.JOINING) {
    return (
      <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-lg">
        <CardContent className="p-8 text-center">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            Uniéndose a la reunión...
          </h3>
          <p className="text-white/80">
            Conectando con otros participantes
          </p>
        </CardContent>
      </Card>
    )
  }

  if (callingState === CallingState.RECONNECTING) {
    return (
      <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-lg">
        <CardContent className="p-8 text-center">
          <Loader2 className="w-12 h-12 text-yellow-400 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            Reconectando...
          </h3>
          <p className="text-white/80">
            Reestableciendo conexión
          </p>
        </CardContent>
      </Card>
    )
  }

  if (callingState === CallingState.JOINED) {
    return (
      <div className="space-y-4 p-4 sm:p-0">
        {/* Información de la llamada */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-lg">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:gap-0 sm:flex-row sm:items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
                <Video className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">
                  Reunión en Curso ({participants.length})
                </span>
              </CardTitle>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <div className="text-white/80 text-sm">
                  <span className="hidden sm:inline">ID: </span>
                  <span className="font-mono">{roomId}</span>
                </div>
                <Button
                  onClick={copyRoomId}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 text-white border-white/30 hover:bg-white/20 text-xs h-8 self-start sm:self-auto"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">Copiar</span>
                  <span className="sm:hidden">ID</span>
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Layout de video optimizado y unificado */}
        <div className="bg-slate-900 rounded-xl overflow-hidden shadow-2xl h-[400px] sm:h-[600px] lg:h-[700px] xl:h-[750px] max-h-[80vh] relative">
          {/* Usar SpeakerLayout unificado para mejor estabilidad */}
          {participants.length <= 2 ? (
            // Para 1-2 participantes: Layout tipo "cara a cara"
            <PaginatedGridLayout 
              groupSize={2}
            />
          ) : participants.length <= 4 ? (
            // Para 3-4 participantes: Grid pequeño
            <PaginatedGridLayout 
              groupSize={4}
            />
          ) : (
            // Para 5+ participantes: Speaker layout con participantes abajo
            <SpeakerLayout 
              participantsBarPosition="bottom"
              participantsBarLimit={6}
            />
          )}
        </div>

        {/* Controles de llamada usando el componente oficial */}
        <div className="flex justify-center px-4">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 shadow-lg">
            {/* Usar el componente oficial CallControls que maneja todo automáticamente */}
            <CallControls onLeave={onLeave} />
            
            {/* Información de participantes y calidad de conexión */}
            <div className="flex items-center justify-center gap-2 mt-4 sm:mt-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg">
                <Users className="w-4 h-4 text-white/80" />
                <span className="text-white/80 text-sm">
                  {participants.length} {participants.length === 1 ? 'participante' : 'participantes'}
                </span>
              </div>
              
              {/* Indicador de calidad de conexión */}
              <div className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg">
                <span className="text-sm">{getConnectionIcon()}</span>
                <span className="text-white/80 text-sm">
                  {connectionQuality === 'good' && 'Excelente'}
                  {connectionQuality === 'fair' && 'Buena'}
                  {connectionQuality === 'poor' && 'Lenta'}
                </span>
              </div>
              
              <Button
                onClick={() => setShowTranscription(!showTranscription)}
                variant="outline"
                size="sm"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  showTranscription 
                    ? 'bg-blue-500/30 text-blue-300 border-blue-400/30' 
                    : 'bg-white/10 text-white/80 border-white/30'
                } hover:bg-white/20`}
              >
                <FileText className="w-4 h-4" />
                <span className="text-sm">Stream.io AI</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Panel de Transcripción */}
        {showTranscription && (
          <div className="px-4 mt-4">
            <StreamTranscription roomId={roomId} />
          </div>
        )}
      </div>
    )
  }

  // Estado por defecto o error
  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-lg">
      <CardContent className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">
          Estado: {callingState}
        </h3>
        <p className="text-white/80 mb-4">
          Estado inesperado de la llamada
        </p>
        <Button onClick={onLeave} variant="outline" className="bg-white/20 text-white border-white/30">
          Regresar
        </Button>
      </CardContent>
    </Card>
  )
}

export default function VideoRoom({ roomId, onLeave, isGuest = false }: VideoRoomProps) {
  const { client, loading, error } = useStreamVideoClient(isGuest)
  const [call, setCall] = useState<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  const [joining, setJoining] = useState(false)

  // Crear y unirse a la llamada cuando el cliente esté listo
  useEffect(() => {
    if (!client || !roomId) return

    let currentCall: any = null // eslint-disable-line @typescript-eslint/no-explicit-any

    const setupCall = async () => {
      try {
        setJoining(true)
        console.log('🚀 Configurando llamada con ID:', roomId)
        
        // Crear la llamada
        currentCall = client.call('default', roomId)
        
        // Opciones básicas de unión (sin settings_override problemáticos)
        const joinOptions = {
          create: true,
          data: {
            // Datos básicos sin created_by_id problemático
          },
          // Configuraciones simples de dispositivos locales
          camera: {
            enabled: true,
            facingMode: 'user'
          },
          microphone: {
            enabled: true
          }
        }
        
        // Unirse a la llamada con configuraciones básicas
        await currentCall.join(joinOptions)
        
        // Configurar video y audio DESPUÉS de unirse (más confiable)
        try {
          // Habilitar cámara por defecto
          await currentCall.camera.enable()
          console.log('✅ Cámara habilitada')
        } catch (cameraError) {
          console.warn('⚠️ No se pudo habilitar la cámara:', cameraError)
        }

        try {
          // Habilitar micrófono por defecto
          await currentCall.microphone.enable()
          console.log('✅ Micrófono habilitado')
        } catch (micError) {
          console.warn('⚠️ No se pudo habilitar el micrófono:', micError)
        }
        
        console.log('✅ Unido a la llamada exitosamente')
        setCall(currentCall)
      } catch (err) {
        console.error('Error uniéndose a la llamada:', err)
        alert('Error al unirse a la reunión')
        onLeave()
      } finally {
        setJoining(false)
      }
    }

    setupCall()

    // Cleanup al salir
    return () => {
      if (currentCall) {
        currentCall.leave().catch(() => {
          console.log('Call cleanup completed')
        })
      }
    }
  }, [client, roomId, onLeave])

  const handleLeave = async () => {
    console.log('Saliendo de la llamada...')
    if (call) {
      try {
        await call.leave()
      } catch {
        console.log('Call already left or ended')
      }
    }
    onLeave()
  }

  // Estados de carga y error
  if (loading || !client) {
    return (
      <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-lg">
        <CardContent className="p-8 text-center">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            Configurando Stream Video...
          </h3>
          <p className="text-white/80">
            Conectando con el servidor de video
          </p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-lg">
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            Error de Configuración
          </h3>
          <p className="text-white/80 mb-4">
            {error}
          </p>
          <Button onClick={onLeave} variant="outline" className="bg-white/20 text-white border-white/30">
            Regresar
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (joining) {
    return (
      <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-lg">
        <CardContent className="p-8 text-center">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            Preparando reunión...
          </h3>
          <p className="text-white/80">
            Sala: {roomId}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!call) {
    return (
      <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-lg">
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            No se pudo crear la llamada
          </h3>
          <p className="text-white/80 mb-4">
            Verifica tu conexión e intenta nuevamente
          </p>
          <Button onClick={onLeave} variant="outline" className="bg-white/20 text-white border-white/30">
            Regresar
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <StreamTheme>
          <CallInterface onLeave={handleLeave} roomId={roomId} />
        </StreamTheme>
      </StreamCall>
    </StreamVideo>
  )
}

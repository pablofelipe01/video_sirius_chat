'use client'

import { useState, useEffect } from 'react'
import { 
  StreamVideo, 
  StreamCall,
  SpeakerLayout,
  CallControls,
  CallingState,
  useCallStateHooks
} from '@stream-io/video-react-sdk'
import '@stream-io/video-react-sdk/dist/css/styles.css'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Video, Phone, AlertCircle, Copy } from 'lucide-react'
import { useStreamVideoClient } from '@/hooks/useStreamVideoClient'

interface VideoRoomProps {
  roomId: string
  onLeave: () => void
}

// Componente interno que maneja el estado de la llamada
function CallInterface({ onLeave, roomId }: { onLeave: () => void; roomId: string }) {
  const { useCallCallingState, useParticipants } = useCallStateHooks()
  
  const callingState = useCallCallingState()
  const participants = useParticipants()

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId)
    alert('ID de reunión copiado al portapapeles')
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

  if (callingState === CallingState.JOINED) {
    return (
      <div className="space-y-4">
        {/* Información de la llamada */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-lg">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-white flex items-center gap-2">
                <Video className="w-5 h-5" />
                Reunión en Curso ({participants.length} participantes)
              </CardTitle>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <span className="text-white/80 text-sm">ID: {roomId}</span>
                <Button
                  onClick={copyRoomId}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 text-white border-white/30 hover:bg-white/20 text-xs h-8"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copiar
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Layout de video */}
        <div className="bg-slate-900 rounded-lg overflow-hidden" style={{ minHeight: '600px' }}>
          <SpeakerLayout participantsBarPosition="bottom" />
        </div>

        {/* Controles de llamada */}
        <div className="flex justify-center">
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-lg p-4">
            <CallControls />
            <Button
              onClick={onLeave}
              variant="outline"
              className="bg-red-500/20 text-red-300 border-red-400/30 hover:bg-red-500/30"
            >
              <Phone className="w-4 h-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>
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
        <Button onClick={onLeave} variant="outline" className="bg-white/20 text-white border-white/30">
          Regresar
        </Button>
      </CardContent>
    </Card>
  )
}

export default function VideoRoom({ roomId, onLeave }: VideoRoomProps) {
  const { client, loading, error } = useStreamVideoClient()
  const [call, setCall] = useState<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    if (!client) return

    let currentCall: any = null // eslint-disable-line @typescript-eslint/no-explicit-any

    const setupCall = async () => {
      try {
        setJoining(true)
        
        // Crear o unirse a la llamada
        currentCall = client.call('default', roomId)
        
        // Unirse a la llamada (crear si no existe)
        await currentCall.join({ create: true })
        
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
          // Ignorar errores al salir (ej: llamada ya terminada)
        })
      }
    }
  }, [client, roomId, onLeave])

  const handleLeave = async () => {
    if (call) {
      try {
        await call.leave()
      } catch (err) {
        // Ignorar errores al salir (ej: llamada ya terminada)
        console.log('Call already left or ended')
      }
    }
    onLeave()
  }

  // Estados de carga
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
        <CallInterface onLeave={handleLeave} roomId={roomId} />
      </StreamCall>
    </StreamVideo>
  )
}

'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mic, MicOff, FileText, Download, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface LiveTranscriptionProps {
  roomId: string
}

export default function LiveTranscription({ roomId }: LiveTranscriptionProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [status, setStatus] = useState<'idle' | 'recording' | 'processing' | 'completed' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [transcriptionId, setTranscriptionId] = useState<string | null>(null)
  const [meetingId, setMeetingId] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  // Función para obtener o crear el meeting ID
  const getMeetingId = async (): Promise<string> => {
    if (meetingId) return meetingId

    try {
      // Buscar si existe una reunión con este room_id
      const response = await fetch(`/api/meetings/by-room/${roomId}`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.meeting) {
          setMeetingId(data.meeting.id)
          return data.meeting.id
        }
      }

      // Si no existe, crear una nueva reunión para la transcripción
      const createResponse = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `Reunión - ${roomId}`,
          description: 'Reunión con transcripción en vivo',
          room_id: roomId,
          meeting_type: 'video',
          start_time: new Date().toISOString(),
        }),
      })

      if (createResponse.ok) {
        const createData = await createResponse.json()
        setMeetingId(createData.meeting.id)
        return createData.meeting.id
      }

      throw new Error('No se pudo crear la reunión')
    } catch (err) {
      console.error('Error getting meeting ID:', err)
      throw new Error('Error al obtener ID de reunión')
    }
  }

  // Función para iniciar la grabación
  const startRecording = async () => {
    try {
      setError(null)
      
      // Solicitar acceso al micrófono
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000, // Óptimo para transcripción
        } 
      })
      
      streamRef.current = stream
      audioChunksRef.current = []

      // Crear MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await uploadAudio(audioBlob)
      }

      mediaRecorder.start()
      setIsRecording(true)
      setStatus('recording')
      
    } catch (err) {
      console.error('Error starting recording:', err)
      setError('No se pudo acceder al micrófono')
      setStatus('error')
    }
  }

  // Función para detener la grabación
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setStatus('processing')
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

    // Función para subir el audio a AssemblyAI
  const uploadAudio = async (audioBlob: Blob) => {
    try {
      // Obtener el meeting ID correcto
      const currentMeetingId = await getMeetingId()

      // Crear FormData para subir el archivo
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')

      // Subir audio a AssemblyAI
      const uploadResponse = await fetch('/api/transcription/upload', {
        method: 'POST',
        body: formData,
      })

      const uploadData = await uploadResponse.json()

      if (!uploadData.success) {
        throw new Error(uploadData.error || 'Error al subir el audio')
      }

      // Iniciar transcripción con la URL del audio subido
      const response = await fetch('/api/transcription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetingId: currentMeetingId,
          audioUrl: uploadData.audioUrl
        }),
      })

      const data = await response.json()

      if (data.success) {
        setTranscriptionId(data.transcriptionId)
        // Empezar a hacer polling para verificar el progreso
        pollTranscriptionStatus(data.transcriptionId)
      } else {
        throw new Error(data.error || 'Error al iniciar transcripción')
      }

    } catch (err) {
      console.error('Error uploading audio:', err)
      setError('Error al procesar el audio')
      setStatus('error')
    }
  }

  // Función para hacer polling del estado de transcripción
  const pollTranscriptionStatus = async (id: string) => {
    try {
      const response = await fetch(`/api/transcription?transcriptionId=${id}`)
      const data = await response.json()

      if (data.success && data.transcription) {
        const transcription = data.transcription

        if (transcription.status === 'completed') {
          setTranscript(transcription.transcript_text || '')
          setStatus('completed')
        } else if (transcription.status === 'failed') {
          setError('Error en la transcripción')
          setStatus('error')
        } else {
          // Continuar polling si aún está procesando
          setTimeout(() => pollTranscriptionStatus(id), 2000)
        }
      }
    } catch (err) {
      console.error('Error checking transcription status:', err)
      setError('Error al verificar el estado de la transcripción')
      setStatus('error')
    }
  }

  // Función para descargar la transcripción
  const downloadTranscript = () => {
    if (!transcript) return

    const blob = new Blob([transcript], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transcripcion-reunion-${roomId}-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Limpiar recursos al desmontar
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const getStatusBadge = () => {
    switch (status) {
      case 'recording':
        return <Badge variant="destructive" className="animate-pulse">🔴 Grabando</Badge>
      case 'processing':
        return <Badge variant="secondary">⏳ Procesando...</Badge>
      case 'completed':
        return <Badge variant="default" className="bg-green-600">✅ Completado</Badge>
      case 'error':
        return <Badge variant="destructive">❌ Error</Badge>
      default:
        return <Badge variant="outline">⚪ Listo</Badge>
    }
  }

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Transcripción en Vivo
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Controles de grabación */}
        <div className="flex items-center gap-2">
          {!isRecording ? (
            <Button
              onClick={startRecording}
              disabled={status === 'processing'}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
            >
              <Mic className="w-4 h-4" />
              Iniciar Transcripción
            </Button>
          ) : (
            <Button
              onClick={stopRecording}
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white"
            >
              <MicOff className="w-4 h-4" />
              Detener Grabación
            </Button>
          )}

          {transcript && (
            <Button
              onClick={downloadTranscript}
              variant="outline"
              size="sm"
              className="bg-white/10 text-white border-white/30 hover:bg-white/20"
            >
              <Download className="w-4 h-4 mr-2" />
              Descargar
            </Button>
          )}
        </div>

        {/* Mostrar errores */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-red-300 text-sm">{error}</span>
          </div>
        )}

        {/* Mostrar transcripción */}
        {transcript && (
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 max-h-40 overflow-y-auto">
            <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">
              {transcript}
            </p>
          </div>
        )}

        {status === 'processing' && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-white/70 text-sm">Procesando transcripción...</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

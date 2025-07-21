'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranscription } from '@/hooks/useTranscription'
import { MeetingTranscription } from '@/types'
import { FileText, Mic, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface TranscriptionPanelProps {
  meetingId: string
}

export default function TranscriptionPanel({ meetingId }: TranscriptionPanelProps) {
  const [transcription, setTranscription] = useState<MeetingTranscription | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const { isLoading, error, startTranscription, checkTranscriptionStatus, getTranscription } = useTranscription()

  // Load existing transcription on mount
  const loadTranscription = useCallback(async () => {
    const existing = await getTranscription(meetingId)
    setTranscription(existing)
  }, [getTranscription, meetingId])

  useEffect(() => {
    loadTranscription()
  }, [loadTranscription])

  // Poll for updates when transcription is processing
  useEffect(() => {
    if (transcription?.status === 'processing' && !isPolling) {
      setIsPolling(true)
      const interval = setInterval(async () => {
        if (transcription.id) {
          const updatedTranscription = await checkTranscriptionStatus(transcription.id)
          if (updatedTranscription) {
            setTranscription(updatedTranscription)
            if (updatedTranscription.status !== 'processing') {
              setIsPolling(false)
              clearInterval(interval)
            }
          }
        }
      }, 5000) // Check every 5 seconds

      return () => {
        clearInterval(interval)
        setIsPolling(false)
      }
    }
  }, [transcription?.status, transcription?.id, isPolling, checkTranscriptionStatus])

  const handleStartTranscription = async () => {
    // For demo purposes, we'll use a placeholder audio URL
    // In a real implementation, this would come from the recorded meeting
    const demoAudioUrl = 'https://github.com/AssemblyAI-Examples/audio-examples/raw/main/20230607_me_canadian_wildfires.mp3'
    
    const transcriptionId = await startTranscription(meetingId, demoAudioUrl)
    if (transcriptionId) {
      // Reload transcription data
      await loadTranscription()
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'bg-blue-100 text-blue-700'
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'failed':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const formatDuration = (seconds: number | undefined) => {
    if (!seconds) return 'N/A'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const formatConfidence = (confidence: number | undefined) => {
    if (!confidence) return 'N/A'
    return `${(confidence * 100).toFixed(1)}%`
  }

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <FileText className="w-5 h-5" />
          Transcripción de la Reunión
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {!transcription ? (
          <div className="text-center py-6">
            <Mic className="w-12 h-12 text-white/60 mx-auto mb-4" />
            <p className="text-white/80 mb-4">
              No se ha iniciado la transcripción para esta reunión
            </p>
            <Button
              onClick={handleStartTranscription}
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Iniciando...
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 mr-2" />
                  Iniciar Transcripción
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status and metadata */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(transcription.status)}
                <Badge className={getStatusColor(transcription.status)}>
                  {transcription.status === 'processing' ? 'Procesando...' :
                   transcription.status === 'completed' ? 'Completada' :
                   transcription.status === 'failed' ? 'Error' : 'Desconocido'}
                </Badge>
              </div>
              {transcription.processed_at && (
                <span className="text-white/60 text-sm">
                  {new Date(transcription.processed_at).toLocaleString('es-CO')}
                </span>
              )}
            </div>

            {/* Transcription metadata */}
            {transcription.status === 'completed' && (
              <div className="grid grid-cols-2 gap-4 p-3 bg-white/5 rounded-lg">
                <div>
                  <span className="text-white/60 text-sm">Duración:</span>
                  <p className="text-white">{formatDuration(transcription.audio_duration)}</p>
                </div>
                <div>
                  <span className="text-white/60 text-sm">Confianza:</span>
                  <p className="text-white">{formatConfidence(transcription.confidence)}</p>
                </div>
                <div>
                  <span className="text-white/60 text-sm">Palabras:</span>
                  <p className="text-white">{transcription.word_count || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-white/60 text-sm">Idioma:</span>
                  <p className="text-white">{transcription.language_code || 'es'}</p>
                </div>
              </div>
            )}

            {/* Transcription text */}
            {transcription.transcript_text && (
              <div className="space-y-2">
                <h4 className="text-white font-medium">Texto de la Transcripción:</h4>
                <div className="max-h-60 overflow-y-auto p-3 bg-white/5 rounded-lg">
                  <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">
                    {transcription.transcript_text}
                  </p>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
              {transcription.status === 'processing' && (
                <Button
                  onClick={loadTranscription}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 text-white border-white/30 hover:bg-white/20"
                >
                  Actualizar Estado
                </Button>
              )}
              {transcription.status === 'failed' && (
                <Button
                  onClick={handleStartTranscription}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Reintentar Transcripción
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

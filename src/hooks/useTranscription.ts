import { useState, useCallback } from 'react'
import { MeetingTranscription } from '@/types'

export interface UseTranscriptionReturn {
  isLoading: boolean
  error: string | null
  startTranscription: (meetingId: string, audioUrl: string) => Promise<string | null>
  checkTranscriptionStatus: (transcriptionId: string) => Promise<MeetingTranscription | null>
  getTranscription: (meetingId: string) => Promise<MeetingTranscription | null>
}

export function useTranscription(): UseTranscriptionReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startTranscription = useCallback(async (meetingId: string, audioUrl: string): Promise<string | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/transcription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetingId,
          audioUrl
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start transcription')
      }

      return data.transcriptionId
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('Error starting transcription:', err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const checkTranscriptionStatus = useCallback(async (transcriptionId: string): Promise<MeetingTranscription | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/transcription?transcriptionId=${transcriptionId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check transcription status')
      }

      return data.transcription
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('Error checking transcription status:', err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getTranscription = useCallback(async (meetingId: string): Promise<MeetingTranscription | null> => {
    setIsLoading(true)
    setError(null)

    try {
      // We'll implement a separate endpoint to get transcription by meeting ID
      const response = await fetch(`/api/transcription/meeting/${meetingId}`)
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 404) {
          return null // No transcription found
        }
        throw new Error(data.error || 'Failed to get transcription')
      }

      return data.transcription
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('Error getting transcription:', err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    isLoading,
    error,
    startTranscription,
    checkTranscriptionStatus,
    getTranscription
  }
}

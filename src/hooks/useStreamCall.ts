'use client'

import { useCallback, useEffect, useState } from 'react'
import { Call } from '@stream-io/video-react-sdk'
import { useStreamVideoClient } from '@stream-io/video-react-sdk'

export function useStreamCall(callId?: string) {
  const client = useStreamVideoClient()
  const [call, setCall] = useState<Call | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Crear y unirse a la llamada directamente
  useEffect(() => {
    if (!client || !callId) {
      return
    }

    const setupCall = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        console.log('Configurando llamada:', callId)
        
        // Crear la llamada directamente
        const newCall = client.call('default', callId)
        
        // Configurar la llamada con ajustes por defecto
        await newCall.getOrCreate({
          data: {
            settings_override: {
              audio: { 
                mic_default_on: true,
                default_device: 'speaker' 
              },
              video: { 
                camera_default_on: true 
              },
              screensharing: { 
                enabled: true 
              }
            }
          }
        })

        setCall(newCall)
        console.log('Llamada configurada exitosamente')
      } catch (err) {
        console.error('Error configurando llamada:', err)
        setError('Error al configurar la llamada')
      } finally {
        setIsLoading(false)
      }
    }

    setupCall()
  }, [client, callId])

  // Unirse a llamada
  const joinCall = useCallback(async () => {
    if (!call) {
      console.error('No hay llamada disponible para unirse')
      return false
    }

    try {
      setError(null)
      console.log('Uniéndose a la llamada...')
      await call.join({ create: true })
      console.log('Unido a la llamada exitosamente')
      return true
    } catch (err) {
      console.error('Error joining call:', err)
      setError('Error al unirse a la llamada')
      return false
    }
  }, [call])

  // Salir de llamada
  const leaveCall = useCallback(async () => {
    if (!call) return

    try {
      console.log('Saliendo de la llamada...')
      await call.leave()
      console.log('Salió de la llamada exitosamente')
    } catch (err) {
      console.error('Error leaving call:', err)
    }
  }, [call])

  return {
    call,
    isLoading,
    error,
    joinCall,
    leaveCall,
  }
}

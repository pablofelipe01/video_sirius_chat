'use client'

import { useEffect, useState } from 'react'
import { StreamVideoClient, User } from '@stream-io/video-react-sdk'
import { useAuth } from '@/contexts/AuthContext'

export function useStreamVideoClient() {
  const [client, setClient] = useState<StreamVideoClient | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { employee } = useAuth()

  useEffect(() => {
    if (!employee) {
      setLoading(false)
      return
    }

    const setupClient = async () => {
      try {
        setLoading(true)
        setError(null)

        // Verificar que tenemos las variables de entorno
        if (!process.env.NEXT_PUBLIC_STREAM_API_KEY) {
          throw new Error('NEXT_PUBLIC_STREAM_API_KEY no está configurado')
        }

        // Crear usuario para Stream.io
        const user: User = {
          id: employee.cedula,
          name: `${employee.first_name} ${employee.last_name}`,
          // Podemos agregar imagen después si tenemos avatares
          custom: {
            email: employee.email || '',
            department: employee.department || '',
          }
        }

        // Crear cliente de Stream Video con token provider para renovación automática
        const streamClient = new StreamVideoClient({
          apiKey: process.env.NEXT_PUBLIC_STREAM_API_KEY,
          user,
          tokenProvider: async () => {
            const response = await fetch('/api/stream/token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ userId: employee.cedula }),
            })

            if (!response.ok) {
              throw new Error('Error obteniendo token de Stream')
            }

            const { token } = await response.json()
            return token
          },
          // Opciones adicionales para debugging en desarrollo
          options: process.env.NODE_ENV === 'development' ? {
            logLevel: 'debug',
            logger: (logLevel, message, ...args) => {
              console.log(`[Stream ${logLevel}] ${message}`, ...args)
            }
          } : undefined
        })

        // Manejar eventos de conexión
        streamClient.on('connection.changed', (event) => {
          if (event.online) {
            console.log('Reconectado a Stream')
          } else {
            console.log('Desconectado de Stream')
          }
        })

        setClient(streamClient)
      } catch (err) {
        console.error('Error configurando Stream Video Client:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    setupClient()
  }, [employee])

  // Cleanup cuando el componente se desmonta
  useEffect(() => {
    return () => {
      if (client) {
        client.disconnectUser().catch(console.error)
      }
    }
  }, [client])

  return { client, loading, error }
}

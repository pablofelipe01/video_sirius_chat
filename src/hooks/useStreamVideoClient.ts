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

        // Obtener token del servidor
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

        // Crear usuario para Stream.io
        const user: User = {
          id: employee.cedula,
          name: `${employee.first_name} ${employee.last_name}`,
          // Podemos agregar imagen después si tenemos avatares
        }

        // Crear cliente de Stream Video
        const streamClient = new StreamVideoClient({
          apiKey: process.env.NEXT_PUBLIC_STREAM_API_KEY,
          user,
          token,
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
        client.disconnectUser()
      }
    }
  }, [client])

  return { client, loading, error }
}

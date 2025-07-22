'use client'

import { useEffect, useState } from 'react'
import { StreamVideoClient, User } from '@stream-io/video-react-sdk'
import { useAuth } from '@/contexts/AuthContext'

export function useStreamVideoClient(isGuest = false) {
  const [client, setClient] = useState<StreamVideoClient | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { employee } = useAuth()

  useEffect(() => {
    const setupClient = async () => {
      try {
        setLoading(true)
        setError(null)

        // Verificar que tenemos las variables de entorno
        if (!process.env.NEXT_PUBLIC_STREAM_API_KEY) {
          throw new Error('NEXT_PUBLIC_STREAM_API_KEY no está configurado')
        }

        let user: User
        let userId: string

        if (isGuest) {
          // Para invitados, usar información desde localStorage
          const guestName = localStorage.getItem('guest_name') || 'Invitado'
          userId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          
          user = {
            id: userId,
            name: guestName,
            custom: {
              type: 'guest',
            }
          }
        } else {
          // Para empleados autenticados
          if (!employee) {
            setLoading(false)
            return
          }

          userId = employee.cedula
          user = {
            id: userId,
            name: `${employee.first_name} ${employee.last_name}`,
            custom: {
              email: employee.email || '',
              department: employee.department || '',
              type: 'employee',
            }
          }
        }

        // Crear cliente de Stream Video con configuraciones básicas pero efectivas
        const streamClient = new StreamVideoClient({
          apiKey: process.env.NEXT_PUBLIC_STREAM_API_KEY,
          user,
          tokenProvider: async () => {
            const response = await fetch('/api/stream/token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ userId, isGuest }),
            })

            if (!response.ok) {
              throw new Error('Error obteniendo token de Stream')
            }

            const { token } = await response.json()
            return token
          },
          // Configuraciones básicas pero estables
          options: {
            // Timeout de conexión
            timeout: 15000, // 15 segundos
            
            // Logging según el ambiente
            ...(process.env.NODE_ENV === 'development' ? {
              logLevel: 'info',
              logger: (logLevel: string, message: string, ...args: unknown[]) => {
                if (logLevel === 'error' || logLevel === 'warn') {
                  console.log(`[Stream ${logLevel}] ${message}`, ...args)
                }
              }
            } : {
              logLevel: 'error' // Solo errores en producción
            })
          }
        })

        // Manejar eventos de conexión y calidad de red
        streamClient.on('connection.changed', (event) => {
          if (event.online) {
            console.log('✅ Reconectado a Stream Video')
          } else {
            console.log('⚠️ Desconectado de Stream Video')
          }
        })

        // Manejar eventos de calidad de conexión
        streamClient.on('connection.ok', () => {
          console.log('🔵 Conexión estable')
        })

        streamClient.on('connection.recovered', () => {
          console.log('🟢 Conexión recuperada')
        })

        // Manejar errores de conexión
        streamClient.on('connection.error', (error) => {
          console.error('🔴 Error de conexión:', error)
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
  }, [employee, isGuest])

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

'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import VideoRoom from '@/components/VideoRoom'

export default function VideoRoomPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { employee, loading } = useAuth()
  const [isGuest, setIsGuest] = useState(false)
  
  const roomId = params.roomId as string

  useEffect(() => {
    // Verificar si es un invitado
    const guestParam = searchParams.get('guest')
    if (guestParam === 'true') {
      setIsGuest(true)
      // Verificar que el invitado tenga un nombre guardado
      const guestName = localStorage.getItem('guest_name')
      if (!guestName) {
        // Si no hay nombre de invitado, redirigir de vuelta
        router.back()
        return
      }
    } else {
      // Para empleados, verificar autenticación
      if (!loading && !employee) {
        router.push('/')
        return
      }
    }
  }, [employee, loading, router, searchParams])

  if (loading && !isGuest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-white">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!employee && !isGuest) {
    return null
  }

  const handleLeaveRoom = () => {
    if (isGuest) {
      // Para invitados, limpiar localStorage y redirigir a página principal
      localStorage.removeItem('guest_name')
      router.push('/')
    } else {
      // Para empleados, redirigir al dashboard
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="container mx-auto max-w-6xl">
        <VideoRoom 
          roomId={roomId}
          onLeave={handleLeaveRoom}
          isGuest={isGuest}
        />
      </div>
    </div>
  )
}

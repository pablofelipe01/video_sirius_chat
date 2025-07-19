'use client'

import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect } from 'react'
import VideoRoom from '@/components/VideoRoom'

export default function VideoRoomPage() {
  const params = useParams()
  const router = useRouter()
  const { employee, loading } = useAuth()
  
  const roomId = params.roomId as string

  useEffect(() => {
    if (!loading && !employee) {
      router.push('/')
    }
  }, [employee, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-white">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!employee) {
    return null
  }

  const handleLeaveRoom = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="container mx-auto max-w-6xl">
        <VideoRoom 
          roomId={roomId}
          onLeave={handleLeaveRoom}
        />
      </div>
    </div>
  )
}

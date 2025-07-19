'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Video, Users, ArrowLeft } from 'lucide-react'
import VideoRoom from '@/components/VideoRoom'

export default function VideoTestPage() {
  const [inCall, setInCall] = useState(false)
  const [roomId, setRoomId] = useState('')

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      setInCall(true)
    }
  }

  const handleLeaveRoom = () => {
    setInCall(false)
    setRoomId('')
  }

  if (inCall) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 relative">
        {/* Background image */}
        <div className="absolute inset-0">
          <div 
            className="w-full h-full bg-cover bg-center bg-no-repeat brightness-50"
            style={{ backgroundImage: 'url(/imagen4.png)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/60 via-slate-800/40 to-emerald-900/30"></div>
        </div>

        <div className="relative z-10 p-4">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <Button
                onClick={handleLeaveRoom}
                variant="outline"
                className="bg-white/20 text-white border-white/30 hover:bg-white/30"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Salir de la Reunión
              </Button>
              <h1 className="text-2xl font-bold text-white">
                Reunión: {roomId}
              </h1>
            </div>

            {/* Video Room Component */}
            <VideoRoom roomId={roomId} onLeave={handleLeaveRoom} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 relative">
      {/* Background image */}
      <div className="absolute inset-0">
        <div 
          className="w-full h-full bg-cover bg-center bg-no-repeat brightness-50"
          style={{ backgroundImage: 'url(/imagen4.png)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/60 via-slate-800/40 to-emerald-900/30"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20 shadow-lg">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Video className="w-8 h-8 text-emerald-400" />
            </div>
            <CardTitle className="text-2xl text-white mb-2">
              Stream.io Video Test
            </CardTitle>
            <p className="text-white/80">
              Prueba básica de funcionalidad de video chat
            </p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  ID de la Sala
                </div>
              </label>
              <Input
                type="text"
                placeholder="Ej: test-room-123"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-white/30"
              />
            </div>

            <Button
              onClick={handleJoinRoom}
              disabled={!roomId.trim()}
              className="w-full bg-emerald-500/80 hover:bg-emerald-600/80 text-white"
            >
              <Video className="w-4 h-4 mr-2" />
              Unirse a la Sala
            </Button>

            <div className="pt-4 border-t border-white/20">
              <p className="text-xs text-white/70 text-center">
                💡 <strong>Tip:</strong> Abre esta página en otra pestaña/dispositivo con el mismo ID de sala para probar la funcionalidad multiusuario.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

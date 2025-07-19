'use client'

import { Button } from '@/components/ui/button'
import { LogOut, User, Settings } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import Image from 'next/image'

export default function DashboardHeader() {
  const { employee, logout } = useAuth()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-md border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo y branding */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative w-8 h-8 sm:w-10 sm:h-10">
              <Image
                src="/logo-sirius.png"
                alt="Sirius"
                fill
                className="object-contain drop-shadow-lg"
                priority
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg sm:text-xl font-bold text-white drop-shadow-md">
                SIRIUS Video Chat
              </h1>
              <p className="text-xs sm:text-sm text-emerald-200 drop-shadow-sm">
                Plataforma de Comunicación Interna
              </p>
            </div>
            <div className="sm:hidden">
              <h1 className="text-base font-bold text-white drop-shadow-md">
                SIRIUS
              </h1>
            </div>
          </div>

          {/* Usuario y acciones */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:flex items-center gap-3 px-3 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
              <User className="w-4 h-4 text-white" />
              <div>
                <p className="text-sm font-medium text-white">
                  {employee?.first_name} {employee?.last_name}
                </p>
                <p className="text-xs text-emerald-200">
                  {employee?.department}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-white hover:bg-white/20 hover:text-white border-white/30 p-2 sm:px-3"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden lg:inline ml-2">Configuración</span>
              </Button>
              
              <Button
                onClick={logout}
                variant="outline"
                size="sm"
                className="text-white hover:bg-red-500/20 hover:text-white border-white/30 p-2 sm:px-3"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden lg:inline ml-2">Salir</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

'use client'

import Image from "next/image"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Video, Sprout, Flame, Globe2, CreditCard } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

export default function Home() {
  const [cedula, setCedula] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login, error } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cedula.trim()) return

    setIsLoading(true)
    
    const success = await login(cedula.trim())
    
    if (success) {
      router.push('/dashboard')
    }
    
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen relative">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/foto2.jpg)',
            filter: 'brightness(0.7)'
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/60 via-green-800/40 to-amber-900/50"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Image
            src="/logo-sirius.png"
            alt="Sirius Regenerative Solutions"
            width={300}
            height={120}
            className="mx-auto drop-shadow-lg"
            priority
          />
          <p className="text-xl sm:text-2xl text-white mt-8 max-w-4xl mx-auto leading-relaxed drop-shadow-md">
            Transformando la agricultura a través de la pirólisis y prácticas regenerativas.
          </p>
          <p className="text-lg text-emerald-300 font-medium mt-4 drop-shadow-md">
            💚 ¡Sí podemos hacer un mundo mejor! 🌱
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Access Card */}
          <div className="max-w-md mx-auto mb-16">
            <Card className="border-2 border-emerald-300/50 shadow-2xl bg-white/95 backdrop-blur-md">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Video className="w-8 h-8 text-emerald-600" />
                </div>
                <CardTitle className="text-2xl text-slate-800 mb-2">
                  Acceso a la Plataforma
                </CardTitle>
                <p className="text-slate-600">
                  Ingresa tu número de cédula para acceder a nuestros servicios de video chat
                </p>
                {error && (
                  <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
                    {error}
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <CreditCard className="w-4 h-4 text-emerald-600" />
                        Número de Cédula
                      </div>
                    </label>
                    <Input
                      type="text"
                      placeholder="Ej: 1234567890"
                      value={cedula}
                      onChange={(e) => setCedula(e.target.value)}
                      className="text-center text-lg placeholder:text-slate-500 text-slate-900"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full text-lg py-3"
                    disabled={!cedula || isLoading}
                  >
                    {isLoading ? 'Verificando...' : 'Acceder'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <Card className="text-center hover:shadow-xl transition-all duration-300 bg-white/20 backdrop-blur-lg border border-white/30">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-emerald-100/80 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sprout className="w-8 h-8 text-emerald-600" />
                </div>
                <CardTitle className="mb-3 text-white">Agricultura Regenerativa</CardTitle>
                <p className="text-white/90">
                  Restaurando la salud del suelo y la biodiversidad para un futuro sostenible.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-xl transition-all duration-300 bg-white/20 backdrop-blur-lg border border-white/30">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-amber-100/80 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Flame className="w-8 h-8 text-amber-600" />
                </div>
                <CardTitle className="mb-3 text-white">Tecnología de Pirólisis</CardTitle>
                <p className="text-white/90">
                  Convirtiendo residuos orgánicos en biochar para mejorar la fertilidad del suelo.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-xl transition-all duration-300 bg-white/20 backdrop-blur-lg border border-white/30">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-teal-100/80 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe2 className="w-8 h-8 text-teal-600" />
                </div>
                <CardTitle className="mb-3 text-white">Impacto Ambiental</CardTitle>
                <p className="text-white/90">
                  Reduciendo las emisiones de carbono y creando un ecosistema más saludable.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 mt-16 border-t border-white/30 bg-black/30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-white/90 drop-shadow-md">
            © 2025 Sirius Regenerative Solutions. Construyendo un mundo mejor a través de la agricultura regenerativa.
          </p>
        </div>
      </footer>
    </div>
  )
}

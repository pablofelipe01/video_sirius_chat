import { StreamClient } from '@stream-io/node-sdk'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Verificar que las variables de entorno estén configuradas
    if (!process.env.NEXT_PUBLIC_STREAM_API_KEY || !process.env.STREAM_SECRET_KEY) {
      return NextResponse.json(
        { 
          error: 'Variables de entorno de Stream.io no configuradas',
          details: 'Configure NEXT_PUBLIC_STREAM_API_KEY y STREAM_SECRET_KEY en .env.local'
        },
        { status: 500 }
      )
    }

    const { userId, isGuest } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      )
    }

    // Inicializar cliente de Stream.io con las claves del servidor
    const streamClient = new StreamClient(
      process.env.NEXT_PUBLIC_STREAM_API_KEY,
      process.env.STREAM_SECRET_KEY
    )

    // Para invitados, token con expiración más corta (2 horas)
    // Para empleados, token con expiración estándar (8 horas)
    const expirationTime = isGuest 
      ? Math.floor(Date.now() / 1000) + 7200 // 2 horas para invitados
      : Math.floor(Date.now() / 1000) + 28800 // 8 horas para empleados

    // Generar token JWT para el usuario
    const token = streamClient.createToken(userId, expirationTime)

    return NextResponse.json({ token })
  } catch (error) {
    console.error('Error generando token de Stream:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

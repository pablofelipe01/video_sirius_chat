import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase with service role key for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Solo manejar transcripciones nativas de Stream.io
    const { 
      callCid, 
      transcriptionUrl, 
      transcriptionContent, 
      filename, 
      startTime, 
      endTime,
      userCedula // ✅ Obtener la cédula del usuario
    } = body

    console.log('💾 Guardando transcripción Stream.io:', filename)
    console.log('👤 Usuario que inició transcripción:', userCedula)
    console.log('🔗 CallCid recibido:', callCid)
    console.log('📋 Datos completos del body:', { 
      callCid, 
      transcriptionUrl: transcriptionUrl?.substring(0, 50) + '...', 
      filename, 
      startTime, 
      endTime,
      userCedula 
    })

    // Usar la cédula del usuario como host, con fallback si no se proporciona
    let hostCedula = userCedula;
    
    if (!hostCedula) {
      // Fallback: buscar un empleado activo
      const { data: firstEmployee } = await supabase
        .from('employees')
        .select('cedula')
        .eq('is_active', true)
        .limit(1)
        .single()
      
      hostCedula = firstEmployee?.cedula || '1234567890';
      console.log('⚠️ No se proporcionó userCedula, usando fallback:', hostCedula)
    }

    // Buscar o crear meeting basado en callCid
    let meetingId = null
    
    // El callCid viene como: "room-1753276621426-1vsfa707q"
    // Y el room_id en la base de datos también es: "room-1753276621426-1vsfa707q"
    // Así que NO necesitamos modificar el callCid, se usa tal como viene
    const roomIdFromCall = callCid;
    
    console.log('🔍 Buscando reunión existente con roomIdFromCall:', roomIdFromCall)
    console.log('🔍 CallCid original:', callCid)
    
    // Primero intentar buscar por meeting_id (que es el room_id de la reunión original)
    console.log('🔎 Búsqueda 1: Por meeting_id =', roomIdFromCall)
    const { data: existingMeeting, error: meetingError1 } = await supabase
      .from('meetings')
      .select('id, title, description, meeting_id, room_id')
      .eq('meeting_id', roomIdFromCall)
      .single()
    
    console.log('📊 Resultado búsqueda 1:', existingMeeting, meetingError1?.code)

    // Si no se encuentra por meeting_id, buscar por room_id
    let meetingToUse = existingMeeting
    if (!meetingToUse) {
      console.log('🔎 Búsqueda 2: Por room_id =', roomIdFromCall)
      const { data: meetingByRoomId, error: meetingError2 } = await supabase
        .from('meetings')
        .select('id, title, description, meeting_id, room_id')
        .eq('room_id', roomIdFromCall)
        .single()
      
      console.log('📊 Resultado búsqueda 2:', meetingByRoomId, meetingError2?.code)
      meetingToUse = meetingByRoomId
    }

    if (meetingToUse) {
      console.log('✅ Encontrada reunión existente:', meetingToUse.title)
      meetingId = meetingToUse.id
    } else {
      console.log('⚠️ No se encontró reunión existente, creando nueva')
      // Crear meeting para la transcripción (como fallback)
      const { data: newMeeting, error: meetingError } = await supabase
        .from('meetings')
        .insert({
          title: `Reunión ${roomIdFromCall}`,
          description: 'Reunión con transcripción Stream.io',
          room_id: roomIdFromCall,
          meeting_id: roomIdFromCall,
          status: 'completed',
          scheduled_at: startTime,
          duration_minutes: Math.ceil((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000),
          host_cedula: hostCedula, // ✅ Usar la cédula del usuario que inició la transcripción
          meeting_type: 'internal'
        })
        .select()
        .single()

      if (meetingError) {
        console.error('Error creating meeting:', meetingError)
        return NextResponse.json({ error: 'Failed to create meeting' }, { status: 500 })
      }
      
      meetingId = newMeeting.id
    }

    // Guardar transcripción
    const transcriptionData = {
      meeting_id: meetingId,
      audio_url: transcriptionUrl,
      transcript_text: transcriptionContent,
      status: 'completed',
      language_code: 'es',
      confidence: 0.95, // Stream.io tiene alta precisión
      audio_duration: Math.ceil((new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000),
      word_count: transcriptionContent ? transcriptionContent.split(' ').length : 0,
      processed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    console.log('💾 Datos de transcripción:', transcriptionData)

    const { data: transcriptionRecord, error: transcriptionError } = await supabase
      .from('meeting_transcriptions')
      .insert(transcriptionData)
      .select()
      .single()

    if (transcriptionError) {
      console.error('Error saving Stream.io transcription:', transcriptionError)
      return NextResponse.json({ error: 'Failed to save transcription' }, { status: 500 })
    }

    console.log('✅ Stream.io transcripción guardada:', transcriptionRecord.id)
    
    return NextResponse.json({ 
      success: true, 
      transcriptionId: transcriptionRecord.id,
      meetingId: meetingId
    })
    
  } catch (error) {
    console.error('Error in transcription API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Consultar estado de transcripción por meeting_id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const meetingId = searchParams.get('meeting_id')

    if (!meetingId) {
      return NextResponse.json(
        { error: 'meeting_id parameter is required' },
        { status: 400 }
      )
    }

    const { data: transcription, error } = await supabase
      .from('meeting_transcriptions')
      .select('*')
      .eq('meeting_id', meetingId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ transcription: null })
      }
      throw error
    }

    return NextResponse.json({ transcription })
    
  } catch (error) {
    console.error('Error fetching transcription:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transcription' },
      { status: 500 }
    )
  }
}

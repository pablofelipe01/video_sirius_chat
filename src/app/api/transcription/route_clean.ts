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
      endTime 
    } = body

    console.log('💾 Guardando transcripción Stream.io:', filename)

    // Buscar o crear meeting basado en callCid
    let meetingId = null
    
    // Intentar encontrar meeting por room_id (extraer de callCid)
    const roomId = callCid?.split('-')[0]?.replace('default_room-', '') || callCid
    
    const { data: existingMeeting } = await supabase
      .from('meetings')
      .select('id')
      .eq('room_id', roomId)
      .single()

    if (existingMeeting) {
      meetingId = existingMeeting.id
    } else {
      // Crear meeting para la transcripción
      const { data: newMeeting, error: meetingError } = await supabase
        .from('meetings')
        .insert({
          title: `Reunión ${roomId}`,
          description: 'Reunión con transcripción Stream.io',
          room_id: roomId,
          meeting_id: roomId,
          status: 'completed',
          scheduled_at: startTime,
          duration_minutes: Math.ceil((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000),
          host_cedula: 'system',
          meeting_type: 'video'
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
      stream_filename: filename, // Nuevo campo para Stream.io
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

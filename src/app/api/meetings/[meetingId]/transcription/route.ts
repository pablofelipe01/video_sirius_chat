import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase with service role key for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  try {
    const { meetingId } = await params

    console.log('🔎 API: Buscando transcripción para meeting_id:', meetingId)

    const { data: transcription, error } = await supabase
      .from('meeting_transcriptions')
      .select('*')
      .eq('meeting_id', meetingId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    console.log('📊 API: Resultado búsqueda transcripción:', transcription ? 'Encontrada' : 'No encontrada', error?.code)

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ transcription: null })
      }
      console.error('Error fetching transcription:', error)
      throw error
    }

    return NextResponse.json({ transcription })
    
  } catch (error) {
    console.error('Error in transcription API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transcription' },
      { status: 500 }
    )
  }
}

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

    if (!meetingId) {
      return NextResponse.json(
        { error: 'Meeting ID is required' },
        { status: 400 }
      )
    }

    // Get transcription record for the meeting
    const { data: transcription, error: dbError } = await supabase
      .from('meeting_transcriptions')
      .select('*')
      .eq('meeting_id', meetingId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (dbError) {
      if (dbError.code === 'PGRST116') {
        // No transcription found
        return NextResponse.json(
          { error: 'No transcription found for this meeting' },
          { status: 404 }
        )
      }
      console.error('Error fetching transcription:', dbError)
      return NextResponse.json(
        { error: 'Failed to fetch transcription' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      transcription
    })

  } catch (error) {
    console.error('Error in get transcription by meeting ID API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

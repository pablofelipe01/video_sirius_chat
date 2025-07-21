import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase with service role key for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { title, description, room_id, meeting_type, start_time } = await request.json()

    if (!title || !room_id) {
      return NextResponse.json(
        { error: 'Title and room ID are required' },
        { status: 400 }
      )
    }

    // Crear nueva reunión
    const { data: meeting, error } = await supabase
      .from('meetings')
      .insert({
        title,
        description: description || '',
        room_id,
        meeting_type: meeting_type || 'video',
        start_time: start_time || new Date().toISOString(),
        status: 'scheduled'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating meeting:', error)
      return NextResponse.json(
        { error: 'Failed to create meeting' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      meeting: meeting
    })

  } catch (error) {
    console.error('Error in create meeting API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

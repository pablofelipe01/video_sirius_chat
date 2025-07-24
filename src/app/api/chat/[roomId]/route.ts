import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase with service role key for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Get chat messages for a room
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params

    if (!roomId) {
      return NextResponse.json(
        { error: 'Room ID is required' },
        { status: 400 }
      )
    }

    // Get messages with participant information
    const { data: messages, error } = await supabase
      .rpc('get_chat_messages_with_participants', {
        room_id_param: roomId
      })

    if (error) {
      console.error('Error fetching chat messages:', error)
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: messages || []
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Send a new chat message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params
    const body = await request.json()

    if (!roomId) {
      return NextResponse.json(
        { error: 'Room ID is required' },
        { status: 400 }
      )
    }

    const {
      sender_cedula,
      sender_name,
      sender_type = 'internal',
      message_text,
      message_type = 'text',
      reply_to_id,
      metadata = {}
    } = body

    if (!sender_name || !message_text) {
      return NextResponse.json(
        { error: 'Sender name and message text are required' },
        { status: 400 }
      )
    }

    // Find or create meeting for this room
    let meetingId = null
    
    // Try to find existing meeting by room_id
    const { data: existingMeeting } = await supabase
      .from('meetings')
      .select('id')
      .eq('room_id', roomId)
      .single()

    if (existingMeeting) {
      meetingId = existingMeeting.id
    }

    // Insert the message
    const { data: message, error } = await supabase
      .from('chat_messages')
      .insert({
        meeting_id: meetingId,
        room_id: roomId,
        sender_cedula,
        sender_name,
        sender_type,
        message_text,
        message_type,
        reply_to_id,
        metadata
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting message:', error)
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: message
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update a chat message (edit)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params
    const body = await request.json()

    const { messageId, message_text, edited_by_cedula } = body

    if (!messageId || !message_text || !edited_by_cedula) {
      return NextResponse.json(
        { error: 'Message ID, text, and editor cedula are required' },
        { status: 400 }
      )
    }

    // Update the message (RLS will ensure user can only edit their own messages)
    const { data: message, error } = await supabase
      .from('chat_messages')
      .update({
        message_text,
        is_edited: true,
        edited_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .eq('room_id', roomId)
      .eq('sender_cedula', edited_by_cedula)
      .select()
      .single()

    if (error) {
      console.error('Error updating message:', error)
      return NextResponse.json(
        { error: 'Failed to update message' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: message
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a chat message
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params
    const { searchParams } = new URL(request.url)
    const messageId = searchParams.get('messageId')
    const deleted_by_cedula = searchParams.get('cedula')

    if (!messageId || !deleted_by_cedula) {
      return NextResponse.json(
        { error: 'Message ID and cedula are required' },
        { status: 400 }
      )
    }

    // Delete the message (RLS will ensure user can only delete their own messages)
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId)
      .eq('room_id', roomId)
      .eq('sender_cedula', deleted_by_cedula)

    if (error) {
      console.error('Error deleting message:', error)
      return NextResponse.json(
        { error: 'Failed to delete message' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Message deleted successfully'
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

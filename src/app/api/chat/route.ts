import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase with service role key for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get('roomId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!roomId) {
      return NextResponse.json(
        { error: 'Room ID is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .rpc('get_chat_messages', {
        input_room_id: roomId,
        limit_count: limit,
        offset_count: offset
      })

    if (error) {
      console.error('Error fetching chat messages:', error)
      return NextResponse.json(
        { error: 'Failed to fetch chat messages' },
        { status: 500 }
      )
    }

    return NextResponse.json({ messages: data || [] })
  } catch (error) {
    console.error('Error in chat messages API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      roomId,
      meetingId,
      senderCedula,
      senderName,
      senderType = 'internal',
      messageText,
      messageType = 'text',
      replyToId,
      metadata = {}
    } = body

    if (!roomId || !senderName || !messageText) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data: messageId, error } = await supabase
      .rpc('send_chat_message', {
        input_room_id: roomId,
        input_meeting_id: meetingId,
        input_sender_cedula: senderCedula,
        input_sender_name: senderName,
        input_sender_type: senderType,
        input_message_text: messageText,
        input_message_type: messageType,
        input_reply_to_id: replyToId,
        input_metadata: metadata
      })

    if (error) {
      console.error('Error sending chat message:', error)
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      messageId,
      message: 'Message sent successfully' 
    })
  } catch (error) {
    console.error('Error in send message API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

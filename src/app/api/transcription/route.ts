import { NextRequest, NextResponse } from 'next/server'
import { AssemblyAI } from 'assemblyai'
import { createClient } from '@supabase/supabase-js'

// Initialize AssemblyAI
const assemblyai = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY!
})

// Initialize Supabase with service role key for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { meetingId, audioUrl } = await request.json()

    if (!meetingId || !audioUrl) {
      return NextResponse.json(
        { error: 'Meeting ID and audio URL are required' },
        { status: 400 }
      )
    }

    console.log('Starting transcription for meeting:', meetingId)
    console.log('Audio URL:', audioUrl)

    // Create initial transcription record in database
    const { data: transcriptionRecord, error: dbError } = await supabase
      .from('meeting_transcriptions')
      .insert({
        meeting_id: meetingId,
        audio_url: audioUrl,
        status: 'processing',
        language_code: 'es' // Spanish by default
      })
      .select()
      .single()

    if (dbError) {
      console.error('Error creating transcription record:', dbError)
      return NextResponse.json(
        { error: 'Failed to create transcription record' },
        { status: 500 }
      )
    }

    // Submit audio for transcription to AssemblyAI
    const transcript = await assemblyai.transcripts.transcribe({
      audio: audioUrl,
      language_code: 'es', // Spanish
      speaker_labels: true, // Enable speaker diarization - compatible con español
      punctuate: true, // Compatible con español
      format_text: true, // Compatible con español
      dual_channel: false,
      // Características no disponibles para español:
      // auto_highlights, sentiment_analysis, entity_detection, auto_chapters
    })

    console.log('AssemblyAI transcript submitted with ID:', transcript.id)

    // Update the database record with AssemblyAI ID
    const { error: updateError } = await supabase
      .from('meeting_transcriptions')
      .update({
        assembly_id: transcript.id,
        status: transcript.status === 'completed' ? 'completed' : 'processing'
      })
      .eq('id', transcriptionRecord.id)

    if (updateError) {
      console.error('Error updating transcription record:', updateError)
    }

    // If transcription is already completed (usually not immediate)
    if (transcript.status === 'completed') {
      await updateCompletedTranscription(transcriptionRecord.id, transcript)
    }

    return NextResponse.json({
      success: true,
      transcriptionId: transcriptionRecord.id,
      assemblyId: transcript.id,
      status: transcript.status,
      message: 'Transcription started successfully'
    })

  } catch (error) {
    console.error('Error in transcription API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Function to check transcription status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const transcriptionId = searchParams.get('transcriptionId')
    const assemblyId = searchParams.get('assemblyId')

    if (!transcriptionId && !assemblyId) {
      return NextResponse.json(
        { error: 'Transcription ID or Assembly ID is required' },
        { status: 400 }
      )
    }

    // Get transcription record from database
    let query = supabase.from('meeting_transcriptions').select('*')
    
    if (transcriptionId) {
      query = query.eq('id', transcriptionId)
    } else {
      query = query.eq('assembly_id', assemblyId)
    }

    const { data: transcriptionRecord, error: dbError } = await query.single()

    if (dbError || !transcriptionRecord) {
      console.error('Error fetching transcription:', dbError)
      return NextResponse.json(
        { error: 'Transcription not found' },
        { status: 404 }
      )
    }

    // If transcription is still processing, check status with AssemblyAI
    if (transcriptionRecord.status === 'processing' && transcriptionRecord.assembly_id) {
      const transcript = await assemblyai.transcripts.get(transcriptionRecord.assembly_id)
      
      if (transcript.status === 'completed') {
        // Update database with completed transcription
        await updateCompletedTranscription(transcriptionRecord.id, transcript)
        
        // Return updated record
        const { data: updatedRecord } = await supabase
          .from('meeting_transcriptions')
          .select('*')
          .eq('id', transcriptionRecord.id)
          .single()
          
        return NextResponse.json({
          success: true,
          transcription: updatedRecord
        })
      } else if (transcript.status === 'error') {
        // Update status to failed
        await supabase
          .from('meeting_transcriptions')
          .update({ status: 'failed' })
          .eq('id', transcriptionRecord.id)
      }
    }

    return NextResponse.json({
      success: true,
      transcription: transcriptionRecord
    })

  } catch (error) {
    console.error('Error checking transcription status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to update completed transcription
async function updateCompletedTranscription(transcriptionId: string, transcript: unknown) {
  try {
    // Type assertion for AssemblyAI transcript object
    const typedTranscript = transcript as {
      words?: Array<unknown>
      text?: string
      confidence?: number
      audio_duration?: number
    }
    
    const wordCount = typedTranscript.words ? typedTranscript.words.length : 0
    
    const { error } = await supabase
      .from('meeting_transcriptions')
      .update({
        transcript_text: typedTranscript.text,
        transcript_json: transcript,
        status: 'completed',
        confidence: typedTranscript.confidence,
        audio_duration: typedTranscript.audio_duration,
        word_count: wordCount,
        processed_at: new Date().toISOString()
      })
      .eq('id', transcriptionId)

    if (error) {
      console.error('Error updating completed transcription:', error)
    } else {
      console.log('Transcription completed and saved for ID:', transcriptionId)
    }
  } catch (error) {
    console.error('Error in updateCompletedTranscription:', error)
  }
}

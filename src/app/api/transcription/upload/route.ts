import { NextRequest, NextResponse } from 'next/server'
import { AssemblyAI } from 'assemblyai'

// Initialize AssemblyAI
const assemblyai = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY!
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }

    console.log('Uploading audio file:', audioFile.name, 'Size:', audioFile.size)

    // Convert File to ArrayBuffer
    const arrayBuffer = await audioFile.arrayBuffer()
    const audioBuffer = new Uint8Array(arrayBuffer)

    // Upload to AssemblyAI
    const uploadUrl = await assemblyai.files.upload(audioBuffer)
    
    console.log('Audio uploaded to AssemblyAI:', uploadUrl)

    return NextResponse.json({
      success: true,
      audioUrl: uploadUrl,
      message: 'Audio uploaded successfully'
    })

  } catch (error) {
    console.error('Error uploading audio:', error)
    return NextResponse.json(
      { error: 'Failed to upload audio' },
      { status: 500 }
    )
  }
}

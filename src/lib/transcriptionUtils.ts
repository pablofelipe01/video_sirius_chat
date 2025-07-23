// Utilidades para procesar transcripciones de Stream.io

export interface TranscriptionSegment {
  speaker_id: string;
  type: 'speech' | 'silence';
  text: string;
  start_ts: number; // Timestamp en milisegundos
  stop_ts: number;  // Timestamp en milisegundos
}

export interface ParsedTranscription {
  segments: TranscriptionSegment[];
  totalDuration: number;
  speakers: string[];
  wordCount: number;
}

/**
 * Parsea el contenido JSONL de Stream.io a un formato más manejable
 */
export function parseStreamIOTranscription(jsonlContent: string): ParsedTranscription {
  if (!jsonlContent || jsonlContent.trim() === '') {
    return {
      segments: [],
      totalDuration: 0,
      speakers: [],
      wordCount: 0
    };
  }

  const lines = jsonlContent.trim().split('\n');
  const segments: TranscriptionSegment[] = [];
  const speakers = new Set<string>();
  let totalWords = 0;
  let maxTimestamp = 0;

  for (const line of lines) {
    try {
      const segment = JSON.parse(line) as TranscriptionSegment;
      
      // Solo procesar segmentos de speech (no silence)
      if (segment.type === 'speech' && segment.text) {
        segments.push(segment);
        speakers.add(segment.speaker_id);
        totalWords += segment.text.split(' ').length;
        maxTimestamp = Math.max(maxTimestamp, segment.stop_ts);
      }
    } catch (error) {
      console.warn('Error parsing transcription line:', line, error);
      // Continúa con la siguiente línea
    }
  }

  return {
    segments,
    totalDuration: maxTimestamp,
    speakers: Array.from(speakers),
    wordCount: totalWords
  };
}

/**
 * Formatea un timestamp en milisegundos a formato MM:SS
 */
export function formatTimestamp(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Agrupa segmentos consecutivos del mismo speaker para mejor legibilidad
 */
export function groupSegmentsBySpeaker(segments: TranscriptionSegment[]): Array<{
  speaker_id: string;
  text: string;
  start_ts: number;
  stop_ts: number;
  segmentCount: number;
}> {
  if (segments.length === 0) return [];

  const grouped = [];
  let currentGroup = {
    speaker_id: segments[0].speaker_id,
    text: segments[0].text,
    start_ts: segments[0].start_ts,
    stop_ts: segments[0].stop_ts,
    segmentCount: 1
  };

  for (let i = 1; i < segments.length; i++) {
    const segment = segments[i];
    
    // Si es el mismo speaker y está cerca en tiempo (menos de 5 segundos de diferencia)
    if (segment.speaker_id === currentGroup.speaker_id && 
        (segment.start_ts - currentGroup.stop_ts) < 5000) {
      // Agregar al grupo actual
      currentGroup.text += ' ' + segment.text;
      currentGroup.stop_ts = segment.stop_ts;
      currentGroup.segmentCount++;
    } else {
      // Nuevo grupo
      grouped.push(currentGroup);
      currentGroup = {
        speaker_id: segment.speaker_id,
        text: segment.text,
        start_ts: segment.start_ts,
        stop_ts: segment.stop_ts,
        segmentCount: 1
      };
    }
  }
  
  grouped.push(currentGroup);
  return grouped;
}

/**
 * Genera un resumen de la transcripción
 */
export function generateTranscriptionSummary(parsed: ParsedTranscription): string {
  const { segments, totalDuration, speakers, wordCount } = parsed;
  
  const duration = formatTimestamp(totalDuration);
  const speakerCount = speakers.length;
  const segmentCount = segments.length;
  
  return `Duración: ${duration} | ${speakerCount} participante${speakerCount > 1 ? 's' : ''} | ${wordCount} palabras | ${segmentCount} segmentos`;
}

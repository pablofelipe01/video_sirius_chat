'use client';

import { useState } from 'react';
import { Clock, Users, MessageSquare, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { parseStreamIOTranscription, groupSegmentsBySpeaker, formatTimestamp, generateTranscriptionSummary } from '@/lib/transcriptionUtils';

interface TranscriptionViewerProps {
  transcriptionContent: string;
  filename?: string;
  audioUrl?: string;
}

export function TranscriptionViewer({ transcriptionContent, filename, audioUrl }: TranscriptionViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<'grouped' | 'segments'>('grouped');

  // Parsear la transcripción
  const parsed = parseStreamIOTranscription(transcriptionContent);
  const grouped = groupSegmentsBySpeaker(parsed.segments);
  const summary = generateTranscriptionSummary(parsed);

  const downloadTranscription = async () => {
    if (!audioUrl) return;
    
    try {
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'transcripcion.jsonl';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading transcription:', error);
    }
  };

  if (parsed.segments.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-gray-600 text-center">No hay transcripción disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header con resumen */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-blue-900 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Transcripción de Stream.io
          </h3>
          
          <div className="flex items-center gap-2">
            {audioUrl && (
              <button
                onClick={downloadTranscription}
                className="flex items-center gap-1 px-3 py-1 text-sm text-blue-700 hover:text-blue-800 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
              >
                <Download className="w-3 h-3" />
                Descargar
              </button>
            )}
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 px-3 py-1 text-sm text-blue-700 hover:text-blue-800 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
            >
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {isExpanded ? 'Contraer' : 'Expandir'}
            </button>
          </div>
        </div>
        
        <p className="text-sm text-blue-700 flex items-center gap-2">
          <Clock className="w-3 h-3" />
          {summary}
        </p>
      </div>

      {/* Controles de visualización */}
      {isExpanded && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Vista:</span>
          <button
            onClick={() => setViewMode('grouped')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              viewMode === 'grouped'
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Agrupada
          </button>
          <button
            onClick={() => setViewMode('segments')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              viewMode === 'segments'
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Segmentos
          </button>
        </div>
      )}

      {/* Contenido de la transcripción */}
      {isExpanded && (
        <div className="bg-white border rounded-lg">
          {viewMode === 'grouped' ? (
            // Vista agrupada por speaker
            <div className="space-y-3 p-4">
              {grouped.map((group, index) => (
                <div key={index} className="border-l-4 border-green-400 pl-4 py-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-700">
                      Participante {group.speaker_id}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatTimestamp(group.start_ts)} - {formatTimestamp(group.stop_ts)}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {group.segmentCount} segmento{group.segmentCount > 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-gray-800 leading-relaxed">{group.text}</p>
                </div>
              ))}
            </div>
          ) : (
            // Vista de segmentos individuales
            <div className="divide-y divide-gray-200">
              {parsed.segments.map((segment, index) => (
                <div key={index} className="p-3 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-3 h-3 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">
                        {segment.speaker_id}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(segment.start_ts)} - {formatTimestamp(segment.stop_ts)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800">{segment.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

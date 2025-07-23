'use client';

import { useState, useEffect } from 'react';
import { Mic, MicOff, FileText, Loader2, Download, CheckCircle2, XCircle } from 'lucide-react';
import { useCall } from '@stream-io/video-react-sdk';

interface TranscriptionSegment {
  text: string;
  timestamp: number;
  speaker?: string;
  type: 'system' | 'user';
}

interface CallTranscription {
  filename: string;
  url: string;
  start_time: string;
  end_time: string;
  session_id: string;
}

interface StreamTranscriptionProps {
  roomId?: string;
}

export function StreamTranscription({ roomId }: StreamTranscriptionProps) {
  const call = useCall();
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState<TranscriptionSegment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [transcriptionReady, setTranscriptionReady] = useState<CallTranscription | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Escuchar eventos de transcripción de Stream.io
  useEffect(() => {
    if (!call) return;

    const handleTranscriptionStarted = (event: unknown) => {
      console.log('📹 Stream.io: Transcripción iniciada:', event);
      setIsRecording(true);
      setIsLoading(false);
      setError(null);
      
      const segment: TranscriptionSegment = {
        text: '✅ Transcripción iniciada con éxito usando Stream.io',
        timestamp: Date.now(),
        speaker: 'Sistema',
        type: 'system',
      };
      setTranscription(prev => [...prev, segment]);
    };

    const handleTranscriptionStopped = (event: unknown) => {
      console.log('📹 Stream.io: Transcripción detenida:', event);
      setIsRecording(false);
      setIsLoading(false);
      
      const segment: TranscriptionSegment = {
        text: '⏹️ Transcripción detenida. Procesando archivo final...',
        timestamp: Date.now(),
        speaker: 'Sistema',
        type: 'system',
      };
      setTranscription(prev => [...prev, segment]);
    };

    const handleTranscriptionReady = async (event: { call_transcription: CallTranscription }) => {
      console.log('📹 Stream.io: Transcripción lista:', event);
      setTranscriptionReady(event.call_transcription);
      
      // Obtener la cédula del usuario aquí también (por si acaso)
      const savedEmployee = localStorage.getItem('sirius_employee');
      let userCedula = null;
      if (savedEmployee) {
        try {
          const employee = JSON.parse(savedEmployee);
          userCedula = employee.cedula;
          console.log('👤 Cédula obtenida en transcriptionReady:', userCedula);
        } catch (error) {
          console.error('Error parsing employee data:', error);
        }
      }
      
      // Guardar en nuestra base de datos también
      try {
        // Usar roomId si está disponible, sino usar session_id como fallback
        const callCid = roomId || event.call_transcription.session_id;
        console.log('🔗 StreamTranscription - roomId prop:', roomId);
        console.log('🔗 StreamTranscription - session_id:', event.call_transcription.session_id);
        console.log('🔗 StreamTranscription - callCid final:', callCid);
        
        const transcriptionResponse = await fetch(event.call_transcription.url);
        const transcriptionContent = await transcriptionResponse.text();
        
        const response = await fetch('/api/transcription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            callCid,
            transcriptionUrl: event.call_transcription.url,
            transcriptionContent,
            filename: event.call_transcription.filename,
            startTime: event.call_transcription.start_time,
            endTime: event.call_transcription.end_time,
            userCedula, // ✅ Cédula obtenida directamente aquí
            source: 'stream_io_native'
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to save transcription: ${response.statusText}`);
        }
        
        const segment: TranscriptionSegment = {
          text: `✅ ¡Transcripción completa y guardada en Supabase! Archivo: ${event.call_transcription.filename}`,
          timestamp: Date.now(),
          speaker: 'Sistema',
          type: 'system',
        };
        setTranscription(prev => [...prev, segment]);
      } catch (error) {
        console.error('Error saving transcription to database:', error);
        const segment: TranscriptionSegment = {
          text: `✅ Transcripción completa (Stream.io) - Error guardando en Supabase`,
          timestamp: Date.now(),
          speaker: 'Sistema', 
          type: 'system',
        };
        setTranscription(prev => [...prev, segment]);
      }
    };

    const handleTranscriptionFailed = (event: unknown) => {
      console.error('❌ Stream.io: Error en transcripción:', event);
      setError('Error en la transcripción de Stream.io');
      setIsLoading(false);
      setIsRecording(false);
      
      // Type-safe error handling
      let errorMessage = 'Error desconocido';
      if (event && typeof event === 'object' && 'error' in event) {
        errorMessage = String((event as { error: unknown }).error) || 'Error desconocido';
      }
      
      const segment: TranscriptionSegment = {
        text: `❌ Error en transcripción: ${errorMessage}`,
        timestamp: Date.now(),
        speaker: 'Sistema',
        type: 'system',
      };
      setTranscription(prev => [...prev, segment]);
    };

    // Suscribirse a los eventos
    const unsubscribeStarted = call.on('call.transcription_started', handleTranscriptionStarted);
    const unsubscribeStopped = call.on('call.transcription_stopped', handleTranscriptionStopped);
    const unsubscribeReady = call.on('call.transcription_ready', handleTranscriptionReady);
    const unsubscribeFailed = call.on('call.transcription_failed', handleTranscriptionFailed);

    return () => {
      unsubscribeStarted();
      unsubscribeStopped();
      unsubscribeReady();
      unsubscribeFailed();
    };
  }, [call, roomId]);

  const startTranscription = async () => {
    if (!call) {
      setError('No hay llamada activa');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Agregar mensaje de inicio
      const startSegment: TranscriptionSegment = {
        text: '🚀 Iniciando transcripción nativa de Stream.io (sin límites de tamaño)...',
        timestamp: Date.now(),
        speaker: 'Sistema',
        type: 'system',
      };
      setTranscription(prev => [...prev, startSegment]);

      await call.startTranscription({
        enable_closed_captions: true,
        language: 'es', // Español
      });
      
    } catch (error: unknown) {
      console.error('Error starting transcription:', error);
      setIsLoading(false);
      
      // Type-safe error handling
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(`Error al iniciar transcripción: ${errorMessage}`);
      
      const errorSegment: TranscriptionSegment = {
        text: `❌ Error: ${errorMessage}`,
        timestamp: Date.now(),
        speaker: 'Sistema',
        type: 'system',
      };
      setTranscription(prev => [...prev, errorSegment]);
    }
  };

  const stopTranscription = async () => {
    if (!call) return;
    
    setIsLoading(true);
    try {
      await call.stopTranscription();
      
      const segment: TranscriptionSegment = {
        text: '⏳ Transcripción detenida. Procesando archivo final... (puede tardar unos minutos)',
        timestamp: Date.now(),
        speaker: 'Sistema',
        type: 'system',
      };
      setTranscription(prev => [...prev, segment]);
      
    } catch (error: unknown) {
      console.error('Error stopping transcription:', error);
      setIsLoading(false);
      
      // Type-safe error handling
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(`Error al detener transcripción: ${errorMessage}`);
    }
  };

  const downloadTranscription = async () => {
    if (!transcriptionReady?.url) return;
    
    try {
      const response = await fetch(transcriptionReady.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = transcriptionReady.filename || 'transcripcion.txt';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      const segment: TranscriptionSegment = {
        text: '💾 Transcripción descargada exitosamente',
        timestamp: Date.now(),
        speaker: 'Sistema',
        type: 'system',
      };
      setTranscription(prev => [...prev, segment]);
    } catch (error) {
      console.error('Error downloading transcription:', error);
      setError('Error al descargar la transcripción');
    }
  };

  const clearTranscription = () => {
    setTranscription([]);
    setTranscriptionReady(null);
    setError(null);
  };

  return (
    <div className="flex flex-col h-full bg-white border rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">Transcripción Stream.io</h3>
            <p className="text-xs text-gray-600">Transcripción nativa en la nube</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {transcriptionReady && (
            <button
              onClick={downloadTranscription}
              className="flex items-center gap-2 px-3 py-1 text-sm text-green-700 hover:text-green-800 bg-green-100 hover:bg-green-200 border border-green-300 rounded-md transition-colors"
            >
              <Download className="w-4 h-4" />
              Descargar
            </button>
          )}
          
          <button
            onClick={clearTranscription}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md transition-colors"
            disabled={transcription.length === 0}
          >
            Limpiar
          </button>
          
          <button
            onClick={isRecording ? stopTranscription : startTranscription}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isLoading || !call}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isRecording ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
            {isLoading 
              ? 'Procesando...'
              : isRecording 
                ? 'Detener Transcripción' 
                : 'Iniciar Transcripción'
            }
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border-l-4 border-red-400 flex items-center gap-2">
          <XCircle className="w-4 h-4 text-red-600" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {transcription.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <Mic className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="font-medium text-gray-800 mb-2">Transcripción Nativa Stream.io</h4>
              <p className="text-sm text-gray-600 mb-4">
                Presiona `Iniciar Transcripción` para comenzar
              </p>
              
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Sin límites de tamaño de archivo</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Procesamiento en la nube de Stream.io</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Optimizado para español</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Descarga automática cuando esté listo</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {transcription.map((segment, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-lg transition-colors ${
                  segment.type === 'system' 
                    ? 'bg-blue-50 border-l-4 border-blue-400' 
                    : 'bg-gray-50 border-l-4 border-gray-300'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${
                      segment.type === 'system' ? 'text-blue-700' : 'text-green-600'
                    }`}>
                      {segment.speaker}
                    </span>
                    {segment.type === 'system' && (
                      <span className="px-2 py-0.5 text-xs bg-blue-200 text-blue-800 rounded-full">
                        Sistema
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(segment.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-gray-800 leading-relaxed">{segment.text}</p>
              </div>
            ))}
            
            {isLoading && (
              <div className="p-3 bg-blue-50 rounded-lg flex items-center gap-2 border-l-4 border-blue-400">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-blue-600 text-sm">
                  {isRecording ? 'Deteniendo transcripción...' : 'Iniciando transcripción...'}
                </span>
              </div>
            )}
            
            {transcriptionReady && (
              <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <h4 className="font-medium text-green-800">¡Transcripción Completa!</h4>
                </div>
                <div className="text-sm text-green-700 space-y-1 mb-3">
                  <p><strong>Archivo:</strong> {transcriptionReady.filename}</p>
                  <p><strong>Inicio:</strong> {new Date(transcriptionReady.start_time).toLocaleString()}</p>
                  <p><strong>Fin:</strong> {new Date(transcriptionReady.end_time).toLocaleString()}</p>
                </div>
                
                <div className="bg-white p-3 rounded border">
                  <p className="text-sm text-gray-600 mb-2">
                    ✅ <strong>Transcripción guardada en Supabase</strong>
                  </p>
                  <p className="text-xs text-gray-500">
                    La transcripción estará disponible en tu dashboard con formato mejorado, 
                    incluyendo timestamps y agrupación por participante.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

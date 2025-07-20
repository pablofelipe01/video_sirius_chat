'use client'

import { useCallStateHooks } from '@stream-io/video-react-sdk'
import { useCallback, useEffect, useState } from 'react'

export function useDeviceManager() {
  const { useCameraState, useMicrophoneState, useScreenShareState } = useCallStateHooks()
  const { camera, devices: cameras } = useCameraState()
  const { microphone, devices: microphones } = useMicrophoneState()
  const { screenShare } = useScreenShareState()
  
  const [selectedCamera, setSelectedCamera] = useState<string>('')
  const [selectedMic, setSelectedMic] = useState<string>('')

  // Seleccionar dispositivos por defecto
  useEffect(() => {
    if (cameras.length > 0 && !selectedCamera) {
      setSelectedCamera(cameras[0].deviceId)
    }
    if (microphones.length > 0 && !selectedMic) {
      setSelectedMic(microphones[0].deviceId)
    }
  }, [cameras, microphones, selectedCamera, selectedMic])

  // Cambiar cámara
  const switchCamera = useCallback(async (deviceId: string) => {
    try {
      await camera.select(deviceId)
      setSelectedCamera(deviceId)
    } catch (error) {
      console.error('Error switching camera:', error)
    }
  }, [camera])

  // Cambiar micrófono
  const switchMicrophone = useCallback(async (deviceId: string) => {
    try {
      await microphone.select(deviceId)
      setSelectedMic(deviceId)
    } catch (error) {
      console.error('Error switching microphone:', error)
    }
  }, [microphone])

  // Toggle compartir pantalla
  const toggleScreenShare = useCallback(async () => {
    try {
      await screenShare.toggle()
    } catch (error) {
      console.error('Error toggling screen share:', error)
    }
  }, [screenShare])

  return {
    // Dispositivos
    cameras,
    microphones,
    selectedCamera,
    selectedMic,
    
    // Acciones
    switchCamera,
    switchMicrophone,
    toggleScreenShare,
    
    // Controles básicos
    toggleCamera: camera.toggle,
    toggleMic: microphone.toggle,
  }
}

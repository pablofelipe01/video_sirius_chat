'use client'

import { useEffect, useState } from 'react'
import { useCallStateHooks } from '@stream-io/video-react-sdk'

export function useMediaPermissions() {
  const { useCameraState, useMicrophoneState } = useCallStateHooks()
  const { camera } = useCameraState()
  const { microphone } = useMicrophoneState()
  
  const [permissions, setPermissions] = useState({
    camera: 'prompt' as PermissionState,
    microphone: 'prompt' as PermissionState,
  })

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const cameraPermission = await navigator.permissions.query({ 
          name: 'camera' as PermissionName 
        })
        const micPermission = await navigator.permissions.query({ 
          name: 'microphone' as PermissionName 
        })
        
        setPermissions({
          camera: cameraPermission.state,
          microphone: micPermission.state,
        })
        
        // Escuchar cambios de permisos
        cameraPermission.onchange = () => {
          setPermissions(prev => ({ ...prev, camera: cameraPermission.state }))
        }
        micPermission.onchange = () => {
          setPermissions(prev => ({ ...prev, microphone: micPermission.state }))
        }
      } catch (error) {
        console.error('Error checking permissions:', error)
      }
    }
    
    checkPermissions()
  }, [])

  const requestCameraPermission = async () => {
    try {
      await camera.enable()
      return true
    } catch (error) {
      console.error('Camera permission denied:', error)
      return false
    }
  }

  const requestMicrophonePermission = async () => {
    try {
      await microphone.enable()
      return true
    } catch (error) {
      console.error('Microphone permission denied:', error)
      return false
    }
  }

  return {
    permissions,
    requestCameraPermission,
    requestMicrophonePermission,
  }
}

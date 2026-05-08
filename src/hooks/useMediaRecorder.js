import { useState, useRef, useCallback } from 'react'

function getSupportedMimeType() {
  if (typeof MediaRecorder === 'undefined') return ''
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/ogg',
  ]
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type
  }
  return ''
}

export function useMediaRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioDataUrl, setAudioDataUrl] = useState(null)
  const [error, setError] = useState(null)
  const [deviceNotFound, setDeviceNotFound] = useState(false)
  const [duration, setDuration] = useState(0)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const mimeTypeRef = useRef('')

  const startRecording = useCallback(async () => {
    setError(null)
    setDeviceNotFound(false)
    setAudioDataUrl(null)
    setDuration(0)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = getSupportedMimeType()
      const options = mimeType ? { mimeType } : {}
      const mediaRecorder = new MediaRecorder(stream, options)
      mediaRecorderRef.current = mediaRecorder
      // Read mimeType immediately after construction — browsers expose the actual assigned
      // format here before start(). Reading it in onstop returns '' on some mobile browsers.
      // Fall back to audio/mp4 (not webm) since iOS records AAC-in-MP4 when unspecified.
      mimeTypeRef.current = mediaRecorder.mimeType || mimeType || 'audio/mp4'
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop())
        if (chunksRef.current.length === 0) {
          setError('No audio was captured — try recording for a moment longer')
          return
        }
        const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current })
        const reader = new FileReader()
        reader.onload = () => {
          // Some mobile browsers (Firefox Android, older iOS Safari) fire onerror
          // spuriously on a normal stop before onstop runs. Clear it here so the
          // error banner doesn't linger when audio was actually captured.
          setError(null)
          setAudioDataUrl(reader.result)
        }
        reader.onerror = () => setError('Failed to process the recording')
        reader.readAsDataURL(blob)
      }

      mediaRecorder.onerror = (e) => {
        setError(e.error?.message || 'Recording error')
        setIsRecording(false)
        clearInterval(timerRef.current)
        stream.getTracks().forEach(t => t.stop())
      }

      mediaRecorder.start(100)
      setIsRecording(true)

      timerRef.current = setInterval(() => {
        setDuration(d => d + 1)
      }, 1000)
    } catch (err) {
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setDeviceNotFound(true)
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Microphone access denied')
      } else {
        setError(err.message || 'Could not start recording')
      }
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      clearInterval(timerRef.current)
    }
  }, [isRecording])

  const clearRecording = useCallback(() => {
    setAudioDataUrl(null)
    setDuration(0)
    setDeviceNotFound(false)
    setError(null)
  }, [])

  return { isRecording, audioDataUrl, error, deviceNotFound, duration, startRecording, stopRecording, clearRecording }
}

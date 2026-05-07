import { useEffect, useRef } from 'react'
import { Mic, Square, Trash2, Upload } from 'lucide-react'
import { useMediaRecorder } from '../hooks/useMediaRecorder'

function formatDuration(s) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export default function AudioRecorder({ value, onChange }) {
  const { isRecording, audioDataUrl, error, deviceNotFound, duration, startRecording, stopRecording, clearRecording } = useMediaRecorder()
  const fileRef = useRef()

  useEffect(() => {
    if (audioDataUrl) onChange(audioDataUrl)
  }, [audioDataUrl, onChange])

  const handleClear = () => {
    clearRecording()
    onChange(null)
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onChange(reader.result)
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-xs text-red-600 font-ui">{error}</p>}

      {!value && !isRecording && !deviceNotFound && (
        <button
          type="button"
          onClick={startRecording}
          className="flex items-center gap-2 text-sm text-espresso-light hover:text-amber font-ui transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-parchment-dark flex items-center justify-center">
            <Mic size={14} />
          </div>
          <span>Add voice note</span>
        </button>
      )}

      {deviceNotFound && !value && (
        <button
          type="button"
          onClick={() => fileRef.current.click()}
          className="flex items-center gap-2 text-sm text-espresso-light hover:text-amber font-ui transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-parchment-dark flex items-center justify-center">
            <Upload size={14} />
          </div>
          <span>Upload audio file</span>
        </button>
      )}

      <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={handleFileChange} />

      {isRecording && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-ui text-espresso-mid tabular-nums">{formatDuration(duration)}</span>
          </div>
          <button
            type="button"
            onClick={stopRecording}
            className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-ui"
          >
            <Square size={14} fill="currentColor" />
            Stop
          </button>
        </div>
      )}

      {value && !isRecording && (
        <div className="flex items-center gap-2">
          <audio src={value} controls className="flex-1" style={{ height: '32px', maxWidth: '220px' }} />
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 text-espresso-light hover:text-red-500 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

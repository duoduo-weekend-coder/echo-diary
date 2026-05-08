import { useState, useRef, useCallback } from 'react'
import { X, Image, Trash2 } from 'lucide-react'
import { today } from '../utils/dateUtils'
import AudioRecorder from './AudioRecorder'

export default function EntryEditor({ onSave, onClose, initialEntry }) {
  const isEditing = !!initialEntry
  const [text, setText] = useState(initialEntry?.text || '')
  const [audioDataUrl, setAudioDataUrl] = useState(initialEntry?.audioDataUrl || null)
  const [photoDataUrl, setPhotoDataUrl] = useState(initialEntry?.photoDataUrl || null)
  const [date, setDate] = useState(initialEntry?.date || today())
  const fileRef = useRef()

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPhotoDataUrl(reader.result)
    reader.readAsDataURL(file)
  }

  const handleAudioChange = useCallback((url) => {
    setAudioDataUrl(url)
  }, [])

  const handleSave = () => {
    if (!text.trim() && !audioDataUrl && !photoDataUrl) return
    // Spread initialEntry to preserve id/createdAt when editing; ignored for new entries
    onSave({ ...initialEntry, date, text, audioDataUrl, photoDataUrl })
    onClose()
  }

  const canSave = text.trim() || audioDataUrl || photoDataUrl

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div
        className="flex-1 bg-espresso/40"
        onClick={onClose}
        style={{ backdropFilter: 'blur(2px)' }}
      />
      <div
        className="bg-parchment-light rounded-t-2xl shadow-2xl p-5 space-y-4"
        style={{ maxHeight: '88dvh', overflowY: 'auto' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-espresso italic font-normal">{isEditing ? 'Edit Entry' : 'New Entry'}</h2>
          <button onClick={onClose} className="p-1.5 text-espresso-light hover:text-espresso rounded-lg">
            <X size={17} />
          </button>
        </div>

        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="text-xs font-ui text-espresso-light bg-transparent border-none outline-none cursor-pointer"
        />

        <textarea
          autoFocus
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="What's on your mind today…"
          rows={6}
          className="w-full bg-transparent font-body text-[15px] text-espresso leading-relaxed placeholder:text-espresso-light/40 outline-none resize-none border-b border-warm-border pb-3"
        />

        <AudioRecorder value={audioDataUrl} onChange={handleAudioChange} />

        {photoDataUrl ? (
          <div className="relative">
            <img src={photoDataUrl} alt="Preview" className="w-full max-h-44 object-cover rounded-xl" />
            <button
              onClick={() => setPhotoDataUrl(null)}
              className="absolute top-2 right-2 bg-parchment-light/90 rounded-full p-1.5 text-espresso hover:text-red-500 shadow-sm"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current.click()}
            className="flex items-center gap-2 text-sm text-espresso-light hover:text-amber font-ui transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-parchment-dark flex items-center justify-center">
              <Image size={14} />
            </div>
            <span>Add photo</span>
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />

        <div className="flex gap-3 pt-2 pb-safe">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button onClick={handleSave} disabled={!canSave} className="btn-primary flex-1">
            {isEditing ? 'Save Changes' : 'Save Entry'}
          </button>
        </div>
      </div>
    </div>
  )
}

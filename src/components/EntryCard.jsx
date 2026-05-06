import { useState } from 'react'
import { Mic, Image, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { formatTime, formatDate } from '../utils/dateUtils'

export default function EntryCard({ entry, onDelete, showDate = false }) {
  const [expanded, setExpanded] = useState(false)
  const [showPhoto, setShowPhoto] = useState(false)
  const isLong = entry.text.length > 220

  return (
    <div className="entry-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {showDate && (
            <p className="text-xs font-ui text-espresso-light mb-1 tracking-wide uppercase">
              {formatDate(entry.date)}
            </p>
          )}
          <p className="text-[11px] font-ui text-espresso-light/70 mb-2 tabular-nums">
            {formatTime(entry.createdAt)}
          </p>
          {entry.text && (
            <p className="font-body text-espresso leading-relaxed text-[15px] whitespace-pre-wrap break-words">
              {isLong && !expanded ? entry.text.slice(0, 220) + '…' : entry.text}
            </p>
          )}
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-amber mt-1.5 font-ui"
            >
              {expanded ? <><ChevronUp size={11} /> Less</> : <><ChevronDown size={11} /> Read more</>}
            </button>
          )}

          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {entry.audioDataUrl && (
              <div className="flex items-center gap-1.5">
                <Mic size={11} className="text-sage shrink-0" />
                <audio src={entry.audioDataUrl} controls style={{ height: '28px', maxWidth: '160px' }} />
              </div>
            )}
            {entry.photoDataUrl && (
              <button
                onClick={() => setShowPhoto(!showPhoto)}
                className="flex items-center gap-1 text-xs text-espresso-light hover:text-amber font-ui transition-colors"
              >
                <Image size={11} />
                {showPhoto ? 'Hide photo' : 'View photo'}
              </button>
            )}
          </div>

          {entry.photoDataUrl && showPhoto && (
            <div className="mt-3 rounded-lg overflow-hidden">
              <img
                src={entry.photoDataUrl}
                alt="Entry photo"
                className="w-full max-h-64 object-cover rounded-lg"
              />
            </div>
          )}
        </div>

        {onDelete && (
          <button
            onClick={() => onDelete(entry.id)}
            className="p-1 text-espresso-light/40 hover:text-red-400 transition-colors shrink-0 mt-0.5"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  )
}

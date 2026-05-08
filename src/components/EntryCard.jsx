import { useState } from 'react'
import { Mic, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { formatTime, formatDate } from '../utils/dateUtils'

export default function EntryCard({ entry, onDelete, onEdit, showDate = false }) {
  const [expanded, setExpanded] = useState(false)
  const [photoExpanded, setPhotoExpanded] = useState(false)
  const isLong = (entry.text?.length ?? 0) > 220

  return (
    <div
      className={`entry-card p-4 ${onEdit ? 'cursor-pointer' : ''}`}
      onClick={onEdit ? () => onEdit(entry) : undefined}
    >
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
              onClick={e => { e.stopPropagation(); setExpanded(!expanded) }}
              className="flex items-center gap-1 text-xs text-amber mt-1.5 font-ui"
            >
              {expanded ? <><ChevronUp size={11} /> Less</> : <><ChevronDown size={11} /> Read more</>}
            </button>
          )}

          {entry.audioDataUrl && (
            <div
              className="flex items-center gap-1.5 mt-3"
              onClick={e => e.stopPropagation()}
            >
              <Mic size={11} className="text-sage shrink-0" />
              <audio src={entry.audioDataUrl} controls style={{ height: '28px', maxWidth: '160px' }} />
            </div>
          )}

          {entry.photoDataUrl && (
            <div
              className="mt-3 rounded-lg overflow-hidden cursor-pointer"
              onClick={e => { e.stopPropagation(); setPhotoExpanded(p => !p) }}
            >
              <img
                src={entry.photoDataUrl}
                alt="Entry photo"
                className={`w-full object-cover rounded-lg transition-all duration-200 ${
                  photoExpanded ? 'max-h-64' : 'h-20'
                }`}
              />
            </div>
          )}
        </div>

        {onDelete && (
          <button
            onClick={e => { e.stopPropagation(); onDelete(entry.id) }}
            className="p-1 text-espresso-light/40 hover:text-red-400 transition-colors shrink-0 mt-0.5"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  )
}

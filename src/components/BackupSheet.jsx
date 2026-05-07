import { useState, useRef } from 'react'
import { X, Download, Upload } from 'lucide-react'
import { exportAll, importEntries } from '../utils/db'

export default function BackupSheet({ onClose, onImport }) {
  const [status, setStatus] = useState(null)
  const fileRef = useRef()

  const handleExport = async () => {
    const entries = await exportAll()
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `echo-diary-backup-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.json`
    a.click()
    URL.revokeObjectURL(url)
    setStatus('导出成功')
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const data = JSON.parse(await file.text())
      if (!Array.isArray(data)) throw new Error('invalid')
      const count = await importEntries(data)
      onImport()
      setStatus(`已导入 ${count} 条新记录`)
    } catch {
      setStatus('文件格式有误，请选择有效的备份文件')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div
        className="flex-1 bg-espresso/40"
        onClick={onClose}
        style={{ backdropFilter: 'blur(2px)' }}
      />
      <div className="bg-parchment-light rounded-t-2xl shadow-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-espresso italic font-normal">备份与恢复</h2>
          <button onClick={onClose} className="p-1.5 text-espresso-light hover:text-espresso rounded-lg">
            <X size={17} />
          </button>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-3 w-full p-3 rounded-xl bg-parchment-dark hover:bg-parchment transition-colors text-left"
        >
          <div className="w-9 h-9 rounded-full bg-amber/10 flex items-center justify-center shrink-0">
            <Download size={15} className="text-amber" />
          </div>
          <div>
            <p className="font-ui text-sm text-espresso font-medium">导出 JSON</p>
            <p className="font-ui text-xs text-espresso-light mt-0.5">下载所有日记为备份文件</p>
          </div>
        </button>

        <button
          onClick={() => fileRef.current.click()}
          className="flex items-center gap-3 w-full p-3 rounded-xl bg-parchment-dark hover:bg-parchment transition-colors text-left"
        >
          <div className="w-9 h-9 rounded-full bg-sage/10 flex items-center justify-center shrink-0">
            <Upload size={15} className="text-sage" />
          </div>
          <div>
            <p className="font-ui text-sm text-espresso font-medium">导入 JSON</p>
            <p className="font-ui text-xs text-espresso-light mt-0.5">从备份文件恢复，不覆盖已有记录</p>
          </div>
        </button>

        <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />

        {status && (
          <p className="text-xs font-ui text-center text-espresso-light py-1">{status}</p>
        )}

        <div className="pb-safe" />
      </div>
    </div>
  )
}

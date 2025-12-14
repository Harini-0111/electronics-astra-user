import React, { useEffect, useState, useRef } from 'react'
import api from '../api/axiosInstance'

export default function UILibrary() {
  const [filesAll, setFilesAll] = useState([])
  const [filesMine, setFilesMine] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [uploading, setUploading] = useState(false)
  const [queued, setQueued] = useState(0)
  const inputRef = useRef(null)

  useEffect(() => {
    refreshLists()
  }, [])

  async function refreshLists() {
    setLoading(true)
    setMsg('')
    try {
      const [allRes, mineRes] = await Promise.all([
        api.get('/library'),
        api.get('/library/my-uploads'),
      ])
      setFilesAll(allRes.data?.data || [])
      setFilesMine(mineRes.data?.data || [])
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to load library')
    } finally {
      setLoading(false)
    }
  }

  function onPickFile() {
    inputRef.current?.click()
  }

  async function onFileSelected(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setQueued(1)
    await uploadFile(file)
    setQueued(0)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function uploadFile(file) {
    try {
      setUploading(true)
      setMsg('')
      const fd = new FormData()
      fd.append('file', file)
      await api.post('/library/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setMsg('Upload successful')
      await refreshLists()
    } catch (err) {
      setMsg(err.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleDownload(fileId, name) {
    try {
      const res = await api.get(`/library/${fileId}/download`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = name
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setMsg(err.response?.data?.message || 'Download failed')
    }
  }

  function handlePreview(fileUrl) {
    try {
      const url = `${api.defaults.baseURL}${fileUrl}?preview=1`
      window.open(url, '_blank', 'noopener')
    } catch {
      setMsg('Preview failed')
    }
  }

  async function handleDelete(fileId) {
    try {
      await api.delete(`/library/${fileId}`)
      setMsg('Deleted')
      await refreshLists()
    } catch (err) {
      setMsg(err.response?.data?.message || 'Delete failed')
    }
  }

  async function handleShare(fileId) {
    const target = prompt('Enter friend userid (e.g. 12345)')
    if (!target) return
    try {
      await api.post('/library/share', { fileId, targetUserId: String(target).trim() })
      setMsg('Shared successfully')
    } catch (err) {
      setMsg(err.response?.data?.message || 'Share failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-[var(--muted)]">Upload center</p>
            <h2 className="text-2xl font-semibold">Notes, lab records, assignments, PYQs</h2>
          </div>
          <button className="button-primary" onClick={onPickFile} disabled={uploading}>+ Upload PDF/JPG</button>
          <input ref={inputRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={onFileSelected} />
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-2xl border border-[var(--stroke)] bg-[var(--surface)] p-4">
            <div className="rounded-xl border border-dashed border-[var(--stroke)] bg-[var(--surface-strong)] p-6 text-center">
              <p className="text-sm text-[var(--muted)]">Drag & drop files</p>
              <p className="text-lg font-semibold">PDF, JPG, PNG · up to 10MB</p>
              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-[var(--muted)]">
                <span className="rounded-full bg-[var(--surface)] px-3 py-1">{uploading ? 'Uploading…' : 'Idle'}</span>
                <span className="rounded-full bg-[var(--surface)] px-3 py-1">Queued: {queued}</span>
              </div>
              <div className="mt-3">
                <button className="button-ghost" onClick={onPickFile} disabled={uploading}>Select file</button>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--stroke)] bg-[var(--surface)] p-4">
            <p className="text-sm text-[var(--muted)]">Validation</p>
            <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
              <li>• PDF/JPG/PNG only</li>
              <li>• Max 10MB</li>
              <li>• Share with userid; revoke anytime</li>
            </ul>
            {msg && <div className="mt-3 rounded-xl border border-[var(--stroke)] bg-[var(--surface)] p-3 text-sm">{msg}</div>}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-2xl p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--muted)]">My uploads</p>
            <span className="text-xs text-[var(--muted)]">Auto-sorted recent → old</span>
          </div>
          <div className="mt-3 space-y-3">
            {filesMine.map((f) => (
              <div key={f.fileId} className="flex items-center justify-between rounded-xl border border-[var(--stroke)] bg-[var(--surface)] px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">{f.originalName}</p>
                  <p className="text-xs text-[var(--muted)]">You · {new Date(f.uploadedAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                  {f.fileUrl && (
                    <button className="rounded-lg bg-[var(--surface-strong)] px-3 py-1" onClick={() => handlePreview(f.fileUrl)}>Preview</button>
                  )}
                  <button className="rounded-lg bg-[var(--surface-strong)] px-3 py-1" onClick={() => handleDownload(f.fileId, f.originalName)}>Download</button>
                  <button className="rounded-lg bg-[var(--surface-strong)] px-3 py-1" onClick={() => handleShare(f.fileId)}>Share</button>
                  <button className="rounded-lg bg-[var(--surface-strong)] px-3 py-1 text-danger" onClick={() => handleDelete(f.fileId)}>Delete</button>
                </div>
              </div>
            ))}
            {filesMine.length === 0 && <div className="rounded-xl border border-[var(--stroke)] bg-[var(--surface)] p-3 text-sm">No uploads yet.</div>}
          </div>
        </div>

        <div className="glass rounded-2xl p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--muted)]">Shared library</p>
            <span className="text-xs text-[var(--muted)]">Everyone can browse</span>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {filesAll.map((f) => (
              <div key={f.fileId} className="rounded-xl border border-[var(--stroke)] bg-[var(--surface)] p-3">
                <p className="text-sm font-semibold">{f.originalName}</p>
                <p className="text-xs text-[var(--muted)]">{f.owner_name} · {new Date(f.uploadedAt).toLocaleDateString()}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
                  <span className="rounded-full bg-[var(--surface-strong)] px-3 py-1">{f.fileType}</span>
                  {f.fileUrl && <span className="rounded-full bg-[var(--surface-strong)] px-3 py-1 cursor-pointer" onClick={() => handlePreview(f.fileUrl)}>Preview</span>}
                  <span className="rounded-full bg-[var(--surface-strong)] px-3 py-1 cursor-pointer" onClick={() => handleDownload(f.fileId, f.originalName)}>Download</span>
                </div>
              </div>
            ))}
            {filesAll.length === 0 && <div className="rounded-xl border border-[var(--stroke)] bg-[var(--surface)] p-3 text-sm">No files in library.</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import api from '../api/axiosInstance'
import { Link } from 'react-router-dom'

export default function Library() {
  const [files, setFiles] = useState([])
  const [filteredFiles, setFilteredFiles] = useState([])
  const [filter, setFilter] = useState('all') // 'all', 'my-uploads', 'shared'
  const [searchQuery, setSearchQuery] = useState('')
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploadFile, setUploadFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  
  // Share popup state
  const [sharePopup, setSharePopup] = useState({ show: false, fileId: null, fileName: '' })
  const [shareUserId, setShareUserId] = useState('')
  const [shareLoading, setShareLoading] = useState(false)

  useEffect(() => {
    loadFiles()
  }, [filter])

  useEffect(() => {
    // Filter files based on search query
    if (searchQuery.trim() === '') {
      setFilteredFiles(files)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredFiles(
        files.filter(
          (f) =>
            f.original_name.toLowerCase().includes(query) ||
            f.owner_name.toLowerCase().includes(query) ||
            f.file_type.toLowerCase().includes(query)
        )
      )
    }
  }, [searchQuery, files])

  const loadFiles = async () => {
    setLoading(true)
    setMessage(null)
    try {
      let endpoint = '/library'
      if (filter === 'my-uploads') endpoint = '/library/my-uploads'
      if (filter === 'shared') endpoint = '/library/shared-with-me'

      const res = await api.get(endpoint)
      setFiles(res.data.data || [])
      setFilteredFiles(res.data.data || [])
    } catch (err) {
      setMessage(err.response?.data?.message || err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!uploadFile) {
      setMessage('Please select a file to upload')
      return
    }

    setUploading(true)
    setMessage(null)

    const formData = new FormData()
    formData.append('file', uploadFile)

    try {
      await api.post('/library/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      })
      setMessage('File uploaded successfully!')
      setUploadFile(null)
      // Reset file input
      document.getElementById('file-input').value = ''
      // Reload files
      loadFiles()
    } catch (err) {
      setMessage(err.response?.data?.message || err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (fileId, fileName) => {
    try {
      const res = await api.get(`/library/${fileId}/download`, {
        responseType: 'blob',
        withCredentials: true,
      })
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setMessage(err.response?.data?.message || err.message || 'Download failed')
    }
  }

  const openSharePopup = (fileId, fileName) => {
    setSharePopup({ show: true, fileId, fileName })
    setShareUserId('')
  }

  const closeSharePopup = () => {
    setSharePopup({ show: false, fileId: null, fileName: '' })
    setShareUserId('')
  }

  const handleShare = async () => {
    if (!shareUserId.trim()) {
      alert('Please enter a friend userid')
      return
    }

    setShareLoading(true)
    try {
      await api.post('/library/share', {
        fileId: sharePopup.fileId,
        targetUserId: shareUserId.trim(),
      })
      alert('File shared successfully!')
      closeSharePopup()
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to share file')
    } finally {
      setShareLoading(false)
    }
  }

  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) return '📄'
    if (fileType.includes('word') || fileType.includes('document')) return '📝'
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊'
    if (fileType.includes('image')) return '🖼️'
    if (fileType.includes('video')) return '🎥'
    if (fileType.includes('zip')) return '🗜️'
    return '📁'
  }

  return (
    <div className="library-container">
      <h1>Library</h1>

      {message && <div className="message">{message}</div>}

      {/* Upload Section */}
      <section className="card upload-section">
        <h3>Upload File</h3>
        <form onSubmit={handleUpload} className="upload-form">
          <input
            id="file-input"
            type="file"
            onChange={(e) => setUploadFile(e.target.files[0])}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.mp4,.avi,.mov,.txt,.zip"
          />
          <button type="submit" disabled={uploading || !uploadFile}>
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </form>
        {uploadFile && (
          <div className="file-preview">
            Selected: <strong>{uploadFile.name}</strong> ({(uploadFile.size / 1024).toFixed(2)} KB)
          </div>
        )}
      </section>

      {/* Filter and Search */}
      <section className="card filter-section">
        <div className="filter-controls">
          <div className="filter-buttons">
            <button
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              All Files
            </button>
            <button
              className={filter === 'my-uploads' ? 'active' : ''}
              onClick={() => setFilter('my-uploads')}
            >
              My Uploads
            </button>
            <button
              className={filter === 'shared' ? 'active' : ''}
              onClick={() => setFilter('shared')}
            >
              Shared With Me
            </button>
          </div>
          <div className="search-box">
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Files List */}
      <section className="card files-section">
        <h3>
          {filter === 'all' && 'All Files'}
          {filter === 'my-uploads' && 'My Uploads'}
          {filter === 'shared' && 'Shared With Me'}
        </h3>

        {loading ? (
          <div>Loading files...</div>
        ) : filteredFiles.length === 0 ? (
          <div className="empty-state">No files found.</div>
        ) : (
          <div className="files-grid">
            {filteredFiles.map((file) => (
              <div key={file.id} className="file-card">
                <div className="file-icon">{getFileIcon(file.file_type)}</div>
                <div className="file-info">
                  <div className="file-name" title={file.original_name}>
                    {file.original_name}
                  </div>
                  <div className="file-meta">
                    <span className="file-owner">
                      By: {file.owner_name} ({file.owner_userid})
                    </span>
                    <span className="file-date">
                      {new Date(file.uploaded_at).toLocaleDateString()}
                    </span>
                  </div>
                  {filter === 'shared' && file.shared_by_name && (
                    <div className="shared-info">
                      Shared by: {file.shared_by_name}
                    </div>
                  )}
                </div>
                <div className="file-actions">
                  <button
                    className="btn-download"
                    onClick={() => handleDownload(file.id, file.original_name)}
                    title="Download"
                  >
                    ⬇ Download
                  </button>
                  <button
                    className="btn-share"
                    onClick={() => openSharePopup(file.id, file.original_name)}
                    title="Share with friend"
                  >
                    📤 Share
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Share Popup */}
      {sharePopup.show && (
        <div className="popup-overlay" onClick={closeSharePopup}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <h3>Share File</h3>
            <p>
              Sharing: <strong>{sharePopup.fileName}</strong>
            </p>
            <label>Enter friend's UserID:</label>
            <input
              type="text"
              placeholder="e.g. 12345"
              value={shareUserId}
              onChange={(e) => setShareUserId(e.target.value)}
              autoFocus
            />
            <div className="popup-actions">
              <button onClick={handleShare} disabled={shareLoading}>
                {shareLoading ? 'Sharing...' : 'Share'}
              </button>
              <button onClick={closeSharePopup} className="btn-cancel">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .library-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .message {
          padding: 12px;
          margin-bottom: 16px;
          border-radius: 4px;
          background: #e3f2fd;
          color: #1976d2;
        }

        .upload-section {
          margin-bottom: 20px;
        }

        .upload-form {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .upload-form input[type='file'] {
          flex: 1;
        }

        .upload-form button {
          padding: 8px 20px;
        }

        .file-preview {
          margin-top: 12px;
          padding: 8px;
          background: #f5f5f5;
          border-radius: 4px;
        }

        .filter-section {
          margin-bottom: 20px;
        }

        .filter-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .filter-buttons {
          display: flex;
          gap: 8px;
        }

        .filter-buttons button {
          padding: 8px 16px;
          border: 1px solid #ddd;
          background: white;
          cursor: pointer;
          border-radius: 4px;
        }

        .filter-buttons button.active {
          background: #1976d2;
          color: white;
          border-color: #1976d2;
        }

        .search-box input {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          min-width: 250px;
        }

        .files-section {
          margin-bottom: 20px;
        }

        .empty-state {
          padding: 40px;
          text-align: center;
          color: #666;
        }

        .files-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
          margin-top: 16px;
        }

        .file-card {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 16px;
          background: white;
          transition: box-shadow 0.2s;
        }

        .file-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .file-icon {
          font-size: 48px;
          text-align: center;
          margin-bottom: 12px;
        }

        .file-info {
          margin-bottom: 12px;
        }

        .file-name {
          font-weight: 600;
          margin-bottom: 8px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .file-meta {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #666;
        }

        .shared-info {
          margin-top: 4px;
          font-size: 12px;
          color: #1976d2;
        }

        .file-actions {
          display: flex;
          gap: 8px;
        }

        .file-actions button {
          flex: 1;
          padding: 8px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .btn-download {
          background: #4caf50;
          color: white;
        }

        .btn-share {
          background: #2196f3;
          color: white;
        }

        .popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .popup-content {
          background: white;
          padding: 24px;
          border-radius: 8px;
          max-width: 400px;
          width: 90%;
        }

        .popup-content h3 {
          margin-top: 0;
        }

        .popup-content label {
          display: block;
          margin: 12px 0 4px;
          font-weight: 500;
        }

        .popup-content input {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          box-sizing: border-box;
        }

        .popup-actions {
          margin-top: 16px;
          display: flex;
          gap: 8px;
        }

        .popup-actions button {
          flex: 1;
          padding: 10px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }

        .popup-actions button:first-child {
          background: #2196f3;
          color: white;
        }

        .btn-cancel {
          background: #f5f5f5;
          color: #333;
        }
      `}</style>
    </div>
  )
}

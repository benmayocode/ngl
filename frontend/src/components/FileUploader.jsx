import { useState } from 'react'
import axios from 'axios'

export default function FileUploader({ type = 'global', onUpload }) {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async () => {
    if (!file) return alert("Please select a file")
    
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)

    setUploading(true)
    try {
      await axios.post('/api/upload', formData)
      alert('File uploaded successfully!')
      setFile(null)
      if (onUpload) onUpload()
    } catch (err) {
      alert('Upload failed: ' + err.message)
    }
    setUploading(false)
  }

  return (
    <div className="mb-4">
      <label className="form-label">Upload a Document</label>
      <input
        type="file"
        className="form-control"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button
        className="btn btn-primary mt-2"
        onClick={handleUpload}
        disabled={uploading}
      >
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
    </div>
  )
}

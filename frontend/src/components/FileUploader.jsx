// src/components/FileUploader.jsx
import { useState, useRef } from 'react'
import axios from 'axios'
import { Plus } from 'lucide-react'  // or use any icon library you prefer

export default function FileUploader({ type = 'global' }) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef()

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)

    setUploading(true)
    console.log('Uploading file...')
    try {
      await axios.post('/api/upload', formData)
      alert('File uploaded successfully!')
      if (onUpload) onUpload()
    } catch (err) {
      alert('Upload failed: ' + err.message)
    }
    setUploading(false)
    e.target.value = null  // reset file input

  }

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        className="d-none"
        onChange={handleFileChange}
      />
      <button
        type="button"
        className="btn btn-light"
        onClick={() => {
          console.log("Button clicked")
          fileInputRef.current.click()
        }}
        title="Upload document"
      >
        +
      </button>
    </>
  )
}

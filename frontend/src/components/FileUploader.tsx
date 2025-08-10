// src/components/FileUploader.jsx
import { useState, useRef } from 'react'
import axios from 'axios'

interface FileUploaderProps {
  type?: 'global' | 'private';
  onUpload?: () => void;
}

export default function FileUploader({ type = 'global', onUpload }: FileUploaderProps) {
  const [uploading, setUploading] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
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
    e.target.value = ''  // reset file input

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
          fileInputRef.current?.click()
        }}
        title="Upload document"
      >
        +
      </button>
    </>
  )
}

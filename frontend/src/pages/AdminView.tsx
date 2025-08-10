import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import FileUploader from '../components/FileUploader'
import PreviewPanel from '../components/PreviewPanel'

interface RagDocument {
  id: string;
  name: string;
  summary: string | null;
  uploaded_at: string;
}

export default function AdminView() {
  const [documents, setDocuments] = useState<RagDocument[]>([])
  const [selectedDoc, setSelectedDoc] = useState<RagDocument | null>(null)

  const fetchDocuments = useCallback(() => {
    axios.get('http://localhost:8000/api/documents?doc_type=global')
      .then(res => {
        setDocuments(res.data)
        if (res.data.length > 0) {
          setSelectedDoc(res.data[0]) // auto-load top doc
        }
      })
      .catch(err => console.error("Failed to load documents", err))
  }, [])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const handleDelete = async (docId) => {
    if (!confirm('Are you sure you want to delete this document?')) return
    try {
      await axios.delete(`http://localhost:8000/api/documents/${docId}`)
      fetchDocuments()  // refresh list
    } catch (err) {
      console.error('Delete failed:', err)
      alert('Failed to delete document.')
    }
  }

  const handleDownload = async (docId) => {
    try {
      const res = await axios.get(`http://localhost:8000/api/documents/${docId}/download`, {
        responseType: 'blob',
      })

      const blob = new Blob([res.data], { type: 'application/pdf' }) // or octet-stream for generic
      const url = window.URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = `document-${docId}.pdf` // or use actual name if known
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // optional: revoke URL after a delay
      setTimeout(() => window.URL.revokeObjectURL(url), 1000)
    } catch (err) {
      console.error('Download failed:', err)
      alert('Failed to download document.')
    }
  }


  return (
    <div className="container mt-4">
      <h2 className="mb-4">Admin: Upload Reference Documents</h2>
      {/* {JSON.stringify(selectedDoc)} */}

      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Upload Files</h5>
          <p className="card-text">Select PDF or DOCX documents to upload for GPT to reference.</p>

          <FileUploader type="global" onUpload={fetchDocuments} />
        </div>
      </div>
      
      <PreviewPanel doc={selectedDoc} />


      <div className="mt-4">
        <h5>Uploaded Documents</h5>
        {documents.length === 0 ? (
          <p>No documents uploaded yet.</p>
        ) : (
          <ul className="list-group">
            {documents.map(doc => (
              <li key={doc.id} className="list-group-item d-flex justify-content-between align-items-start">
                <div>
                  <strong>{doc.name}</strong><br />
                  <small>Uploaded: {new Date(doc.uploaded_at).toLocaleString()}</small><br />
                  <small>Summary: {doc.summary?.slice(0, 100)}...</small>
                </div>
                <div className="btn-group btn-group-sm ms-2">
                  <button className="btn btn-outline-primary" onClick={() => handleDownload(doc.id)}>
                    Download
                  </button>
                  <button className="btn btn-outline-secondary" onClick={() => setSelectedDoc(doc)}>
                    Preview
                  </button>
                  <button className="btn btn-outline-danger" onClick={() => handleDelete(doc.id)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}


          </ul>
        )}
      </div>
    </div>
  )
}

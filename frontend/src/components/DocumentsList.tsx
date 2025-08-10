// frontend/src/components/DocumentsList.tsx
import { useEffect, useState } from 'react'
import axios from 'axios'

interface DocumentsListProps {
  type?: 'global' | 'private'
}

interface Document {
  id: string;
  name: string;
  uploaded_at: string;
  summary?: string;
}

export default function DocumentList({ type = 'global' }: DocumentsListProps) {
  const [documents, setDocuments] = useState<Document[]>([])

  useEffect(() => {
    axios.get(`http://localhost:8000/api/documents?doc_type=${type}`)
      .then(res => setDocuments(res.data))
      .catch(err => console.error("Failed to load documents", err))
  }, [type])

  return (
    <div className="mt-4">
      <h5>Uploaded Documents</h5>
      {documents.length === 0 ? (
        <p>No documents uploaded yet.</p>
      ) : (
        <ul className="list-group">
          {documents.map(doc => (
            <li key={doc.id} className="list-group-item d-flex justify-content-between align-items-center">
              <div>
                <strong>{doc.name}</strong><br />
                <small>Uploaded: {new Date(doc.uploaded_at).toLocaleString()}</small><br />
                <small>Summary: {doc.summary?.slice(0, 100)}...</small>
              </div>
              {/* Add delete/download buttons here later */}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

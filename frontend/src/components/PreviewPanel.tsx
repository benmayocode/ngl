import { useEffect, useState } from 'react'
import axios from 'axios'
import { pdfjs, Document, Page } from 'react-pdf'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker

export default function PreviewPanel({ doc }) {
  const [fileBlob, setFileBlob] = useState<File | null>(null)
  const [fileType, setFileType] = useState<string | null>(null)
  const [numPages, setNumPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(1)

  const docId = doc?.id
  const fileName = doc?.path

  useEffect(() => {
    if (!docId) return

    const fetchFile = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/api/documents/${docId}/download`, {
          responseType: 'blob',
        })
        setFileBlob(res.data)
        setFileType(res.data.type)
        setCurrentPage(1)
      } catch (err) {
        console.error('Failed to load document preview:', err)
      }
    }

    fetchFile()
  }, [docId])

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages)
  }

  const goToPrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1))
  }

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, numPages))
  }

  if (!docId || !fileName) return <p>Select a document to preview.</p>
  if (!fileBlob) return <p>Loading preview...</p>

  const fileURL = URL.createObjectURL(fileBlob)

  if (fileType === 'application/pdf') {
    return (
      <div className="mb-4">
        <div style={{ textAlign: 'center' }}>
          <Document file={fileBlob} onLoadSuccess={onDocumentLoadSuccess}>
            <Page
              pageNumber={currentPage}
              width={600}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>

          <div className="mt-3">
            <button
              onClick={goToPrevPage}
              disabled={currentPage <= 1}
              className="btn btn-sm btn-outline-secondary me-2"
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {numPages}
            </span>
            <button
              onClick={goToNextPage}
              disabled={currentPage >= numPages}
              className="btn btn-sm btn-outline-secondary ms-2"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (fileType === 'text/plain') {
    return (
      <iframe src={fileURL} width="100%" height="600px" title="Text preview" />
    )
  }

  if (fileName.endsWith('.docx')) {
    return (
      <iframe
        src={`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(fileURL)}`}
        width="100%" height="600px"
        title="DOCX preview"
      />
    )
  }

  return <p>No preview available for this file type.</p>
}

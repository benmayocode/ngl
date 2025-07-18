import FileUploader from '../components/FileUploader'

export default function AdminView() {
  return (
    <div className="container mt-4">
      <h2 className="mb-4">Admin: Upload Reference Documents</h2>

      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Upload Files</h5>
          <p className="card-text">Select PDF or DOCX documents to upload for GPT to reference.</p>

        <FileUploader type="global" />
        </div>
      </div>
    </div>
  )
}

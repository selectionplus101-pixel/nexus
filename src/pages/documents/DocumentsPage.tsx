import React, { useState, useEffect, useRef } from 'react';
import { FileText, Upload, Download, Trash2, Share2, Search, Eye, X, FileSignature } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { PDFViewer } from '../../components/document/PDFViewer';
import { SignatureUploadModal } from '../../components/document/SignatureUploadModal';
import { documentsApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

interface Document {
  _id: string;
  filename: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  shared: boolean;
  status: string;
  uploadDate: string;
  uploader: {
    name: string;
    email: string;
  };
  isSigned?: boolean;
  signature?: {
    signedBy?: {
      name: string;
      email: string;
    };
    signedAt?: string;
  };
}

export const DocumentsPage: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // PDF Viewer state
  const [isPDFViewerOpen, setIsPDFViewerOpen] = useState(false);
  const [selectedPDF, setSelectedPDF] = useState<{ url: string; name: string } | null>(null);

  // Signature upload state
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [selectedDocForSigning, setSelectedDocForSigning] = useState<Document | null>(null);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const data = await documentsApi.getAll({ status: 'active' });
      setDocuments(data);
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Simulate progress (since we can't get real progress from axios easily)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const uploadedDoc = await documentsApi.upload(file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      toast.success('Document uploaded successfully!');
      fetchDocuments();

      // Reset
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000);
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast.error(error.response?.data?.message || 'Failed to upload document');
      setIsUploading(false);
      setUploadProgress(0);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      toast.loading('Downloading...');
      await documentsApi.download(doc._id, doc.originalName);
      toast.dismiss();
      toast.success(`Downloaded ${doc.originalName}`);
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to download document');
    }
  };

  const handleView = async (doc: Document) => {
    // Only PDFs can be previewed
    if (!doc.fileType.includes('pdf')) {
      toast.info('Preview is only available for PDF files. Downloading instead...');
      handleDownload(doc);
      return;
    }

    try {
      // For viewing, we'll use the download endpoint but display in viewer
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('business_nexus_token');
      const fileUrl = `${API_URL}/documents/${doc._id}/download?token=${token}`;

      setSelectedPDF({ url: fileUrl, name: doc.originalName });
      setIsPDFViewerOpen(true);
    } catch (error) {
      toast.error('Failed to open document');
    }
  };

  const handleShare = async (doc: Document) => {
    try {
      const updatedDoc = await documentsApi.update(doc._id, { shared: !doc.shared });
      setDocuments((prev) =>
        prev.map((d) => (d._id === doc._id ? updatedDoc : d))
      );
      toast.success(updatedDoc.shared ? 'Document shared' : 'Document unshared');
    } catch (error) {
      toast.error('Failed to update sharing status');
    }
  };

  const handleDelete = async (doc: Document) => {
    if (!window.confirm(`Delete ${doc.originalName}?`)) {
      return;
    }

    try {
      await documentsApi.delete(doc._id);
      setDocuments((prev) => prev.filter((d) => d._id !== doc._id));
      toast.success('Document deleted');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete document');
    }
  };

  const handleSignDocument = (doc: Document) => {
    setSelectedDocForSigning(doc);
    setIsSignatureModalOpen(true);
  };

  const handleSignatureUpload = async (signatureFile: File) => {
    if (!selectedDocForSigning) return;

    try {
      setIsUploadingSignature(true);
      const updatedDoc = await documentsApi.sign(selectedDocForSigning._id, signatureFile);

      // Update document in state
      setDocuments((prev) =>
        prev.map((d) => (d._id === selectedDocForSigning._id ? updatedDoc : d))
      );

      toast.success('Document signed successfully!');
      setIsSignatureModalOpen(false);
      setSelectedDocForSigning(null);
    } catch (error: any) {
      console.error('Error signing document:', error);
      toast.error(error.response?.data?.message || 'Failed to sign document');
    } finally {
      setIsUploadingSignature(false);
    }
  };

  const filteredDocuments = documents
    .filter((doc) =>
      doc.originalName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((doc) => {
      if (selectedType === 'all') return true;
      if (selectedType === 'PDF') return doc.fileType.includes('pdf');
      if (selectedType === 'Spreadsheet')
        return doc.fileType.includes('sheet') || doc.fileType.includes('excel');
      if (selectedType === 'Document')
        return doc.fileType.includes('word') || doc.fileType.includes('document');
      if (selectedType === 'Presentation')
        return doc.fileType.includes('presentation') || doc.fileType.includes('powerpoint');
      return true;
    });

  const totalSize = documents.reduce((acc, doc) => acc + doc.fileSize, 0);
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const documentTypes = ['all', 'PDF', 'Spreadsheet', 'Document', 'Presentation'];

  if (!user) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600">Manage your startup's important files</p>
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
          />
          <Button
            leftIcon={<Upload size={18} />}
            onClick={handleUploadClick}
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload Document'}
          </Button>
        </div>
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <Card className="bg-primary-50 border-primary-200">
          <CardBody>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Uploading...</span>
              <span className="text-sm text-gray-600">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Storage info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">Storage</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Used</span>
                <span className="font-medium text-gray-900">{formatFileSize(totalSize)}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div
                  className="h-2 bg-primary-600 rounded-full"
                  style={{ width: `${Math.min((totalSize / (100 * 1024 * 1024)) * 100, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Limit</span>
                <span className="font-medium text-gray-900">100 MB</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-2">File Types</h3>
              <div className="space-y-2">
                {documentTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                      selectedType === type
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {type === 'all' ? 'All Files' : type}
                    {type !== 'all' && (
                      <span className="ml-2 text-gray-500">
                        ({documents.filter((d) => {
                          if (type === 'PDF') return d.fileType.includes('pdf');
                          if (type === 'Spreadsheet') return d.fileType.includes('sheet');
                          if (type === 'Document') return d.fileType.includes('word');
                          if (type === 'Presentation') return d.fileType.includes('presentation');
                          return true;
                        }).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Quick Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Files</span>
                  <span className="font-medium text-gray-900">{documents.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shared</span>
                  <span className="font-medium text-gray-900">
                    {documents.filter((d) => d.shared).length}
                  </span>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Document list */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">
                All Documents ({filteredDocuments.length})
              </h2>
            </CardHeader>
            <CardBody>
              {/* Search */}
              <div className="mb-4">
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  startAdornment={<Search size={18} />}
                  fullWidth
                />
              </div>

              {/* Documents */}
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent mb-4"></div>
                  <p className="text-gray-600">Loading documents...</p>
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gray-100 p-6 rounded-full inline-block mb-4">
                    <FileText size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">No documents found</h3>
                  <p className="text-gray-600 mt-2">
                    {searchQuery || selectedType !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'Upload your first document to get started'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredDocuments.map((doc) => (
                    <div
                      key={doc._id}
                      className="flex items-center p-4 hover:bg-gray-50 rounded-lg transition-colors duration-200 border border-transparent hover:border-gray-200"
                    >
                      <div className="p-2 bg-primary-50 rounded-lg mr-4">
                        <FileText size={24} className="text-primary-600" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {doc.originalName}
                          </h3>
                          {doc.shared && <Badge variant="secondary" size="sm">Shared</Badge>}
                          {doc.isSigned && (
                            <Badge variant="success" size="sm" className="flex items-center gap-1">
                              <FileSignature size={12} />
                              Signed
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span>{formatFileSize(doc.fileSize)}</span>
                          <span>
                            {new Date(doc.uploadDate).toLocaleDateString()}
                          </span>
                          {doc.isSigned && doc.signature?.signedBy && (
                            <span className="text-xs text-green-600">
                              Signed by {doc.signature.signedBy.name}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2"
                          aria-label="View"
                          onClick={() => handleView(doc)}
                        >
                          <Eye size={18} />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2"
                          aria-label="Download"
                          onClick={() => handleDownload(doc)}
                        >
                          <Download size={18} />
                        </Button>

                        {!doc.isSigned && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-2 text-primary-600 hover:text-primary-700"
                            aria-label="Sign Document"
                            onClick={() => handleSignDocument(doc)}
                          >
                            <FileSignature size={18} />
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2"
                          aria-label="Share"
                          onClick={() => handleShare(doc)}
                        >
                          <Share2
                            size={18}
                            className={doc.shared ? 'text-primary-600' : ''}
                          />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2 text-error-600 hover:text-error-700"
                          aria-label="Delete"
                          onClick={() => handleDelete(doc)}
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* PDF Viewer Modal */}
      {selectedPDF && (
        <PDFViewer
          isOpen={isPDFViewerOpen}
          onClose={() => {
            setIsPDFViewerOpen(false);
            setSelectedPDF(null);
          }}
          fileUrl={selectedPDF.url}
          fileName={selectedPDF.name}
          onDownload={() => {
            const doc = documents.find((d) => d.originalName === selectedPDF.name);
            if (doc) handleDownload(doc);
          }}
        />
      )}

      {/* Signature Upload Modal */}
      {selectedDocForSigning && (
        <SignatureUploadModal
          isOpen={isSignatureModalOpen}
          onClose={() => {
            setIsSignatureModalOpen(false);
            setSelectedDocForSigning(null);
          }}
          onUpload={handleSignatureUpload}
          documentName={selectedDocForSigning.originalName}
          isUploading={isUploadingSignature}
        />
      )}
    </div>
  );
};

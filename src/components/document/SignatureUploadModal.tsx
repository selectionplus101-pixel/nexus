import React, { useState, useRef } from 'react';
import { X, Upload, CheckCircle, FileSignature } from 'lucide-react';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';

interface SignatureUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
  documentName: string;
  isUploading: boolean;
}

export const SignatureUploadModal: React.FC<SignatureUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  documentName,
  isUploading,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type (only images)
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, etc.)');
      return;
    }

    // Validate file size (max 2MB for signatures)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Signature image must be less than 2MB');
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a signature image');
      return;
    }

    try {
      await onUpload(selectedFile);
      handleClose();
    } catch (error) {
      console.error('Error uploading signature:', error);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal panel */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileSignature className="text-primary-600" size={24} />
              <h2 className="text-xl font-semibold text-gray-900">Upload Signature</h2>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isUploading}
            >
              <X size={24} />
            </button>
          </div>

          {/* Document name */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Signing document:</p>
            <p className="text-sm font-medium text-gray-900 truncate">{documentName}</p>
          </div>

          {/* Upload area */}
          <div className="mb-4">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
            />

            {!previewUrl ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-primary-500 hover:bg-primary-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 bg-primary-100 rounded-full">
                    <Upload className="text-primary-600" size={24} />
                  </div>
                  <p className="text-sm font-medium text-gray-700">
                    Click to upload signature image
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG up to 2MB</p>
                </div>
              </button>
            ) : (
              <div className="space-y-4">
                {/* Preview */}
                <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                  <p className="text-xs text-gray-600 mb-2">Preview:</p>
                  <div className="flex justify-center items-center bg-white p-4 rounded">
                    <img
                      src={previewUrl}
                      alt="Signature preview"
                      className="max-h-32 max-w-full object-contain"
                    />
                  </div>
                </div>

                {/* File info */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 truncate flex-1">
                    {selectedFile?.name}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    disabled={isUploading}
                    className="ml-2 text-red-600 hover:text-red-700 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Info message */}
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> By uploading your signature, you acknowledge that this
              document will be marked as signed and this action cannot be undone.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              leftIcon={isUploading ? undefined : <CheckCircle size={18} />}
              className="flex-1"
            >
              {isUploading ? 'Uploading...' : 'Sign Document'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

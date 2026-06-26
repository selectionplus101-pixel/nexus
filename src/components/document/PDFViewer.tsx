import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from 'lucide-react';
import { Button } from '../ui/Button';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
  onDownload?: () => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  isOpen,
  onClose,
  fileUrl,
  fileName,
  onDownload,
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    setIsLoading(false);
  };

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(prev + 1, numPages));
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 2.0));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold truncate max-w-md">{fileName}</h2>
            {!isLoading && (
              <span className="text-sm text-gray-400">
                Page {pageNumber} of {numPages}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <Button
              variant="ghost"
              size="sm"
              onClick={zoomOut}
              disabled={scale <= 0.5}
              className="text-white hover:bg-gray-800"
              aria-label="Zoom out"
            >
              <ZoomOut size={20} />
            </Button>
            <span className="text-sm text-gray-400 min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={zoomIn}
              disabled={scale >= 2.0}
              className="text-white hover:bg-gray-800"
              aria-label="Zoom in"
            >
              <ZoomIn size={20} />
            </Button>

            {/* Download Button */}
            {onDownload && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDownload}
                className="text-white hover:bg-gray-800 ml-4"
                aria-label="Download"
              >
                <Download size={20} />
              </Button>
            )}

            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-gray-800 ml-4"
              aria-label="Close"
            >
              <X size={24} />
            </Button>
          </div>
        </div>

        {/* PDF Content */}
        <div className="flex-1 overflow-auto bg-gray-800 flex items-center justify-center p-4">
          {isLoading && (
            <div className="text-white text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent mb-4"></div>
              <p>Loading PDF...</p>
            </div>
          )}

          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={null}
            className="flex justify-center"
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="shadow-2xl"
            />
          </Document>
        </div>

        {/* Footer Navigation */}
        {!isLoading && numPages > 1 && (
          <div className="bg-gray-900 text-white p-4 flex justify-center items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
              className="text-white hover:bg-gray-800"
            >
              <ChevronLeft size={20} />
              <span className="ml-1">Previous</span>
            </Button>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={numPages}
                value={pageNumber}
                onChange={(e) => {
                  const page = parseInt(e.target.value);
                  if (page >= 1 && page <= numPages) {
                    setPageNumber(page);
                  }
                }}
                className="w-16 px-2 py-1 bg-gray-800 text-white text-center rounded border border-gray-700 focus:outline-none focus:border-primary-500"
              />
              <span className="text-gray-400">of {numPages}</span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
              className="text-white hover:bg-gray-800"
            >
              <span className="mr-1">Next</span>
              <ChevronRight size={20} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

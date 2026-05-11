'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  FileText,
  Loader2,
  RotateCw,
  SidebarOpen,
  SidebarClose,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Configure pdfjs worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  fileUrl?: string;
  fileName?: string;
  title?: string;
  pageCount?: number;
  fileSize?: number;
  isPlaceholder?: boolean;
  signatureAreas?: { x: number; y: number; width: number; height: number; label: string }[];
}

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 2];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Placeholder page component for documents without real PDFs
function PlaceholderPage({
  pageNum,
  totalPages,
  title,
  fileName,
  fileSize,
  signatureAreas,
}: {
  pageNum: number;
  totalPages: number;
  title?: string;
  fileName?: string;
  fileSize?: number;
  signatureAreas?: { x: number; y: number; width: number; height: number; label: string }[];
}) {
  return (
    <div className="bg-white dark:bg-gray-900 shadow-lg rounded-md mx-auto" style={{ width: 612, minHeight: 792 }}>
      <div className="p-12 space-y-6">
        {/* Header */}
        {pageNum === 1 && (
          <div className="border-b-2 border-emerald-600 pb-4 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded bg-emerald-600 flex items-center justify-center">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {title || 'Document Preview'}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">{fileName}</p>
              </div>
            </div>
            {fileSize && (
              <p className="text-xs text-gray-400 ml-11">
                {formatFileSize(fileSize)} · {totalPages} page{totalPages !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}

        {/* Simulated text lines */}
        <div className="space-y-3">
          {Array.from({ length: pageNum === 1 ? 12 : 18 }).map((_, i) => (
            <div
              key={i}
              className="h-3 rounded bg-gray-200 dark:bg-gray-700"
              style={{
                width: `${60 + Math.sin(i * 0.7) * 25 + 15}%`,
                opacity: 0.4 + Math.sin(i * 0.5) * 0.3,
              }}
            />
          ))}
        </div>

        {/* Signature area */}
        {signatureAreas && signatureAreas.length > 0 && pageNum === totalPages && (
          <div className="mt-8 space-y-4">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Signature Areas
            </div>
            {signatureAreas.map((area, i) => (
              <div
                key={i}
                className="border-2 border-dashed border-emerald-400 dark:border-emerald-600 rounded-lg p-4 bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-300">
                      S{i + 1}
                    </span>
                  </div>
                  <span className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                    {area.label}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] border-emerald-300 text-emerald-600 dark:border-emerald-600 dark:text-emerald-400"
                >
                  Awaiting Signature
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Page number */}
        <div className="text-center text-xs text-gray-400 dark:text-gray-500 pt-4 border-t border-gray-100 dark:border-gray-800 mt-8">
          Page {pageNum} of {totalPages}
        </div>
      </div>
    </div>
  );
}

export function PDFViewer({
  fileUrl,
  fileName,
  title,
  pageCount = 1,
  fileSize,
  isPlaceholder = true,
  signatureAreas = [],
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [pdfError, setPdfError] = useState(false);
  const [pdfErrorKey, setPdfErrorKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);

  const totalPages = isPlaceholder || pdfError ? pageCount : numPages;

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    setPdfError(false);
  }, []);

  const onDocumentLoadError = useCallback(() => {
    setPdfError(true);
    setIsLoading(false);
  }, []);

  const handlePdfErrorBoundaryReset = useCallback(() => {
    setPdfError(false);
    setPdfErrorKey((prev) => prev + 1);
  }, []);

  const onDocumentLoadStart = useCallback(() => {
    setIsLoading(true);
    setPdfError(false);
  }, []);

  const zoomIn = useCallback(() => {
    setZoomLevel((prev) => {
      const idx = ZOOM_LEVELS.indexOf(prev);
      if (idx < ZOOM_LEVELS.length - 1) return ZOOM_LEVELS[idx + 1];
      return prev;
    });
  }, []);

  const zoomOut = useCallback(() => {
    setZoomLevel((prev) => {
      const idx = ZOOM_LEVELS.indexOf(prev);
      if (idx > 0) return ZOOM_LEVELS[idx - 1];
      return prev;
    });
  }, []);

  const goToPrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(totalPages || 1, prev + 1));
  }, [totalPages]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevPage();
      else if (e.key === 'ArrowRight') goToNextPage();
      else if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomIn(); }
      else if (e.key === '-') { e.preventDefault(); zoomOut(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goToPrevPage, goToNextPage, zoomIn, zoomOut]);

  const scale = zoomLevel;

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-gray-100 dark:bg-gray-950 rounded-lg overflow-hidden border border-border ${
        isFullscreen ? 'fixed inset-0 z-50' : ''
      }`}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800 dark:bg-gray-900 text-white shrink-0 gap-2">
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-300 hover:text-white hover:bg-gray-700"
                  onClick={() => setShowThumbnails(!showThumbnails)}
                >
                  {showThumbnails ? <SidebarClose className="h-3.5 w-3.5" /> : <SidebarOpen className="h-3.5 w-3.5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle thumbnails</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="h-4 w-px bg-gray-600 mx-1" />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-300 hover:text-white hover:bg-gray-700"
                  onClick={goToPrevPage}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Previous page</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <span className="text-xs text-gray-300 min-w-[60px] text-center">
            {currentPage} / {totalPages || '—'}
          </span>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-300 hover:text-white hover:bg-gray-700"
                  onClick={goToNextPage}
                  disabled={currentPage >= (totalPages || 1)}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Next page</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-300 hover:text-white hover:bg-gray-700"
                  onClick={zoomOut}
                  disabled={zoomLevel <= ZOOM_LEVELS[0]}
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom out</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <span className="text-xs text-gray-300 min-w-[40px] text-center">
            {Math.round(zoomLevel * 100)}%
          </span>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-300 hover:text-white hover:bg-gray-700"
                  onClick={zoomIn}
                  disabled={zoomLevel >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom in</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Zoom preset buttons */}
          <div className="hidden sm:flex items-center gap-0.5 ml-1">
            {ZOOM_LEVELS.map((level) => (
              <Button
                key={level}
                variant={zoomLevel === level ? 'secondary' : 'ghost'}
                size="sm"
                className={`h-6 px-1.5 text-[10px] ${
                  zoomLevel === level
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
                onClick={() => setZoomLevel(level)}
              >
                {Math.round(level * 100)}%
              </Button>
            ))}
          </div>

          <div className="h-4 w-px bg-gray-600 mx-1" />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-300 hover:text-white hover:bg-gray-700"
                  onClick={() => setRotation((prev) => (prev + 90) % 360)}
                >
                  <RotateCw className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Rotate</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-300 hover:text-white hover:bg-gray-700"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-3.5 w-3.5" />
                  ) : (
                    <Maximize2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Content area */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Thumbnail sidebar */}
        {showThumbnails && totalPages > 0 && (
          <div className="w-24 lg:w-32 shrink-0 border-r border-border bg-gray-50 dark:bg-gray-900 overflow-y-auto">
            <ScrollArea className="h-full">
              <div className="p-2 space-y-2">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pageNum = i + 1;
                  const isActive = pageNum === currentPage;
                  return (
                    <button
                      key={pageNum}
                      className={`w-full rounded-md overflow-hidden border-2 transition-all ${
                        isActive
                          ? 'border-emerald-500 shadow-md shadow-emerald-500/20'
                          : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      <div className="bg-white dark:bg-gray-800 p-1">
                        {isPlaceholder || pdfError ? (
                          <div className="aspect-[8.5/11] bg-gray-100 dark:bg-gray-700 rounded-sm flex items-center justify-center">
                            <span className="text-[10px] text-gray-400">{pageNum}</span>
                          </div>
                        ) : (
                          <ErrorBoundary
                            key={`thumbnail-${pdfErrorKey}`}
                            onReset={handlePdfErrorBoundaryReset}
                            fallback={
                              <div className="aspect-[8.5/11] bg-gray-100 dark:bg-gray-700 rounded-sm flex items-center justify-center">
                                <span className="text-[10px] text-gray-400">{pageNum}</span>
                              </div>
                            }
                          >
                            <Document
                              file={fileUrl}
                              onLoadSuccess={() => {}}
                              onLoadError={onDocumentLoadError}
                              className="hidden"
                            >
                              <Page
                                pageNumber={pageNum}
                                width={100}
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                              />
                            </Document>
                          </ErrorBoundary>
                        )}
                      </div>
                      <div
                        className={`text-[9px] text-center py-0.5 ${
                          isActive
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {pageNum}
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Main PDF display */}
        <div
          ref={mainContentRef}
          className="flex-1 overflow-auto flex items-start justify-center p-4"
        >
          {isPlaceholder || pdfError ? (
            // Placeholder mode (also used when PDF fails to load)
            <div
              style={{
                transform: `scale(${scale}) rotate(${rotation}deg)`,
                transformOrigin: 'center top',
                transition: 'transform 0.2s ease',
              }}
            >
              <PlaceholderPage
                pageNum={currentPage}
                totalPages={totalPages}
                title={title}
                fileName={fileName}
                fileSize={fileSize}
                signatureAreas={signatureAreas}
              />
              {pdfError && (
                <div className="mt-3 text-center">
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    PDF could not be loaded — showing placeholder preview
                  </p>
                </div>
              )}
            </div>
          ) : isLoading ? (
            // Loading state
            <div className="space-y-4 py-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading document...</span>
              </div>
              <Skeleton className="w-[612px] h-[792px] mx-auto" />
            </div>
          ) : (
            // Real PDF rendering — wrapped in ErrorBoundary to catch react-pdf rendering errors
            <ErrorBoundary
              key={`pdf-${pdfErrorKey}`}
              onReset={handlePdfErrorBoundaryReset}
              fallback={
                <div
                  style={{
                    transform: `scale(${scale}) rotate(${rotation}deg)`,
                    transformOrigin: 'center top',
                    transition: 'transform 0.2s ease',
                  }}
                >
                  <PlaceholderPage
                    pageNum={currentPage}
                    totalPages={totalPages}
                    title={title}
                    fileName={fileName}
                    fileSize={fileSize}
                    signatureAreas={signatureAreas}
                  />
                  <div className="mt-3 text-center">
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      PDF could not be rendered — showing placeholder preview
                    </p>
                  </div>
                </div>
              }
            >
              <Document
                file={fileUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                onLoadStart={onDocumentLoadStart}
                loading={
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading PDF...</p>
                    <Skeleton className="w-[612px] h-[792px] mx-auto" />
                  </div>
                }
                error={
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <FileText className="h-12 w-12 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground font-medium">Unable to load PDF</p>
                    <p className="text-xs text-muted-foreground">Showing document placeholder instead</p>
                  </div>
                }
              >
                <div
                  style={{
                    transform: `scale(${scale}) rotate(${rotation}deg)`,
                    transformOrigin: 'center top',
                    transition: 'transform 0.2s ease',
                  }}
                >
                  <Page
                    pageNumber={currentPage}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    className="shadow-lg"
                  />
                </div>
              </Document>
            </ErrorBoundary>
          )}
        </div>
      </div>

      {/* Bottom status bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-800 dark:bg-gray-900 text-gray-400 text-[10px] shrink-0">
        <span>{fileName || 'Document'}</span>
        <div className="flex items-center gap-3">
          {fileSize && <span>{formatFileSize(fileSize)}</span>}
          <span>{totalPages} page{totalPages !== 1 ? 's' : ''}</span>
          <span>{Math.round(zoomLevel * 100)}%</span>
        </div>
      </div>
    </div>
  );
}

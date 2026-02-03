'use client';

import { X, Loader2, FileText, AlertCircle } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { renderAsync } from 'docx-preview';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  content: string | null;
  type?: 'text' | 'pdf' | 'docx';
  page?: number;
  highlight?: string;
  isLoading: boolean;
  error?: string | null;
}

export default function FilePreviewModal({
  isOpen,
  onClose,
  fileName,
  content,
  type = 'text',
  page,
  highlight,
  isLoading,
  error
}: FilePreviewModalProps) {
  const [mounted, setMounted] = useState(false);
  const docxContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    // Lock body scroll when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Render DOCX content
  useEffect(() => {
    if (isOpen && type === 'docx' && content && docxContainerRef.current) {
      fetch(content)
        .then(res => res.blob())
        .then(blob => {
          if (docxContainerRef.current) {
            docxContainerRef.current.innerHTML = '';
            renderAsync(blob, docxContainerRef.current, docxContainerRef.current, {
                className: 'docx-viewer',
                inWrapper: false,
                ignoreWidth: false,
                ignoreHeight: false
            }).then(() => {
              // After rendering, search for highlight text and scroll to it
              if (highlight && docxContainerRef.current) {
                const container = docxContainerRef.current;
                const searchText = highlight.substring(0, 50); // Use first 50 chars for matching

                // Find text nodes containing the search text
                const walker = document.createTreeWalker(
                  container,
                  NodeFilter.SHOW_TEXT,
                  null
                );

                let foundNode: Text | null = null;
                while (walker.nextNode()) {
                  const node = walker.currentNode as Text;
                  if (node.textContent && node.textContent.toLowerCase().includes(searchText.toLowerCase())) {
                    foundNode = node;
                    break;
                  }
                }

                if (foundNode && foundNode.parentElement) {
                  // Just scroll to the matching text (no highlight)
                  setTimeout(() => {
                    foundNode?.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 100);
                }
              }
            }).catch(console.error);
          }
        })
        .catch(console.error);
    }
  }, [isOpen, type, content, highlight]);

  // Scroll to text position for text files
  useEffect(() => {
    if (isOpen && type === 'text' && highlight && content) {
      setTimeout(() => {
        // Use browser's find functionality to scroll to text
        const searchText = highlight.substring(0, 50);
        const contentContainer = document.querySelector('.prose');
        if (contentContainer) {
          const textContent = contentContainer.textContent || '';
          const position = textContent.toLowerCase().indexOf(searchText.toLowerCase());
          if (position !== -1) {
            // Calculate approximate scroll position based on character position
            const totalLength = textContent.length;
            const scrollRatio = position / totalLength;
            const scrollContainer = contentContainer.parentElement;
            if (scrollContainer) {
              const scrollTarget = scrollContainer.scrollHeight * scrollRatio;
              scrollContainer.scrollTo({ top: Math.max(0, scrollTarget - 100), behavior: 'smooth' });
            }
          }
        }
      }, 300);
    }
  }, [isOpen, type, highlight, content]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[95vh] flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <FileText className="w-5 h-5 text-primary-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 truncate max-w-md" title={fileName}>
              {fileName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 min-h-[300px]">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
              <p>Loading document content...</p>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center text-red-500 gap-3">
              <AlertCircle className="w-10 h-10" />
              <p className="font-medium">{error}</p>
            </div>
          ) : type === 'pdf' && content ? (
            <iframe
              src={page ? `${content}#page=${page}` : content}
              className="w-full h-full border-none bg-gray-100"
              title="Document Preview"
            />
          ) : type === 'docx' ? (
            <div className="h-full overflow-y-auto p-8 flex justify-center bg-gray-100">
              <div
                ref={docxContainerRef}
                id="docx-container"
                className="bg-white shadow-sm p-8 min-h-full w-full max-w-4xl"
              />
            </div>
          ) : (
            <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded-lg border border-gray-200">
              {content || "No content available."}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

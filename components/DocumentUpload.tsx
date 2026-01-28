'use client';

import { useState, useCallback } from 'react';
import { Upload, File, X, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { uploadDocument, getTaskStatus, type UploadResponse, type TaskStatus } from '@/lib/api';
import { cn } from '@/lib/utils';

interface DocumentUploadProps {
  onUploadComplete?: (filename: string) => void;
}

export default function DocumentUpload({ onUploadComplete }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    taskId?: string;
    filename?: string;
    status?: string;
    error?: string;
  }>({});

  const acceptedTypes = ['.pdf', '.docx', '.txt'];
  const maxFileSize = 50 * 1024 * 1024; // 50MB

  const pollTaskStatus = useCallback(async (taskId: string) => {
    const maxAttempts = 100; // 5 minutes max (100 attempts × 3 seconds)
    let attempts = 0;

    const poll = async () => {
      try {
        const status = await getTaskStatus(taskId);
        setUploadStatus((prev) => ({
          ...prev,
          status: status.status,
          error: status.error,
        }));

        if (status.status === 'completed') {
          setUploading(false);
          onUploadComplete?.(uploadStatus.filename || '');
          setTimeout(() => {
            setUploadStatus({});
          }, 3000);
        } else if (status.status === 'failed') {
          setUploading(false);
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 3000); // Poll every 3 seconds
        } else {
          setUploading(false);
          setUploadStatus((prev) => ({
            ...prev,
            error: 'Upload timeout. Please try again.',
          }));
        }
      } catch (error) {
        setUploading(false);
        setUploadStatus((prev) => ({
          ...prev,
          error: 'Failed to check upload status',
        }));
      }
    };

    poll();
  }, [onUploadComplete]);

  const handleFile = useCallback(
    async (file: File) => {
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

      if (!acceptedTypes.includes(fileExtension)) {
        setUploadStatus({
          error: `Invalid file type. Please upload PDF, DOCX, or TXT files.`,
        });
        return;
      }

      if (file.size > maxFileSize) {
        setUploadStatus({
          error: `File size exceeds 50MB limit.`,
        });
        return;
      }

      setUploading(true);
      setUploadStatus({});

      try {
        const response: UploadResponse = await uploadDocument(file);
        setUploadStatus({
          taskId: response.task_id,
          filename: response.filename,
          status: response.status,
        });
        pollTaskStatus(response.task_id);
      } catch (error: any) {
        setUploading(false);
        setUploadStatus({
          error: error.response?.data?.detail || 'Upload failed. Please try again.',
        });
      }
    },
    [pollTaskStatus]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  return (
    <div className="w-full">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 transition-colors',
          isDragging
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400',
          uploading && 'pointer-events-none opacity-60'
        )}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept=".pdf,.docx,.txt"
          onChange={handleFileInput}
          disabled={uploading}
          multiple={false}
        />

        {uploading ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <Loader2 className="h-12 w-12 text-primary-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <File className="h-5 w-5 text-primary-600" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-gray-900">
                {uploadStatus.filename}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {uploadStatus.status === 'processing'
                  ? 'Indexing document...'
                  : uploadStatus.status === 'completed'
                  ? 'Completed!'
                  : 'Uploading...'}
              </p>
            </div>
            {/* Progress Steps */}
            <div className="w-full max-w-xs">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span className={uploadStatus.status ? 'text-primary-600 font-medium' : ''}>
                  Upload
                </span>
                <span className={uploadStatus.status === 'processing' || uploadStatus.status === 'completed' ? 'text-primary-600 font-medium' : ''}>
                  Processing
                </span>
                <span className={uploadStatus.status === 'completed' ? 'text-primary-600 font-medium' : ''}>
                  Complete
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-violet-500 transition-all duration-500 ease-out"
                  style={{
                    width: uploadStatus.status === 'completed'
                      ? '100%'
                      : uploadStatus.status === 'processing'
                      ? '66%'
                      : '33%'
                  }}
                />
              </div>
            </div>
          </div>
        ) : uploadStatus.status === 'completed' ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <div className="text-center">
              <p className="text-lg font-medium text-gray-900">
                {uploadStatus.filename} uploaded successfully!
              </p>
              <p className="text-sm text-gray-500 mt-1">
                You can now ask questions about this document.
              </p>
            </div>
          </div>
        ) : uploadStatus.error ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <div className="text-center">
              <p className="text-lg font-medium text-red-900">Upload failed</p>
              <p className="text-sm text-red-600 mt-1">{uploadStatus.error}</p>
            </div>
            <button
              onClick={() => setUploadStatus({})}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="rounded-full bg-primary-100 p-4">
              <Upload className="h-8 w-8 text-primary-600" />
            </div>
            <div className="text-center">
              <label
                htmlFor="file-upload"
                className="cursor-pointer text-lg font-medium text-gray-900 hover:text-primary-600"
              >
                Click to upload
              </label>
              <p className="text-sm text-gray-500 mt-1">or drag and drop</p>
              <p className="text-xs text-gray-400 mt-2">
                PDF, DOCX, TXT up to 50MB
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


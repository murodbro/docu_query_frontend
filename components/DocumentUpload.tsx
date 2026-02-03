'use client';

import { useState, useCallback, useEffect } from 'react';
import { Upload, File, X, CheckCircle2, Loader2, AlertCircle, FolderPlus } from 'lucide-react';
import { uploadDocuments, getFolders, getTaskStatus, type UploadResponse } from '@/lib/api';
import { cn } from '@/lib/utils';

interface FileItem {
  file: File;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  taskId?: string;
  error?: string;
}

interface DocumentUploadProps {
  onUploadComplete?: () => void;
  onUploadStart?: () => void;
}

export default function DocumentUpload({ onUploadComplete, onUploadStart }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadsRemaining, setUploadsRemaining] = useState<number | null>(null);
  const [dailyLimit, setDailyLimit] = useState(3);
  const [folderName, setFolderName] = useState('');

  const acceptedTypes = ['.pdf', '.docx', '.txt'];
  const maxFileSize = 50 * 1024 * 1024; // 50MB

  // Fetch remaining uploads on mount
  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const data = await getFolders();
        setUploadsRemaining(data.uploads_remaining);
        setDailyLimit(data.daily_limit);
      } catch (error) {
        // Will be set after first action
      }
    };
    fetchInfo();
  }, []);

  const pollTaskStatus = useCallback(async (taskId: string) => {
    if (!taskId) return;

    const maxAttempts = 100;
    let attempts = 0;

    const poll = async () => {
      try {
        const status = await getTaskStatus(taskId);

        setFiles(prev => {
          const exists = prev.some(f => f.taskId === taskId);
          if (!exists) return prev; // Stop updating if removed

          return prev.map(f =>
            f.taskId === taskId
              ? { ...f, status: status.status as any, error: status.error }
              : f
          );
        });

        if (status.status !== 'completed' && status.status !== 'failed' && attempts < maxAttempts) {
            attempts++;
            setTimeout(poll, 3000);
        } else if (status.status === 'completed' || status.status === 'failed') {
             // Check if all files are done (optional logic here if needed)
             setFiles(prev => {
                const allDone = prev.every(f => f.status === 'completed' || f.status === 'failed');
                if (allDone) {
                  onUploadComplete?.();
                }
                return prev;
             });
        }
      } catch (error) {
         // Keep polling
        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 3000);
        }
      }
    };

    poll();
  }, [onUploadComplete]);


  const handleUpload = useCallback(async () => {
    if (files.length === 0 || isUploading) return;

    if (uploadsRemaining !== null && uploadsRemaining <= 0) {
      alert('Daily upload limit reached. Try again tomorrow.');
      return;
    }

    setIsUploading(true);
    setFiles(prev => prev.map(f => ({ ...f, status: 'uploading' as const })));

    try {
      // Auto-generate folder name from files
      let generatedName = '';
      if (files.length === 1) {
        generatedName = files[0].file.name;
      } else if (files.length > 1) {
        generatedName = `${files[0].file.name} and ${files.length - 1} others`;
      }

      const response: UploadResponse = await uploadDocuments(files.map(f => f.file), generatedName);

      setUploadsRemaining(response.uploads_remaining);
      setFolderName(''); // Reset folder name

      // Notify parent about new folder immediately
      onUploadStart?.();

      // Update files with response data
      setFiles(prev => prev.map((f, i) => {
        const doc = response.documents.find(d => d.filename === f.file.name);
        if (doc) {
          return {
            ...f,
            status: doc.status === 'failed' ? 'failed' : 'processing',
            taskId: doc.task_id,
            error: doc.error,
          };
        }
        return f;
      }));

      // Start polling for each file
      response.documents.forEach((doc) => {
        if (doc.task_id && doc.status !== 'failed') {
          pollTaskStatus(doc.task_id);
        }
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Upload failed';
      setFiles(prev => prev.map(f => ({ ...f, status: 'failed', error: errorMessage })));
    } finally {
      setIsUploading(false);
    }
  }, [files, isUploading, uploadsRemaining, folderName, pollTaskStatus, onUploadStart]);

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const validFiles: FileItem[] = [];

    for (const file of fileArray) {
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

      if (!acceptedTypes.includes(fileExtension)) {
        continue; // Skip invalid files
      }

      if (file.size > maxFileSize) {
        continue; // Skip too large files
      }

      // Check if already added
      if (files.some(f => f.file.name === file.name)) {
        continue;
      }

      validFiles.push({ file, status: 'pending' });
    }

    setFiles(prev => [...prev, ...validFiles]);
  }, [files]);

  const removeFile = useCallback((filename: string) => {
    setFiles(prev => prev.filter(f => f.file.name !== filename));
  }, []);

  const clearCompleted = useCallback(() => {
    setFiles(prev => prev.filter(f => f.status !== 'completed' && f.status !== 'failed'));
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
    e.target.value = '';
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const pendingFiles = files.filter(f => f.status === 'pending');
  const hasProcessing = files.some(f => f.status === 'uploading' || f.status === 'processing');

  const isLimitReached = uploadsRemaining !== null && uploadsRemaining <= 0;

  return (
    <div className="w-full space-y-4">
      {/* Upload Zone */}
      <div
        onDrop={!isLimitReached ? handleDrop : undefined}
        onDragOver={!isLimitReached ? handleDragOver : undefined}
        onDragLeave={!isLimitReached ? handleDragLeave : undefined}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 transition-colors',
          isDragging
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400',
          (hasProcessing || isLimitReached) && 'pointer-events-none opacity-60',
          isLimitReached && 'bg-gray-50 border-gray-200'
        )}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept=".pdf,.docx,.txt"
          onChange={handleFileInput}
          disabled={hasProcessing || isLimitReached}
          multiple
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className={cn(
            "rounded-full p-4",
            isLimitReached ? "bg-gray-100" : "bg-primary-100"
          )}>
            <Upload className={cn(
              "h-8 w-8",
              isLimitReached ? "text-gray-400" : "text-primary-600"
            )} />
          </div>
          <div className="text-center">
            <label
              htmlFor="file-upload"
              className={cn(
                "cursor-pointer text-lg font-medium",
                isLimitReached ? "text-gray-500 cursor-not-allowed" : "text-gray-900 hover:text-primary-600"
              )}
            >
              {isLimitReached ? 'Daily upload limit reached' : 'Click to select files'}
            </label>
            <p className="text-sm text-gray-500 mt-1">
              {isLimitReached ? 'Please try again tomorrow' : 'or drag and drop'}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              PDF, DOCX, TXT up to 50MB each
            </p>
            {uploadsRemaining !== null && (
              <p className={cn(
                "text-xs mt-2 font-medium",
                isLimitReached ? "text-red-500" : "text-primary-600"
              )}>
                {uploadsRemaining} of {dailyLimit} uploads remaining today
              </p>
            )}
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {files.length} file{files.length > 1 ? 's' : ''} selected
            </span>
            {files.some(f => f.status === 'completed' || f.status === 'failed') && (
              <button
                onClick={clearCompleted}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear completed
              </button>
            )}
          </div>

          <div className="space-y-2">
            {files.map((fileItem, index) => (
              <div
                key={fileItem.file.name}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border',
                  fileItem.status === 'completed' && 'bg-green-50 border-green-200',
                  fileItem.status === 'failed' && 'bg-red-50 border-red-200',
                  (fileItem.status === 'uploading' || fileItem.status === 'processing') && 'bg-blue-50 border-blue-200',
                  fileItem.status === 'pending' && 'bg-gray-50 border-gray-200'
                )}
              >
                {/* Status Icon */}
                {fileItem.status === 'completed' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                ) : fileItem.status === 'failed' ? (
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                ) : fileItem.status === 'pending' ? (
                  <File className="h-5 w-5 text-gray-400 flex-shrink-0" />
                ) : (
                  <Loader2 className="h-5 w-5 text-blue-500 animate-spin flex-shrink-0" />
                )}

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {fileItem.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {fileItem.status === 'pending' && 'Ready to upload'}
                    {fileItem.status === 'uploading' && 'Uploading...'}
                    {fileItem.status === 'processing' && 'Processing...'}
                    {fileItem.status === 'completed' && 'Ready'}
                    {fileItem.status === 'failed' && (fileItem.error || 'Failed')}
                  </p>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeFile(fileItem.file.name)}
                  className="p-1 hover:bg-gray-200 rounded"
                  title="Remove"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            ))}
          </div>



          {/* Upload Button */}
          {pendingFiles.length > 0 && !hasProcessing && (
            <button
              onClick={handleUpload}
              disabled={uploadsRemaining !== null && uploadsRemaining <= 0}
              className={cn(
                'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all',
                'bg-gradient-to-r from-primary-600 to-violet-600 text-white',
                'hover:from-primary-700 hover:to-violet-700',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <FolderPlus className="w-5 h-5" />
              Upload {pendingFiles.length} file{pendingFiles.length > 1 ? 's' : ''} as new folder
            </button>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  MessageSquare,
  Upload,
  LogOut,
  User,
  RefreshCw,
  Menu,
  X,
  Folder,
  File,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Zap,
  Target,
  Shield,
} from 'lucide-react';
import DocumentUpload from '@/components/DocumentUpload';
import ChatInterface from '@/components/ChatInterface';
import FilePreviewModal from '@/components/FilePreviewModal';
import { useAuth } from '@/components/AuthContext';
import { getFolders, getDocumentContent, getDocumentRaw, type FolderInfo, type DocumentInfo, type Citation } from '@/lib/api';
import ProfileModal from '@/components/ProfileModal';
import { cn, formatDate } from '@/lib/utils';

type View = 'upload' | 'documents' | 'chat';

export default function Home() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [currentView, setCurrentView] = useState<View>('chat');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [folders, setFolders] = useState<FolderInfo[]>([]);
  const [uploadsInfo, setUploadsInfo] = useState<{
    uploads_today: number;
    uploads_remaining: number;
    daily_limit: number;
  } | null>(null);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFolder, setSelectedFolder] = useState<FolderInfo | null>(null);

  // File Preview State
  const [previewFile, setPreviewFile] = useState<{id: string, name: string} | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'text' | 'pdf' | 'docx'>('text');
  const [previewPage, setPreviewPage] = useState<number | undefined>(undefined);
  const [previewHighlight, setPreviewHighlight] = useState<string | undefined>(undefined);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const handleFileClick = async (docId: string, filename: string, page?: number, highlight?: string) => {
    setPreviewFile({ id: docId, name: filename });
    setPreviewPage(page);
    setPreviewHighlight(highlight);
    setIsPreviewLoading(true);
    setPreviewError(null);
    setPreviewContent(null);

    // Revoke previous URL if it was a blob
    if (previewContent && previewContent.startsWith('blob:')) {
      URL.revokeObjectURL(previewContent);
    }

    const isPdf = filename.toLowerCase().endsWith('.pdf');
    const isDocx = filename.toLowerCase().endsWith('.docx');
    const isDoc = filename.toLowerCase().endsWith('.doc');

    if (isPdf) setPreviewType('pdf');
    else if (isDocx || isDoc) setPreviewType('docx');
    else setPreviewType('text');

    try {
      if (isPdf || isDocx || isDoc) {
        const blob = await getDocumentRaw(docId);
        const url = URL.createObjectURL(blob);
        setPreviewContent(url);
      } else {
        const data = await getDocumentContent(docId);
        setPreviewContent(data.content);
        // Fallback check if backend returns binary type?
        if (data.type === 'binary' || data.type === 'pdf') {
             // If we missed the extension check, try raw download
             setPreviewType('pdf');
             const blob = await getDocumentRaw(docId);
             const url = URL.createObjectURL(blob);
             setPreviewContent(url);
        }
      }
    } catch (error) {
      console.error("Error fetching content:", error);
      setPreviewError("Failed to load document content.");
      setPreviewContent(null);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleSourceClick = (citation: Citation) => {
    let docId = citation.document_id;

    // Fallback: if document_id is missing, try to find by filename in current folder
    if (!docId && selectedFolder) {
      const ext = citation.document.split('.').pop()?.toLowerCase();

      // First try exact filename match
      let matchingDoc = selectedFolder.documents.find(
        doc => doc.filename === citation.document
      );

      // If no match, try UUID extraction from filename
      if (!matchingDoc) {
        const uuidMatch = citation.document.match(/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
        if (uuidMatch) {
          const extractedId = uuidMatch[1];
          matchingDoc = selectedFolder.documents.find(doc => doc.id === extractedId);
        }
      }

      // Last resort: if only ONE document with same extension exists, use it
      if (!matchingDoc && ext) {
        const sameExtDocs = selectedFolder.documents.filter(
          doc => doc.filename.toLowerCase().endsWith(`.${ext}`)
        );
        if (sameExtDocs.length === 1) {
          matchingDoc = sameExtDocs[0];
        }
      }

      if (matchingDoc) {
        docId = matchingDoc.id;
      }
    }

    if (docId) {
       handleFileClick(docId, citation.document, citation.page, citation.chunk_text);
    }
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Generate a stable session ID for the user's knowledge base
  useEffect(() => {
    if (user) {
      setSessionId(`kb_${user.id}`);
    }
  }, [user]);

  // Fetch folders
  const fetchFolders = useCallback(async () => {
    if (!user) return;

    setLoadingDocs(true);
    try {
      const data = await getFolders();
      setFolders(data.folders);
      setUploadsInfo({
        uploads_today: data.uploads_today,
        uploads_remaining: data.uploads_remaining,
        daily_limit: data.daily_limit,
      });
    } catch (error) {
      console.error('Failed to fetch folders:', error);
    } finally {
      setLoadingDocs(false);
    }
  }, [user]);

  // Fetch folders on mount
  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  // Get all processing documents
  const processingDocs = folders.flatMap(f =>
    f.documents.filter(d => d.status === 'processing').map(d => ({ ...d, folderName: f.name }))
  );

  // Auto-refresh when there are processing documents
  useEffect(() => {
    if (processingDocs.length > 0) {
      const interval = setInterval(() => {
        fetchFolders();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [processingDocs.length, fetchFolders]);

  const toggleFolder = useCallback((folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const totalDocs = folders.reduce((sum, f) => sum + f.documents.length, 0);
  const completedDocs = folders.reduce((sum, f) => sum + f.documents.filter(d => d.status === 'completed').length, 0);

  const navItems = [
    { id: 'chat' as View, label: 'Chat', icon: MessageSquare, badge: null },
    { id: 'documents' as View, label: 'Documents', icon: Folder, badge: folders.length },
    { id: 'upload' as View, label: 'Upload', icon: Upload, badge: null },
  ];

  return (
    <div className="h-screen overflow-hidden bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside className={cn(
        'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 flex flex-col',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-violet-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-violet-600 bg-clip-text text-transparent">
              DocuQuery
            </span>
          </div>
          <button
            className="lg:hidden p-1 hover:bg-gray-100 rounded"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  setSidebarOpen(false);
                }}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all',
                  currentView === item.id
                    ? 'bg-primary-50 text-primary-700 border border-primary-200'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  {item.label}
                </div>
                {item.badge !== null && item.badge > 0 && (
                  <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Features List */}
        <div className="px-4 py-4 border-t border-gray-200">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Features</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Zap className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                <span className="text-sm text-gray-600">Hybrid Search (Vector + BM25)</span>
              </div>
              <div className="flex items-center gap-3">
                <Target className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600">Source Citations</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600">Cohere Reranking</span>
              </div>
            </div>
          </div>
        </div>

        {/* User Section */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setIsProfileOpen(true)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Account Settings"
              >
                <User className="w-4 h-4" />
              </button>
              <button
                onClick={logout}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-semibold text-gray-900">
              {navItems.find(i => i.id === currentView)?.label}
            </span>
            <div className="w-9" />
          </div>
        </header>

        {/* Page Content */}
        <main className={cn(
          "flex-1 flex flex-col min-w-0 bg-white/50",
          currentView === 'chat' ? 'overflow-hidden' : 'overflow-auto'
        )}>
          {currentView === 'upload' && (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900">Upload Documents</h1>
                <p className="text-gray-500 mt-1">
                  Add files to your knowledge base to query them with AI
                </p>
              </div>
              <DocumentUpload
                onUploadComplete={fetchFolders}
                onUploadStart={fetchFolders}
              />
            </div>
          )}

          {currentView === 'documents' && (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Your Documents</h1>
                  <p className="text-gray-500 mt-1">
                    {folders.length} folders • {totalDocs} files in your knowledge base
                  </p>
                </div>
                <button
                  onClick={fetchFolders}
                  disabled={loadingDocs}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <RefreshCw className={cn('w-5 h-5', loadingDocs && 'animate-spin')} />
                </button>
              </div>

              {/* Folder Structure */}
              {loadingDocs && folders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                </div>
              ) : folders.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <Folder className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900">No documents yet</h3>
                  <p className="text-gray-500 mt-1">Upload files to build your knowledge base</p>
                  <button
                    onClick={() => setCurrentView('upload')}
                    className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors inline-flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Documents
                  </button>
                </div>
              ) : (
                <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                  {folders.map((folder) => (
                    <div key={folder.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      {/* Folder Header */}
                      <button
                        onClick={() => toggleFolder(folder.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        {expandedFolders.has(folder.id) ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                        <Folder className="w-5 h-5 text-amber-500" />
                        <span className="flex-1 text-left font-medium text-gray-900">
                          {folder.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {folder.documents.length} file{folder.documents.length !== 1 ? 's' : ''}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDate(folder.created_at)}
                        </span>
                      </button>

                      {/* Folder Contents */}
                      {expandedFolders.has(folder.id) && folder.documents.length > 0 && (
                        <div className="border-t border-gray-100 bg-gray-50">
                          {folder.documents.map((doc) => (
                            <div
                              key={doc.id}
                              onClick={() => handleFileClick(doc.id, doc.filename)}
                              className="flex items-center gap-3 px-4 py-2 pl-12 hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                              <File className={cn(
                                'w-4 h-4',
                                doc.filename.endsWith('.pdf') ? 'text-red-500' :
                                doc.filename.endsWith('.docx') ? 'text-blue-500' :
                                'text-gray-500'
                              )} />
                              <span className="flex-1 text-sm text-gray-700 truncate">
                                {doc.filename}
                              </span>
                              {doc.status === 'completed' ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : doc.status === 'processing' ? (
                                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentView === 'chat' && (
            <div className="h-full flex flex-col">
              {/* Folder Selection Screen */}
              {!selectedFolder ? (
                <div className="max-w-2xl mx-auto px-4 py-12 w-full">
                  <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Select a Folder</h1>
                    <p className="text-gray-500 mt-1">Choose a document folder to chat with</p>
                  </div>

                  {folders.filter(f => f.documents.some(d => d.status === 'completed')).length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                      <Folder className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-900">No folders ready yet</h3>
                      <p className="text-gray-500 mt-1">Upload documents first to start chatting</p>
                      <button
                        onClick={() => setCurrentView('upload')}
                        className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors inline-flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Upload Documents
                      </button>
                    </div>
                  ) : (
                    <div className="grid gap-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
                      {folders.filter(f => f.documents.some(d => d.status === 'completed')).map((folder) => (
                        <button
                          key={folder.id}
                          onClick={() => {
                            setSelectedFolder(folder);
                            setSessionId(`folder_${folder.id}`);
                          }}
                          className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:border-primary-400 hover:shadow-md transition-all text-left group"
                        >
                          <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                            <Folder className="w-6 h-6 text-amber-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 group-hover:text-primary-600">
                              {folder.name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {folder.documents.filter(d => d.status === 'completed').length} documents • {formatDate(folder.created_at)}
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Folder Header with Back Button */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
                    <button
                      onClick={() => setSelectedFolder(null)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Folder className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-medium text-gray-900 truncate">{selectedFolder.name}</h2>
                      <p className="text-xs text-gray-500">
                        {selectedFolder.documents.filter(d => d.status === 'completed').length} documents
                      </p>
                    </div>
                  </div>

                  {/* Chat Interface */}
                  <div className="flex-1 min-h-0">
                    <ChatInterface
                      sessionId={sessionId}
                      folderId={selectedFolder.id}
                      folderName={selectedFolder.name}
                      onSourceClick={handleSourceClick}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </main>
      </div>

      {/* File Preview Modal */}
      <FilePreviewModal
         isOpen={!!previewFile}
         onClose={() => {
           setPreviewFile(null);
           setPreviewPage(undefined);
           setPreviewHighlight(undefined);
         }}
         fileName={previewFile?.name || ''}
         content={previewContent}
         type={previewType}
         page={previewPage}
         highlight={previewHighlight}
         isLoading={isPreviewLoading}
         error={previewError}
       />

      {/* Processing Toast */}
      {processingDocs.length > 0 && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
           <div className="bg-white rounded-lg shadow-lg border border-blue-200 p-4 w-80">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-100 rounded-full p-2">
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Processing {processingDocs.length} file{processingDocs.length > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-gray-500">Please wait...</p>
              </div>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {processingDocs.map((doc) => (
                <div key={doc.id} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
                  <FileText className="w-3 h-3 text-blue-500 flex-shrink-0" />
                  <span className="truncate">{doc.filename}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
}

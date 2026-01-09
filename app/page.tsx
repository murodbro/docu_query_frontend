'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  MessageSquare,
  Upload,
  Menu,
  X,
  Plus,
  Sparkles,
  ChevronRight,
  Zap,
  Shield,
  Target,
  Trash2,
  Clock,
  File,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import DocumentUpload from '@/components/DocumentUpload';
import ChatInterface from '@/components/ChatInterface';
import { cn, generateSessionId, formatDate } from '@/lib/utils';

type View = 'upload' | 'chat' | 'documents';

interface SavedSession {
  id: string;
  name: string;
  createdAt: string;
  lastMessageAt: string;
  messageCount: number;
  documents: string[];
}

interface UploadedDocument {
  filename: string;
  uploadedAt: string;
  sessionId: string;
  status: 'processing' | 'completed' | 'failed';
}

// LocalStorage keys
const SESSIONS_KEY = 'docuquery_sessions';
const DOCUMENTS_KEY = 'docuquery_documents';
const CURRENT_SESSION_KEY = 'docuquery_current_session';

export default function Home() {
  const [currentView, setCurrentView] = useState<View>('upload');
  const [sessionId, setSessionId] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(true);
  const [isDocsExpanded, setIsDocsExpanded] = useState(true);

  // Load saved data on mount
  useEffect(() => {
    const storedSessions = localStorage.getItem(SESSIONS_KEY);
    const storedDocs = localStorage.getItem(DOCUMENTS_KEY);
    const currentSession = localStorage.getItem(CURRENT_SESSION_KEY);

    if (storedSessions) {
      setSavedSessions(JSON.parse(storedSessions));
    }
    if (storedDocs) {
      setUploadedDocuments(JSON.parse(storedDocs));
    }
    if (currentSession) {
      setSessionId(currentSession);
    } else {
      const newSessionId = generateSessionId();
      setSessionId(newSessionId);
      localStorage.setItem(CURRENT_SESSION_KEY, newSessionId);
    }
  }, []);

  // Save sessions to localStorage
  const saveSessions = useCallback((sessions: SavedSession[]) => {
    setSavedSessions(sessions);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  }, []);

  // Save documents to localStorage
  const saveDocuments = useCallback((docs: UploadedDocument[]) => {
    setUploadedDocuments(docs);
    localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(docs));
  }, []);

  // Get current session info
  const currentSession = savedSessions.find((s) => s.id === sessionId);

  // Get documents for current session
  const currentSessionDocs = uploadedDocuments.filter((d) => d.sessionId === sessionId);

  const handleUploadComplete = (filename: string) => {
    // Add document to list
    const newDoc: UploadedDocument = {
      filename,
      uploadedAt: new Date().toISOString(),
      sessionId,
      status: 'completed',
    };
    saveDocuments([...uploadedDocuments, newDoc]);

    // Update or create session
    const existingSession = savedSessions.find((s) => s.id === sessionId);
    if (existingSession) {
      const updated = savedSessions.map((s) =>
        s.id === sessionId
          ? { ...s, documents: [...s.documents, filename], lastMessageAt: new Date().toISOString() }
          : s
      );
      saveSessions(updated);
    } else {
      const newSession: SavedSession = {
        id: sessionId,
        name: `Session ${savedSessions.length + 1}`,
        createdAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString(),
        messageCount: 0,
        documents: [filename],
      };
      saveSessions([newSession, ...savedSessions]);
    }

    // Auto switch to chat
    setTimeout(() => {
      setCurrentView('chat');
    }, 1500);
  };

  const handleMessageSent = () => {
    // Update session message count
    const existingSession = savedSessions.find((s) => s.id === sessionId);
    if (existingSession) {
      const updated = savedSessions.map((s) =>
        s.id === sessionId
          ? { ...s, messageCount: s.messageCount + 1, lastMessageAt: new Date().toISOString() }
          : s
      );
      saveSessions(updated);
    } else {
      const newSession: SavedSession = {
        id: sessionId,
        name: `Session ${savedSessions.length + 1}`,
        createdAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString(),
        messageCount: 1,
        documents: [],
      };
      saveSessions([newSession, ...savedSessions]);
    }
  };

  const handleNewSession = () => {
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
    localStorage.setItem(CURRENT_SESSION_KEY, newSessionId);
    setCurrentView('upload');
    setIsSidebarOpen(false);
  };

  const handleSelectSession = (session: SavedSession) => {
    setSessionId(session.id);
    localStorage.setItem(CURRENT_SESSION_KEY, session.id);
    setCurrentView('chat');
    setIsSidebarOpen(false);
  };

  const handleDeleteSession = (sessionToDelete: SavedSession, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedSessions = savedSessions.filter((s) => s.id !== sessionToDelete.id);
    saveSessions(updatedSessions);

    // Also remove documents for this session
    const updatedDocs = uploadedDocuments.filter((d) => d.sessionId !== sessionToDelete.id);
    saveDocuments(updatedDocs);

    // If current session was deleted, create new one
    if (sessionToDelete.id === sessionId) {
      handleNewSession();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-80 bg-white/80 backdrop-blur-xl border-r border-gray-200/50 z-50 transform transition-transform duration-300 flex flex-col',
          'lg:translate-x-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-200/50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-violet-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-xl text-gray-900">DocuQuery</h1>
                <p className="text-xs text-gray-500">AI Document Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* New Session Button */}
        <div className="p-4 flex-shrink-0">
          <button
            onClick={handleNewSession}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl',
              'bg-gradient-to-r from-primary-600 to-violet-600 text-white',
              'hover:from-primary-700 hover:to-violet-700',
              'transition-all duration-200 shadow-lg shadow-primary-500/25',
              'hover:shadow-xl hover:shadow-primary-500/30'
            )}
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">New Session</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-4 space-y-2 flex-shrink-0">
          <button
            onClick={() => {
              setCurrentView('upload');
              setIsSidebarOpen(false);
            }}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
              currentView === 'upload'
                ? 'bg-primary-50 text-primary-700 border border-primary-200'
                : 'hover:bg-gray-50 text-gray-700'
            )}
          >
            <Upload className="w-5 h-5" />
            <span className="font-medium">Upload Documents</span>
          </button>

          <button
            onClick={() => {
              setCurrentView('chat');
              setIsSidebarOpen(false);
            }}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
              currentView === 'chat'
                ? 'bg-primary-50 text-primary-700 border border-primary-200'
                : 'hover:bg-gray-50 text-gray-700'
            )}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="font-medium">Chat</span>
            <ChevronRight className="w-4 h-4 ml-auto" />
          </button>

          <button
            onClick={() => {
              setCurrentView('documents');
              setIsSidebarOpen(false);
            }}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
              currentView === 'documents'
                ? 'bg-primary-50 text-primary-700 border border-primary-200'
                : 'hover:bg-gray-50 text-gray-700'
            )}
          >
            <FileText className="w-5 h-5" />
            <span className="font-medium">Documents</span>
            {uploadedDocuments.length > 0 && (
              <span className="ml-auto bg-gray-200 text-gray-700 text-xs font-semibold px-2 py-1 rounded-full">
                {uploadedDocuments.length}
              </span>
            )}
          </button>
        </nav>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Chat History */}
          <div className="bg-gray-50/50 rounded-xl border border-gray-200/50">
            <button
              onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Chat History</span>
              </div>
              {isHistoryExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {isHistoryExpanded && (
              <div className="px-2 pb-2 space-y-1 max-h-48 overflow-y-auto">
                {savedSessions.length === 0 ? (
                  <p className="text-xs text-gray-400 px-2 py-2">No saved sessions yet</p>
                ) : (
                  savedSessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => handleSelectSession(session)}
                      className={cn(
                        'group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all',
                        session.id === sessionId
                          ? 'bg-primary-100 text-primary-800'
                          : 'hover:bg-gray-100 text-gray-600'
                      )}
                    >
                      <MessageSquare className="w-4 h-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{session.name}</p>
                        <p className="text-[10px] text-gray-400">
                          {session.messageCount} messages · {session.documents.length} docs
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDeleteSession(session, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded text-red-500 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Current Session Documents */}
          {currentSessionDocs.length > 0 && (
            <div className="bg-gray-50/50 rounded-xl border border-gray-200/50">
              <button
                onClick={() => setIsDocsExpanded(!isDocsExpanded)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700"
              >
                <div className="flex items-center gap-2">
                  <File className="w-4 h-4" />
                  <span>Session Documents</span>
                </div>
                {isDocsExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {isDocsExpanded && (
                <div className="px-2 pb-2 space-y-1 max-h-32 overflow-y-auto">
                  {currentSessionDocs.map((doc, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-100"
                    >
                      <FileText className="w-4 h-4 text-primary-500 flex-shrink-0" />
                      <span className="text-xs text-gray-700 truncate flex-1">{doc.filename}</span>
                      <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                        ✓
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Features Card */}
        <div className="p-4 flex-shrink-0">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200/50">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Features</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Hybrid Search (Vector + BM25)</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Target className="w-4 h-4 text-green-500" />
                <span>Source Citations</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Shield className="w-4 h-4 text-blue-500" />
                <span>Cohere Reranking</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200/50 flex-shrink-0">
          <p className="text-xs text-center text-gray-400">
            Powered by LlamaIndex + OpenAI
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-80 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-gray-200/50">
          <div className="flex items-center justify-between px-4 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h2 className="font-semibold text-gray-900">
                  {currentView === 'upload'
                    ? 'Upload Documents'
                    : currentView === 'chat'
                    ? 'Ask Questions'
                    : 'All Documents'}
                </h2>
                <p className="text-sm text-gray-500">
                  {currentView === 'upload'
                    ? 'Upload PDF, DOCX, or TXT files'
                    : currentView === 'chat'
                    ? 'Get answers with source citations'
                    : `${uploadedDocuments.length} documents uploaded`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {currentSession && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-primary-50 border border-primary-200 rounded-full">
                  <MessageSquare className="w-4 h-4 text-primary-600" />
                  <span className="text-sm font-medium text-primary-700">
                    {currentSession.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="h-[calc(100vh-73px)]">
          {currentView === 'upload' ? (
            <div className="max-w-3xl mx-auto px-4 lg:px-8 py-12">
              {/* Hero Section */}
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 border border-primary-200 rounded-full mb-6">
                  <Sparkles className="w-4 h-4 text-primary-600" />
                  <span className="text-sm font-medium text-primary-700">
                    AI-Powered Document Intelligence
                  </span>
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                  Upload your documents
                </h1>
                <p className="text-lg text-gray-600 max-w-xl mx-auto">
                  Drop your files below and start asking questions. Get accurate answers with source citations.
                </p>
              </div>

              {/* Upload Component */}
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-xl shadow-gray-200/50 p-8">
                <DocumentUpload onUploadComplete={handleUploadComplete} />
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                {[
                  {
                    icon: FileText,
                    title: 'Multiple Formats',
                    description: 'Support for PDF, DOCX, and TXT files up to 50MB',
                    color: 'primary',
                  },
                  {
                    icon: Zap,
                    title: 'Intelligent Chunking',
                    description: 'Smart text splitting for optimal retrieval',
                    color: 'amber',
                  },
                  {
                    icon: Target,
                    title: 'Source Citations',
                    description: 'Every answer includes relevant sources',
                    color: 'green',
                  },
                ].map((feature, i) => (
                  <div
                    key={i}
                    className="bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6 hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300"
                  >
                    <div
                      className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
                        feature.color === 'primary' && 'bg-primary-100 text-primary-600',
                        feature.color === 'amber' && 'bg-amber-100 text-amber-600',
                        feature.color === 'green' && 'bg-green-100 text-green-600'
                      )}
                    >
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : currentView === 'chat' ? (
            <ChatInterface
              sessionId={sessionId}
              onSessionChange={setSessionId}
              onMessageSent={handleMessageSent}
            />
          ) : (
            /* Documents View */
            <div className="max-w-4xl mx-auto px-4 lg:px-8 py-8">
              <div className="space-y-4">
                {uploadedDocuments.length === 0 ? (
                  <div className="text-center py-16">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No documents yet</h3>
                    <p className="text-gray-500 mb-6">Upload your first document to get started</p>
                    <button
                      onClick={() => setCurrentView('upload')}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
                    >
                      <Upload className="w-5 h-5" />
                      Upload Document
                    </button>
                  </div>
                ) : (
                  uploadedDocuments.map((doc, i) => {
                    const session = savedSessions.find((s) => s.id === doc.sessionId);
                    return (
                      <div
                        key={i}
                        className="bg-white/70 backdrop-blur-xl rounded-xl border border-gray-200/50 p-4 flex items-center gap-4 hover:shadow-lg transition-all"
                      >
                        <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-6 h-6 text-primary-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">{doc.filename}</h4>
                          <p className="text-sm text-gray-500">
                            Uploaded {formatDate(doc.uploadedAt)}
                            {session && ` · ${session.name}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'text-xs font-medium px-2 py-1 rounded-full',
                              doc.status === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : doc.status === 'processing'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            )}
                          >
                            {doc.status === 'completed' ? 'Indexed' : doc.status}
                          </span>
                          <button
                            onClick={() => {
                              setSessionId(doc.sessionId);
                              setCurrentView('chat');
                            }}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-primary-600 transition-colors"
                          >
                            <MessageSquare className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

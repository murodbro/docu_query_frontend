import axios from 'axios';
import { getToken } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth header to all requests
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    // Debug log to catch malformed tokens
    if (token.startsWith('{') || token.includes('"access"')) {
      console.error('CRITICAL: Malformed token detected in interceptor:', token);
      // Optional: Clear it immediately if it's definitely wrong?
      // localStorage.removeItem('docuquery_token');
    }
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Types
export interface DocumentInfo {
  id: string;
  filename: string;
  status: 'processing' | 'completed' | 'failed';
  created_at: string;
}

export interface FolderInfo {
  id: string;
  name: string;
  created_at: string;
  documents: DocumentInfo[];
}

export interface UploadResponse {
  ok: boolean;
  folder_id: string;
  folder_name: string;
  documents: {
    id?: string;
    filename: string;
    task_id?: string;
    status: string;
    error?: string;
  }[];
  uploads_remaining: number;
}

export interface FoldersResponse {
  folders: FolderInfo[];
  uploads_today: number;
  uploads_remaining: number;
  daily_limit: number;
}

export interface TaskStatus {
  status: 'processing' | 'completed' | 'failed';
  filename: string;
  created_at: string;
  error?: string;
}

export interface Citation {
  document: string;
  document_id?: string;
  page?: number;
  chunk_text: string;
  relevance_score: number;
}

export interface QueryRequest {
  query: string;
  session_id?: string;
}

export interface QueryResponse {
  answer: string;
  sources: Citation[];
  session_id: string;
}

export interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    sources?: Citation[];
  };
}

export interface SessionHistory {
  session_id: string;
  history: HistoryMessage[];
}

// API Functions
export async function uploadDocuments(files: File[], folderName?: string): Promise<UploadResponse> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });
  if (folderName) {
    formData.append('folder_name', folderName);
  }

  const response = await api.post<UploadResponse>('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

export async function getFolders(): Promise<FoldersResponse> {
  const response = await api.get<FoldersResponse>('/folders');
  return response.data;
}

export async function getTaskStatus(taskId: string): Promise<TaskStatus> {
  const response = await api.get<TaskStatus>(`/tasks/${taskId}`);
  return response.data;
}

export async function queryDocuments(
  query: string,
  sessionId?: string,
  folderId?: string
): Promise<QueryResponse> {
  const response = await api.post<QueryResponse>('/query', {
    query,
    session_id: sessionId,
    folder_id: folderId,
  });
  return response.data;
}

export async function getSessionHistory(sessionId: string): Promise<SessionHistory> {
  const response = await api.get<SessionHistory>(`/sessions/${sessionId}`);
  return response.data;
}

export default api;
// ... existing exports ...

export const getDocumentContent = async (documentId: string): Promise<{ content: string; filename: string; type: string }> => {
  const response = await api.get(`/documents/${documentId}/content`);
  return response.data;
};

export const getDocumentRaw = async (documentId: string): Promise<Blob> => {
  const response = await api.get(`/documents/${documentId}/raw`, {
    responseType: 'blob',
  });
  return response.data;
};

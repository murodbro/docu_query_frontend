import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface UploadResponse {
  ok: boolean;
  filename: string;
  task_id: string;
  status: string;
}

export interface TaskStatus {
  status: 'processing' | 'completed' | 'failed';
  filename: string;
  created_at: string;
  error?: string;
}

export interface Citation {
  document: string;
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
export async function uploadDocument(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<UploadResponse>('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

export async function getTaskStatus(taskId: string): Promise<TaskStatus> {
  const response = await api.get<TaskStatus>(`/tasks/${taskId}`);
  return response.data;
}

export async function queryDocuments(
  query: string,
  sessionId?: string
): Promise<QueryResponse> {
  const response = await api.post<QueryResponse>('/query', {
    query,
    session_id: sessionId,
  });
  return response.data;
}

export async function getSessionHistory(sessionId: string): Promise<SessionHistory> {
  const response = await api.get<SessionHistory>(`/sessions/${sessionId}`);
  return response.data;
}

export default api;

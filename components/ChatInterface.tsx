'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { queryDocuments, type QueryResponse, type Citation } from '@/lib/api';
import { cn, generateSessionId, getUserStorageKey } from '@/lib/utils';
import ChatMessage from './ChatMessage';
import CitationCard from './CitationCard';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    sources?: Citation[];
  };
}

interface ChatInterfaceProps {
  sessionId: string;
  onSessionChange?: (sessionId: string) => void;
  onMessageSent?: () => void;
}

// Get storage key for chat messages
const getMessagesKey = (sessionId: string) => getUserStorageKey(`chat_messages_${sessionId}`);

export default function ChatInterface({ sessionId, onSessionChange, onMessageSent }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load messages from localStorage when sessionId changes
  useEffect(() => {
    if (!sessionId) return;

    const stored = localStorage.getItem(getMessagesKey(sessionId));
    if (stored) {
      try {
        setMessages(JSON.parse(stored));
      } catch (e) {
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
  }, [sessionId]);

  // Save messages to localStorage whenever they change
  const saveMessages = useCallback((newMessages: Message[]) => {
    if (!sessionId) return;
    localStorage.setItem(getMessagesKey(sessionId), JSON.stringify(newMessages));
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    saveMessages(updatedMessages);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response: QueryResponse = await queryDocuments(input.trim(), sessionId);

      if (response.session_id && response.session_id !== sessionId) {
        onSessionChange?.(response.session_id);
      }

      const assistantMessage: Message = {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        content: response.answer,
        timestamp: new Date().toISOString(),
        metadata: {
          sources: response.sources,
        },
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      saveMessages(finalMessages);
      onMessageSent?.();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to get response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center mb-6 shadow-lg shadow-primary-500/25">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Ask anything about your documents
            </h2>
            <p className="text-gray-500 max-w-md">
              Upload a document first, then ask questions. I'll find the relevant information and cite my sources.
            </p>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-lg w-full">
              {[
                'What are the key findings?',
                'Summarize the main points',
                'What are the conclusions?',
                'Find specific details about...',
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => setInput(suggestion)}
                  className="px-4 py-3 text-sm text-left text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-all hover:border-primary-300 hover:shadow-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))
        )}

        {isLoading && (
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center">
              <Loader2 className="h-4 w-4 text-white animate-spin" />
            </div>
            <div className="flex-1">
              <div className="bg-gray-100 rounded-lg px-4 py-3 max-w-[80%]">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm text-gray-500">Searching documents...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white py-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4">
          <div className="relative flex items-center gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your documents..."
              rows={1}
              className={cn(
                'flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3',
                'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none',
                'placeholder:text-gray-400 text-gray-900',
                'transition-all duration-200',
                'max-h-32'
              )}
              style={{
                minHeight: '48px',
                height: 'auto',
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 128) + 'px';
              }}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={cn(
                'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center',
                'bg-gradient-to-r from-primary-600 to-violet-600 text-white',
                'hover:from-primary-700 hover:to-violet-700',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-all duration-200 shadow-lg shadow-primary-500/25',
                'hover:shadow-xl hover:shadow-primary-500/30'
              )}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </form>
      </div>
    </div>
  );
}


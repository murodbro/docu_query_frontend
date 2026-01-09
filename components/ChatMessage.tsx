'use client';

import { User, Bot } from 'lucide-react';
import { type HistoryMessage } from '@/lib/api';
import CitationCard from './CitationCard';
import { formatDate } from '@/lib/utils';

interface ChatMessageProps {
  message: HistoryMessage;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const sources = message.metadata?.sources || [];

  return (
    <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser
            ? 'bg-primary-600 text-white'
            : 'bg-gray-200 text-gray-700'
        }`}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>

      <div className={`flex-1 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`rounded-lg px-4 py-3 max-w-[80%] ${
            isUser
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-900'
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>

        {!isUser && sources.length > 0 && (
          <div className="mt-3 w-full max-w-[80%]">
            <p className="text-xs font-semibold text-gray-500 mb-2">
              Sources ({sources.length}):
            </p>
            <div className="space-y-2">
              {sources.map((citation, index) => (
                <CitationCard key={index} citation={citation} index={index} />
              ))}
            </div>
          </div>
        )}

        <span className="text-xs text-gray-400 mt-1">
          {formatDate(message.timestamp)}
        </span>
      </div>
    </div>
  );
}


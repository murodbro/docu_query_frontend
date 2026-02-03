'use client';

import { useState } from 'react';
import { User, Bot, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import { type HistoryMessage, type Citation } from '@/lib/api';
import ReactMarkdown from 'react-markdown';
import CitationCard from './CitationCard';
import { formatDate } from '@/lib/utils';

interface ChatMessageProps {
  message: HistoryMessage;
  onSourceClick?: (citation: Citation) => void;
}

export default function ChatMessage({ message, onSourceClick }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const sources = message.metadata?.sources || [];
  const [isSourcesExpanded, setIsSourcesExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

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
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <div className="prose prose-sm max-w-none break-words prose-p:leading-relaxed prose-pre:p-0">
              <ReactMarkdown
                components={{
                  a: ({ node, ...props }) => (
                    <a {...props} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline" />
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Actions row for assistant messages */}
        {!isUser && (
          <div className="flex items-center gap-4 mt-2">
            {/* Sources Button */}
            {sources.length > 0 && (
              <button
                onClick={() => setIsSourcesExpanded(!isSourcesExpanded)}
                className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
              >
                {isSourcesExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                <span>Sources ({sources.length})</span>
              </button>
            )}

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              title="Copy response"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-green-500">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Expanded Sources */}
        {!isUser && sources.length > 0 && isSourcesExpanded && (
          <div className="space-y-2 mt-2 w-full max-w-[80%]">
            {sources.map((citation, index) => (
              <CitationCard
                key={index}
                citation={citation}
                index={index}
                onClick={onSourceClick}
              />
            ))}
          </div>
        )}

        <span className="text-xs text-gray-400 mt-1">
          {formatDate(message.timestamp)}
        </span>
      </div>
    </div>
  );
}

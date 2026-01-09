'use client';

import { FileText } from 'lucide-react';
import { type Citation } from '@/lib/api';
import { formatRelevanceScore } from '@/lib/utils';

interface CitationCardProps {
  citation: Citation;
  index: number;
}

export default function CitationCard({ citation, index }: CitationCardProps) {
  const relevanceColor =
    citation.relevance_score > 0.8
      ? 'text-green-600 bg-green-50'
      : citation.relevance_score > 0.6
      ? 'text-yellow-600 bg-yellow-50'
      : 'text-gray-600 bg-gray-50';

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <FileText className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-900">
            {citation.document}
          </span>
          {citation.page && (
            <span className="text-xs text-gray-500">Page {citation.page}</span>
          )}
        </div>
        <span
          className={`text-xs font-semibold px-2 py-1 rounded ${relevanceColor}`}
        >
          {formatRelevanceScore(citation.relevance_score)}
        </span>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed">
        {citation.chunk_text}
      </p>
    </div>
  );
}


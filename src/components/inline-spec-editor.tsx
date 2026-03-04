'use client';

import { useState } from 'react';
import { updateSpecificationDev } from '@/lib/actions';
import { SpecificationSelect } from '@/db/schema';

interface InlineSpecEditorProps {
  specification: SpecificationSelect;
  onSpecUpdated?: (spec: SpecificationSelect) => void;
}

export function InlineSpecEditor({ specification, onSpecUpdated }: InlineSpecEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(specification.content);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      const result = await updateSpecificationDev(specification.id, content);

      if (result.success && result.spec) {
        setIsEditing(false);
        onSpecUpdated?.(result.spec);
      } else {
        setError(result.error || 'Failed to update specification');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setContent(specification.content);
    setError('');
  };

  // Simple markdown rendering
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed.startsWith('# ')) {
        elements.push(
          <h1 key={i} className="text-2xl font-bold text-gray-900 mb-4">
            {trimmed.substring(2)}
          </h1>
        );
      } else if (trimmed.startsWith('## ')) {
        elements.push(
          <h2 key={i} className="text-xl font-semibold text-gray-900 mb-3 mt-6">
            {trimmed.substring(3)}
          </h2>
        );
      } else if (trimmed.startsWith('### ')) {
        elements.push(
          <h3 key={i} className="text-lg font-medium text-gray-900 mb-2 mt-4">
            {trimmed.substring(4)}
          </h3>
        );
      } else if (trimmed.startsWith('- ')) {
        elements.push(
          <li key={i} className="ml-4 mb-1 text-gray-700">
            {trimmed.substring(2)}
          </li>
        );
      } else if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        elements.push(
          <p key={i} className="mb-3">
            <strong className="text-gray-900">{trimmed.substring(2, trimmed.length - 2)}</strong>
          </p>
        );
      } else if (trimmed === '' && lines[i - 1] && lines[i - 1].trim() !== '') {
        elements.push(<br key={i} />);
      } else if (trimmed) {
        elements.push(
          <p key={i} className="mb-3 text-gray-700">
            {trimmed}
          </p>
        );
      }
    }

    return <div className="prose max-w-none">{elements}</div>;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Project Specification (v{specification.version})
        </h3>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
          >
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting || !content.trim()}
              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="px-6 py-3 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {isEditing ? (
          <div className="space-y-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-96 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              placeholder={"# Project Specification\n\n## Overview\n\nDescribe the project goals and requirements..."}
            />
            <p className="text-xs text-gray-500">Markdown syntax supported</p>
          </div>
        ) : (
          <div className="prose prose-gray max-w-none">{renderMarkdown(content)}</div>
        )}
      </div>
    </div>
  );
}

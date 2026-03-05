'use client';

import { useState } from 'react';
import { updateSpecificationDev } from '@/lib/actions';
import { SpecificationSelect } from '@/db/schema';

interface InlineSpecEditorProps {
  specification: SpecificationSelect;
  allSpecs?: SpecificationSelect[];
  onSpecUpdated?: (spec: SpecificationSelect) => void;
}

const iosInputStyle = {
  width: '100%',
  padding: '8px 12px',
  backgroundColor: 'var(--ios-bg-primary)',
  color: 'var(--ios-text-primary)',
  borderColor: 'var(--ios-separator)',
  borderRadius: '8px',
  fontSize: '17px',
  outline: 'none',
  transition: 'box-shadow 0.2s',
};

export function InlineSpecEditor({ specification, allSpecs = [], onSpecUpdated }: InlineSpecEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(specification.content);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [viewingSpecId, setViewingSpecId] = useState<number | null>(null);

  const allVersions = allSpecs.length > 0 ? allSpecs : [specification];
  const currentSpec = viewingSpecId !== null
    ? allVersions.find(s => s.id === viewingSpecId) || specification
    : specification;
  const isViewingHistorical = currentSpec.id !== specification.id;

  const handleSave = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      const result = await updateSpecificationDev(specification.id, content);

      if (result.success && result.spec) {
        setIsEditing(false);
        setViewingSpecId(null);
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
    if (viewingSpecId !== null) {
      setViewingSpecId(null);
    }
  };

  const handleRestoreVersion = (spec: SpecificationSelect) => {
    setContent(spec.content);
    setIsEditing(true);
    setShowHistory(false);
    setViewingSpecId(spec.id);
  };

  const handleViewVersion = (specId: number) => {
    setViewingSpecId(specId);
    setShowHistory(false);
  };

  // Enhanced markdown rendering
  const renderMarkdown = (text: string): JSX.Element => {
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed.startsWith('# ')) {
        elements.push(
          <h1 key={i} className="text-2xl font-bold text-gray-900 mb-4 ios-font-display">
            {trimmed.substring(2)}
          </h1>
        );
      } else if (trimmed.startsWith('## ')) {
        elements.push(
          <h2 key={i} className="text-xl font-semibold text-gray-900 mb-3 mt-6 ios-font-display">
            {trimmed.substring(3)}
          </h2>
        );
      } else if (trimmed.startsWith('### ')) {
        elements.push(
          <h3 key={i} className="text-lg font-medium text-gray-900 mb-2 mt-4 ios-font-display">
            {trimmed.substring(4)}
          </h3>
        );
      } else if (trimmed.startsWith('#### ')) {
        elements.push(
          <h4 key={i} className="text-base font-semibold text-gray-900 mb-2 mt-4 ios-font-display">
            {trimmed.substring(5)}
          </h4>
        );
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        elements.push(
          <li key={i} className="ml-4 mb-1 text-gray-700 ios-body ios-font-text list-disc">
            {trimmed.substring(2)}
          </li>
        );
      } else if (trimmed.match(/^\d+\.\s/)) {
        elements.push(
          <li key={i} className="ml-4 mb-1 text-gray-700 ios-body ios-font-text list-decimal">
            {trimmed.replace(/^\d+\.\s/, '')}
          </li>
        );
      } else if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        elements.push(
          <p key={i} className="mb-3 ios-body ios-font-text">
            <strong className="text-gray-900">{trimmed.substring(2, trimmed.length - 2)}</strong>
          </p>
        );
      } else if (trimmed.startsWith('*') && trimmed.endsWith('*') && !trimmed.startsWith('**')) {
        elements.push(
          <p key={i} className="mb-3 ios-body ios-font-text">
            <em>{trimmed.substring(1, trimmed.length - 1)}</em>
          </p>
        );
      } else if (trimmed.startsWith('> ')) {
        elements.push(
          <blockquote key={i} className="pl-4 border-l-4 border-gray-300 mb-3 italic text-gray-600 ios-body ios-font-text">
            {trimmed.substring(2)}
          </blockquote>
        );
      } else if (trimmed.startsWith('```')) {
        // Code block (simple handling)
        const codeEnd = lines.findIndex((l, idx) => idx > i && l.trim().startsWith('```'));
        const codeLines = codeEnd !== -1 ? lines.slice(i + 1, codeEnd) : lines.slice(i + 1);
        elements.push(
          <pre key={i} className="bg-gray-100 p-4 rounded-lg mb-4 overflow-x-auto ios-font-text">
            <code className="text-sm text-gray-800">{codeLines.join('\n')}</code>
          </pre>
        );
        // Skip ahead
        if (codeEnd !== -1) {
          i = codeEnd;
        }
      } else if (trimmed.match(/`([^`]+)`/)) {
        // Safe inline code rendering without dangerouslySetInnerHTML
        const match = trimmed.match(/`([^`]+)`/);
        if (match) {
          const parts = trimmed.split(match[0]);
          elements.push(
            <p key={i} className="mb-3 ios-body ios-font-text">
              {parts[0]}<code className="bg-gray-100 px-1 rounded text-sm">{match[1]}</code>{parts[1] || ''}
            </p>
          );
        }
      } else if (trimmed === '' && i > 0 && lines[i - 1].trim() !== '' && !lines[i - 1].trim().startsWith('>')) {
        elements.push(<br key={i} />);
      } else if (trimmed) {
        elements.push(
          <p key={i} className="mb-3 text-gray-700 ios-body ios-font-text">
            {trimmed}
          </p>
        );
      }
      i++;
    }

    return <div className="prose prose-gray max-w-none">{elements}</div>;
  };

  return (
    <div className="ios-card shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-ios flex items-center justify-between ios">
        <div className="flex items-center gap-4">
          <h3 className="ios-title-3 text-ios-primary ios-font-display">
            Specification
          </h3>
          {allVersions.length > 1 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-1.5 px-3 py-1.5 ios-body text-ios-blue bg-ios-secondary border border-ios ios-radius ios-font-text transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>v{currentSpec.version}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
          )}
          {isViewingHistorical && (
            <span className="inline-flex items-center gap-1.5 px-2 py-1 ios-caption bg-yellow-50 text-yellow-700 rounded-full ios-font-text">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              Historical View
            </span>
          )}
        </div>
        {!isEditing && !isViewingHistorical ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 ios-body text-white ios-radius ios-font-text transition-colors"
            style={{ backgroundColor: 'var(--ios-blue)' }}
            aria-label="Edit"
          >
            Edit
          </button>
        ) : !isEditing && isViewingHistorical ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 ios-body text-white ios-radius ios-font-text transition-colors"
            style={{ backgroundColor: 'var(--ios-blue)' }}
          >
            Restore & Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-4 py-2 ios-body text-ios-blue bg-ios-secondary border border-ios ios-radius ios-font-text transition-colors disabled:opacity-50"
              aria-label="Cancel"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting || !content.trim()}
              className="px-4 py-2 ios-body text-white ios-radius ios-font-text transition-colors disabled:opacity-50"
              style={{ backgroundColor: 'var(--ios-blue)' }}
              aria-label="Save"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* Version History Dropdown */}
      {showHistory && (
        <div className="px-6 py-3 border-b border-ios bg-ios-secondary">
          <p className="ios-caption text-ios-placeholder mb-2 ios-font-text">
            Version History ({allVersions.length} versions)
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {allVersions.map((spec) => (
              <div
                key={spec.id}
                className={`flex items-center justify-between p-3 rounded-lg ios ${
                  currentSpec.id === spec.id
                    ? 'bg-blue-50 border-2 border-blue-200'
                    : 'bg-white border border-ios hover:border-ios-blue'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="ios-subheadline font-medium text-ios-primary ios-font-text">
                      v{spec.version}
                    </span>
                    {spec.isActive && (
                      <span className="inline-flex items-center px-2 py-0.5 ios-caption bg-green-100 text-green-700 rounded-full ios-font-text">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="ios-caption text-ios-placeholder ios-font-text">
                    {new Date(spec.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewVersion(spec.id)}
                    className="px-3 py-1.5 ios-caption text-ios-blue hover:bg-blue-50 rounded ios-font-text transition-colors"
                  >
                    View
                  </button>
                  {!spec.isActive && spec.id !== specification.id && (
                    <button
                      onClick={() => handleRestoreVersion(spec)}
                      className="px-3 py-1.5 ios-caption text-ios-blue hover:bg-blue-50 rounded ios-font-text transition-colors"
                    >
                      Restore
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-6 py-3 bg-opacity-10 border-l-4 ios"
          style={{ backgroundColor: 'var(--ios-red)', borderColor: 'var(--ios-red)' }}
        >
          <p className="text-sm text-ios-red ios-font-text">{error}</p>
        </div>
      )}

      {/* Content */}
      <div className="px-6 py-4">
        {isEditing ? (
          <div className="space-y-4">
            {isViewingHistorical && (
              <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-600">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                <p className="text-sm text-yellow-800 ios-body ios-font-text">
                  Restoring v{currentSpec.version}. Saving will create a new version.
                </p>
              </div>
            )}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={16}
              className="font-mono text-sm ios-font-text"
              style={iosInputStyle}
              placeholder={"# Project Specification\n\n## Overview\n\nDescribe the project goals and requirements..."}
              spellCheck={false}
            />
            <p className="ios-caption text-ios-placeholder ios-font-text">
              Markdown syntax supported (headers, lists, bold, italic, code blocks, blockquotes)
            </p>
          </div>
        ) : (
          <div>{renderMarkdown(currentSpec.content)}</div>
        )}
      </div>
    </div>
  );
}

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
  backgroundColor: 'var(--bg-bg-primary)',
  color: 'var(--text-text-primary)',
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
          <h1 key={i} className="text-[24px] font-semibold text-ios-primary mb-4 ">
            {trimmed.substring(2)}
          </h1>
        );
      } else if (trimmed.startsWith('## ')) {
        elements.push(
          <h2 key={i} className="text-[20px] font-semibold text-ios-primary mb-3 mt-6 ">
            {trimmed.substring(3)}
          </h2>
        );
      } else if (trimmed.startsWith('### ')) {
        elements.push(
          <h3 key={i} className="text-[16px] font-semibold text-ios-primary mb-2 mt-4 ">
            {trimmed.substring(4)}
          </h3>
        );
      } else if (trimmed.startsWith('#### ')) {
        elements.push(
          <h4 key={i} className="text-[14px] font-semibold text-ios-primary mb-2 mt-4 ">
            {trimmed.substring(5)}
          </h4>
        );
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        elements.push(
          <li key={i} className="ml-4 mb-1 text-[13px]  list-disc">
            {trimmed.substring(2)}
          </li>
        );
      } else if (trimmed.match(/^\d+\.\s/)) {
        elements.push(
          <li key={i} className="ml-4 mb-1 text-[13px]  list-decimal">
            {trimmed.replace(/^\d+\.\s/, '')}
          </li>
        );
      } else if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        elements.push(
          <p key={i} className="mb-3 text-[13px] ">
            <strong className="text-text-primary">{trimmed.substring(2, trimmed.length - 2)}</strong>
          </p>
        );
      } else if (trimmed.startsWith('*') && trimmed.endsWith('*') && !trimmed.startsWith('**')) {
        elements.push(
          <p key={i} className="mb-3 text-[13px] ">
            <em>{trimmed.substring(1, trimmed.length - 1)}</em>
          </p>
        );
      } else if (trimmed.startsWith('> ')) {
        elements.push(
          <blockquote key={i} className="pl-4 border-l-4 border-ios-separator mb-3 italic text-[13px] ">
            {trimmed.substring(2)}
          </blockquote>
        );
      } else if (trimmed.startsWith('```')) {
        // Code block (simple handling)
        const codeEnd = lines.findIndex((l, idx) => idx > i && l.trim().startsWith('```'));
        const codeLines = codeEnd !== -1 ? lines.slice(i + 1, codeEnd) : lines.slice(i + 1);
        elements.push(
          <pre key={i} className="bg-bg-secondary p-4 rounded-ios-lg mb-4 overflow-x-auto ">
            <code className="text-[11px] text-text-tertiary text-text-primary">{codeLines.join('\n')}</code>
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
            <p key={i} className="mb-3 text-[13px] ">
              {parts[0]}<code className="bg-bg-secondary px-1 rounded-ios-md text-[11px] text-text-tertiary">{match[1]}</code>{parts[1] || ''}
            </p>
          );
        }
      } else if (trimmed === '' && i > 0 && lines[i - 1].trim() !== '' && !lines[i - 1].trim().startsWith('>')) {
        elements.push(<br key={i} />);
      } else if (trimmed) {
        elements.push(
          <p key={i} className="mb-3 text-[13px] ">
            {trimmed}
          </p>
        );
      }
      i++;
    }

    return <div className="prose prose-gray max-w-none">{elements}</div>;
  };

  return (
    <div className="bg-bg-elevated border border-border-default rounded-[8px] shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-ios flex items-center justify-between ios">
        <div className="flex items-center gap-4">
          <h3 className="text-[16px] font-semibold text-ios-primary ">
            Specification
          </h3>
          {allVersions.length > 1 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-accent bg-ios-secondary border border-ios rounded-[8px]  transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>v{currentSpec.version}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          )}
          {isViewingHistorical && (
            <span className="inline-flex items-center gap-1.5 px-2 py-1 ios-caption bg-yellow-50 text-yellow-700 rounded-ios-xl ">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Historical View
            </span>
          )}
        </div>
        {!isEditing && !isViewingHistorical ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 text-[13px] text-white rounded-[8px]  transition-colors"
            style={{ backgroundColor: 'var(--accent)' }}
            aria-label="Edit"
          >
            Edit
          </button>
        ) : !isEditing && isViewingHistorical ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 text-[13px] text-white rounded-[8px]  transition-colors"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            Restore & Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-4 py-2 text-[13px] text-accent bg-ios-secondary border border-ios rounded-[8px]  transition-colors disabled:opacity-50"
              aria-label="Cancel"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting || !content.trim()}
              className="px-4 py-2 text-[13px] text-white rounded-[8px]  transition-colors disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent)' }}
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
          <p className="ios-caption text-text-tertiary mb-2 ">
            Version History ({allVersions.length} versions)
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {allVersions.map((spec) => (
              <div
                key={spec.id}
                className={`flex items-center justify-between p-3 rounded-ios-lg ios ${currentSpec.id === spec.id
                  ? 'bg-bg-elevated border border-border-default rounded-[8px] border-2 border-accent'
                  : 'bg-bg-elevated border border-border-default hover:border-accent'
                  }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-medium text-ios-primary ">
                      v{spec.version}
                    </span>
                    {spec.isActive && (
                      <span className="inline-flex items-center px-2 py-0.5 ios-caption bg-green-100 text-green-700 rounded-ios-xl ">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="ios-caption text-text-tertiary ">
                    {new Date(spec.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewVersion(spec.id)}
                    className="px-3 py-1.5 ios-caption text-accent hover:bg-blue-50 rounded  transition-colors"
                  >
                    View
                  </button>
                  {!spec.isActive && spec.id !== specification.id && (
                    <button
                      onClick={() => handleRestoreVersion(spec)}
                      className="px-3 py-1.5 ios-caption text-accent hover:bg-blue-50 rounded  transition-colors"
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
          style={{ backgroundColor: 'var(--status-error)', borderColor: 'var(--status-error)' }}
        >
          <p className="text-[11px] text-text-tertiary text-status-error ">{error}</p>
        </div>
      )}

      {/* Content */}
      <div className="px-6 py-4">
        {isEditing ? (
          <div className="space-y-4">
            {isViewingHistorical && (
              <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-600">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <p className="text-[11px] text-text-tertiary text-yellow-800 text-[13px] ">
                  Restoring v{currentSpec.version}. Saving will create a new version.
                </p>
              </div>
            )}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={16}
              className="font-mono text-[11px] text-text-tertiary "
              style={iosInputStyle}
              placeholder={"# Project Specification\n\n## Overview\n\nDescribe the project goals and requirements..."}
              spellCheck={false}
            />
            <p className="ios-caption text-text-tertiary ">
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

import MDEditor from '@uiw/react-md-editor';

interface SpecificationViewerProps {
  content: string;
}

export function SpecificationViewer({ content }: SpecificationViewerProps) {
  if (!content) {
    return (
      <div className="text-center py-8 text-text-secondary">
        <p>No specification provided yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Specification</h3>
      <div data-color-mode="light">
        <MDEditor.Markdown source={content} style={{ backgroundColor: 'transparent', color: 'var(--text-text-primary)' }} />
      </div>
    </div>
  );
}

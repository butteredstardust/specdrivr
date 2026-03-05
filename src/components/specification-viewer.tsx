interface SpecificationViewerProps {
  content: string;
}

export function SpecificationViewer({ content }: SpecificationViewerProps) {
  // Simple markdown-like rendering for now
  // In a real app, use react-markdown or similar

  const renderContent = () => {
    if (!content) {
      return (
        <div className="text-center py-8 ios-text-secondary">
          <p>No specification provided yet</p>
        </div>
      );
    }

    // Basic markdown parsing
    const lines = content.split('\n');
    const elements: JSX.Element[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed.startsWith('# ')) {
        elements.push(
          <h1 key={i} className="ios-title-1 text-ios-primary mb-4">
            {trimmed.substring(2)}
          </h1>
        );
      } else if (trimmed.startsWith('## ')) {
        elements.push(
          <h2 key={i} className="ios-title-2 text-ios-primary mb-3 mt-6">
            {trimmed.substring(3)}
          </h2>
        );
      } else if (trimmed.startsWith('### ')) {
        elements.push(
          <h3 key={i} className="ios-title-3 text-ios-primary mb-2 mt-4">
            {trimmed.substring(4)}
          </h3>
        );
      } else if (trimmed.startsWith('- ')) {
        elements.push(
          <li key={i} className="ml-4 mb-1 ios-text-secondary">
            {trimmed.substring(2)}
          </li>
        );
      } else if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        elements.push(
          <p key={i} className="mb-3">
            <strong className="ios-text-primary">
              {trimmed.substring(2, trimmed.length - 2)}
            </strong>
          </p>
        );
      } else if (trimmed === '' && lines[i - 1] && lines[i - 1].trim() !== '') {
        elements.push(<br key={i} />);
      } else if (trimmed) {
        elements.push(
          <p key={i} className="mb-3 ios-text-secondary">
            {trimmed}
          </p>
        );
      }
    }

    return <div className="prose max-w-none">{elements}</div>;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Specification</h3>
      <div className="prose prose-gray max-w-none">{renderContent()}</div>
    </div>
  );
}

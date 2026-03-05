import { render, screen } from '@testing-library/react';
import { ProjectSidebar } from '@/components/project-sidebar';
import '@testing-library/jest-dom';
import { describe, test, expect, vi } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

// Mock DatabaseStatus
vi.mock('./database-status', () => ({
  DatabaseStatus: () => <div data-testid="db-status">DB OK</div>,
}));

// Mock UserMenu
vi.mock('./user-menu', () => ({
  UserMenu: () => <div data-testid="user-menu">User</div>,
}));

// Mock create-project-dialog
vi.mock('./create-project-dialog', () => ({
  CreateProjectDialog: () => <button>New Project</button>,
}));

const mockProjects = [
  { id: 1, name: 'Spec-Drivr' },
  { id: 2, name: 'Website Redesign' },
];

describe('ProjectSidebar', () => {
  test('renders sidebar with logo/branding', () => {
    render(<ProjectSidebar projects={mockProjects as any} />);
    expect(screen.getByText('specdrivr')).toBeInTheDocument();
  });

  test('renders home and settings links', () => {
    render(<ProjectSidebar projects={mockProjects as any} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  test('shows "Projects" section label', () => {
    render(<ProjectSidebar projects={mockProjects as any} />);
    expect(screen.getByText('Projects')).toBeInTheDocument();
  });

  test('shows all project names in list', () => {
    render(<ProjectSidebar projects={mockProjects as any} />);
    expect(screen.getByText('Spec-Drivr')).toBeInTheDocument();
    expect(screen.getByText('Website Redesign')).toBeInTheDocument();
  });

  test('renders project links with correct hrefs', () => {
    render(<ProjectSidebar projects={mockProjects as any} />);
    const links = screen.getAllByRole('link');
    const project1Link = links.find(l => l.getAttribute('href') === '/projects/1');
    expect(project1Link).toBeDefined();
  });
});

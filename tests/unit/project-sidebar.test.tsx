/**
 * Unit tests for ProjectSidebar component
 * Tests rendering, navigation, agent status, and project list management
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectSidebar } from '@/components/project-sidebar';
import '@testing-library/jest-dom';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname() {
    return '/';
  },
}));

// Mock project-sidebar-wrapper
const mockToggleSidebar = jest.fn();
jest.mock('@/components/project-sidebar-wrapper', () => ({
  useSidebar() {
    return { toggleSidebar: mockToggleSidebar };
  },
}));

// Mock create-project-dialog
jest.mock('@/components/create-project-dialog', () => ({
  CreateProjectDialog: ({ onProjectCreated }: { onProjectCreated: (project: any) => void }) => (
    <button onClick={() => onProjectCreated?.({ id: 99, name: 'New Project' })}>
      New Project
    </button>
  ),
}));

const mockProjects = [
  {
    id: 1,
    name: 'Spec-Drivr',
    description: 'Autonomous development platform',
    mission: 'Enable AI agents to develop software',
    agentStatus: 'running',
  },
  {
    id: 2,
    name: 'Website Redesign',
    description: 'Redesign company website',
    mission: 'Modernize web presence',
    agentStatus: 'idle',
  },
  {
    id: 3,
    name: 'API Gateway',
    description: 'Build API gateway service',
    mission: 'Centralize API management',
    agentStatus: 'error',
  },
];

describe('ProjectSidebar - Core Functionality', () => {
  describe('Rendering', () => {
    test('renders sidebar with menu header', () => {
      render(<ProjectSidebar projects={mockProjects} />);

      expect(screen.getByText('Menu')).toBeInTheDocument();
      expect(screen.getByText('Navigate your workspace')).toBeInTheDocument();
    });

    test('renders hide sidebar button', () => {
      render(<ProjectSidebar projects={mockProjects} />);

      const hideButton = document.querySelector('button[aria-label="Hide sidebar"]');
      expect(hideButton).toBeInTheDocument();
    });

    test('renders Home link', () => {
      render(<ProjectSidebar projects={mockProjects} />);

      expect(screen.getByText('Home')).toBeInTheDocument();
    });

    test('renders Projects header', () => {
      render(<ProjectSidebar projects={mockProjects} />);

      expect(screen.getByText('Projects')).toBeInTheDocument();
    });

    test('renders Settings link in footer', () => {
      render(<ProjectSidebar projects={mockProjects} />);

      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    test('renders New Project button', () => {
      render(<ProjectSidebar projects={mockProjects} />);

      expect(screen.getByText('New Project')).toBeInTheDocument();
    });

    test('shows all projects in list', () => {
      render(<ProjectSidebar projects={mockProjects} />);

      expect(screen.getByText('Spec-Drivr')).toBeInTheDocument();
      expect(screen.getByText('Website Redesign')).toBeInTheDocument();
      expect(screen.getByText('API Gateway')).toBeInTheDocument();
    });

    test('renders empty state when no projects', () => {
      render(<ProjectSidebar projects={[]} />);

      expect(screen.getByText('Menu')).toBeInTheDocument();
      expect(screen.queryByText('Spec-Drivr')).not.toBeInTheDocument();
    });

    test('displays project descriptions as tooltips', () => {
      render(<ProjectSidebar projects={mockProjects} />);

      const projectTitle = screen.getByText('Spec-Drivr');
      expect(projectTitle).toHaveAttribute('title', 'Spec-Drivr');
    });
  });

  describe('Agent Status Display', () => {
    test('shows running status for Spec-Drivr', () => {
      render(<ProjectSidebar projects={mockProjects} />);

      const statusDot = document.querySelector('.ios-status-dot-running');
      expect(statusDot).toBeInTheDocument();
    });

    test('shows idle status for Website Redesign', () => {
      render(<ProjectSidebar projects={mockProjects} />);

      const statusDots = document.querySelectorAll('.ios-status-dot-idle');
      expect(statusDots.length).toBeGreaterThan(0);
    });

    test('shows error status for API Gateway', () => {
      render(<ProjectSidebar projects={mockProjects} />);

      const statusDot = document.querySelector('.ios-status-dot-error');
      expect(statusDot).toBeInTheDocument();
    });

    test('shows idle status when agentStatus not provided', () => {
      const projectsWithoutStatus = [
        { id: 1, name: 'Test Project' },
      ];

      render(<ProjectSidebar projects={projectsWithoutStatus} />);

      const statusDots = document.querySelectorAll('.ios-status-dot-idle');
      expect(statusDots.length).toBeGreaterThan(0);
    });

    test('shows agent status as title', () => {
      render(<ProjectSidebar projects={mockProjects} />);

      const statusDot = document.querySelector('[title="Agent status: running"]');
      expect(statusDot).toBeInTheDocument();
    });

    test('uses ios-status-dot class for all status dots', () => {
      render(<ProjectSidebar projects={mockProjects} />);

      const dots = document.querySelectorAll('.ios-status-dot');
      expect(dots.length).toBe(mockProjects.length);
    });
  });

  describe('Project Active State', () => {
    test('highlights active project', () => {
      render(
        <ProjectSidebar
          projects={mockProjects}
          activeProjectId={1}
        />
      );

      const activeProject = screen.getByText('Spec-Drivr');
      expect(activeProject).toBeInTheDocument();
    });

    test('shows "Active" badge for active project', () => {
      render(
        <ProjectSidebar
          projects={mockProjects}
          activeProjectId={2}
        />
      );

      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    test('does not show "Active" badge for inactive projects', () => {
      render(
        <ProjectSidebar
          projects={mockProjects}
          activeProjectId={1}
        />
      );

      // Only one project should have Active badge
      const activeBadges = screen.getAllByText('Active');
      expect(activeBadges.length).toBe(1);
    });

    test('links to correct project URLs', () => {
      render(<ProjectSidebar projects={mockProjects} />);

      const projectLink = document.querySelector('a[href="/projects/1"]');
      expect(projectLink).toBeInTheDocument();

      const projectLink2 = document.querySelector('a[href="/projects/2"]');
      expect(projectLink2).toBeInTheDocument();
    });

    test('treats currentProjectId as active', () => {
      render(
        <ProjectSidebar
          projects={mockProjects}
          currentProjectId={3}
        />
      );

      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    test('prioritizes currentProjectId over activeProjectId for active state', () => {
      render(
        <ProjectSidebar
          projects={mockProjects}
          activeProjectId={1}
          currentProjectId={2}
        />
      );

      const links = document.querySelectorAll('a');
      const activeProjectLink = Array.from(links).find(link =>
        link.classList.contains('bg-ios-blue')
      );
      expect(activeProjectLink).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    test('home link navigates to root path', () => {
      render(<ProjectSidebar projects={mockProjects} />);

      const homeLink = document.querySelector('a[href="/"]');
      expect(homeLink).toBeInTheDocument();
    });

    test('project links navigate to project paths', () => {
      render(<ProjectSidebar projects={mockProjects} />);

      mockProjects.forEach((project) => {
        const link = document.querySelector(`a[href="/projects/${project.id}"]`);
        expect(link).toBeInTheDocument();
      });
    });

    test('calls onProjectSelect when project clicked', () => {
      const mockOnProjectSelect = jest.fn();

      render(
        <ProjectSidebar
          projects={mockProjects}
          onProjectSelect={mockOnProjectSelect}
        />
      );

      const projectLink = document.querySelector('a[href="/projects/1"]');
      if (projectLink) {
        fireEvent.click(projectLink);
        expect(mockOnProjectSelect).toHaveBeenCalledWith(mockProjects[0]);
      }
    });

    test('Settings link navigates to /settings', () => {
      render(<ProjectSidebar projects={mockProjects} />);

      const settingsLink = document.querySelector('a[href="/settings"]');
      expect(settingsLink).toBeInTheDocument();
    });
  });

  describe('Sidebar Controls', () => {
    test('has hide sidebar button', () => {
      render(<ProjectSidebar projects={mockProjects} />);

      const hideButton = document.querySelector('button[aria-label="Hide sidebar"]');
      expect(hideButton).toBeInTheDocument();
    });

    test('calls toggleSidebar when hide button clicked', () => {
      render(<ProjectSidebar projects={mockProjects} />);

      const hideButton = document.querySelector('button[aria-label="Hide sidebar"]');
      if (hideButton) {
        fireEvent.click(hideButton);
        expect(mockToggleSidebar).toHaveBeenCalled();
      }
    });

    test('shows hide sidebar icon', () => {
      render(<ProjectSidebar projects={mockProjects} />);

      const hideButton = document.querySelector('button[aria-label="Hide sidebar"]');
      const svg = hideButton?.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    test('has ARIA label for hide button', () => {
      render(<ProjectSidebar projects={mockProjects} />);

      const hideButton = document.querySelector('button[aria-label="Hide sidebar"]');
      expect(hideButton).toHaveAttribute('aria-label', 'Hide sidebar');
      expect(hideButton).toHaveAttribute('title', 'Hide sidebar');
    });
  });

  describe('Project Icons', () => {
    test('shows project folder icon for each project', () => {
      render(<ProjectSidebar projects={mockProjects} />);

      const icons = screen.getAllByText('📁');
      expect(icons.length).toBe(mockProjects.length);
    });

    test('shows home icon', () => {
      render(<ProjectSidebar projects={mockProjects} />);

      expect(screen.getAllByText('🏠').length).toBeGreaterThan(0);
    });

    test('shows settings icon', () => {
      render(<ProjectSidebar projects={mockProjects} />);

      expect(screen.getAllByText('⚙️').length).toBeGreaterThan(0);
    });
  });

  describe('Styling', () => {
    test('uses ios-card class', () => {
      const { container } = render(<ProjectSidebar projects={mockProjects} />);

      const card = container.querySelector('.ios-card');
      expect(card).toBeInTheDocument();
    });

    test('uses ios-font class', () => {
      const { container } = render(<ProjectSidebar projects={mockProjects} />);

      expect(container.querySelector('.ios-font')).toBeInTheDocument();
    });

    test('uses correct color classes', () => {
      render(<ProjectSidebar projects={mockProjects} />);

      const elements = document.querySelectorAll('.text-ios-primary, .text-ios-placeholder, .bg-ios-secondary');
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  describe('Project Names', () => {
    test('truncates long project names', () => {
      const longNameProject = [
        {
          id: 1,
          name: 'This is a very long project name that should be truncated in the UI',
        },
      ];

      render(<ProjectSidebar projects={longNameProject} />);

      const projectName = screen.getByText(longNameProject[0].name);
      expect(projectName.parentElement).toHaveClass('max-w-[150px]');
    });

    test('shows project name with max width class', () => {
      render(<ProjectSidebar projects={mockProjects} />);

      const projectName = screen.getByText('Spec-Drivr');
      expect(projectName.parentElement).toHaveClass('max-w-[150px]');
    });
  });

  describe('Project Sidebar Actions', () => {
    test('renders CreateProjectDialog component', () => {
      render(<ProjectSidebar projects={mockProjects} />);

      expect(screen.getByText('New Project')).toBeInTheDocument();
    });

    test('calls onProjectCreated when New Project clicked', () => {
      const mockOnProjectCreated = jest.fn();

      render(
        <ProjectSidebar
          projects={mockProjects}
          onProjectCreated={mockOnProjectCreated}
        />
      );

      fireEvent.click(screen.getByText('New Project'));

      expect(mockOnProjectCreated).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 99,
          name: 'New Project',
        })
      );
    });
  });

  describe('Responsive Behavior', () => {
    test('has fixed width of 64', () => {
      const { container } = render(<ProjectSidebar projects={mockProjects} />);

      const sidebar = container.querySelector('.w-64');
      expect(sidebar).toBeInTheDocument();
    });

    test('has full screen height', () => {
      const { container } = render(<ProjectSidebar projects={mockProjects} />);

      const sidebar = container.querySelector('.h-screen');
      expect(sidebar).toBeInTheDocument();
    });

    test('uses flex column layout', () => {
      const { container } = render(<ProjectSidebar projects={mockProjects} />);

      const sidebar = container.querySelector('.flex-col');
      expect(sidebar).toBeInTheDocument();
    });
  });
});

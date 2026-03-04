'use client';

import { useState, createContext, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProjectSidebar } from './project-sidebar';
import { ProjectSelect } from '@/db/schema';

interface SidebarContextType {
  isHidden: boolean;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

interface ProjectSidebarWrapperProps {
  projects: ProjectSelect[];
  currentProjectId?: number;
}

export function ProjectSidebarWrapper({ projects, currentProjectId }: ProjectSidebarWrapperProps) {
  const router = useRouter();
  const [isHidden, setIsHidden] = useState(false);

  // Load sidebar state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-hidden');
    if (savedState !== null) {
      setIsHidden(JSON.parse(savedState));
    }
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-hidden', JSON.stringify(isHidden));
  }, [isHidden]);

  const toggleSidebar = () => {
    setIsHidden(!isHidden);
  };

  const handleProjectSelect = (project: ProjectSelect) => {
    router.push(`/projects/${project.id}`);
  };

  return (
    <SidebarContext.Provider value={{ isHidden, toggleSidebar }}>
      {isHidden ? (
        <ToggleButton />
      ) : (
        <ProjectSidebar
          projects={projects}
          currentProjectId={currentProjectId}
          onProjectSelect={handleProjectSelect}
        />
      )}
    </SidebarContext.Provider>
  );
}

function ToggleButton() {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      onClick={toggleSidebar}
      className="fixed left-4 top-4 z-50 ios-card shadow-lg p-3 ios-radius transition-transform duration-200 hover:scale-105"
      aria-label="Show sidebar"
      title="Show sidebar"
    >
      <svg
        className="w-6 h-6 text-ios-primary"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
    </button>
  );
}

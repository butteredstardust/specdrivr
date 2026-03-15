'use client'

import { createContext, useContext, useState } from 'react'

interface TaskDrawerContextValue {
  openDrawer: (taskId: number) => void
  closeDrawer: () => void
  activeTaskId: number | null
}

const TaskDrawerContext = createContext<TaskDrawerContextValue | null>(null)

export function TaskDrawerProvider({ children }: { children: React.ReactNode }) {
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null)

  const openDrawer = (taskId: number) => setActiveTaskId(taskId)
  const closeDrawer = () => setActiveTaskId(null)

  return (
    <TaskDrawerContext.Provider value={{ openDrawer, closeDrawer, activeTaskId }}>
      {children}
    </TaskDrawerContext.Provider>
  )
}

export function useTaskDrawer(): TaskDrawerContextValue {
  const ctx = useContext(TaskDrawerContext)
  if (!ctx) throw new Error('useTaskDrawer must be used within TaskDrawerProvider')
  return ctx
}

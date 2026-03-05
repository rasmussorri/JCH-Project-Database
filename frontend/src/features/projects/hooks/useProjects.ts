import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Project, CreateProjectPayload } from '../types';
import * as projectService from '../services/projectService';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [filteredCategory, setFilteredCategory] = useState('All');
  const [filteredStatus, setFilteredStatus] = useState('All');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const fetched = await projectService.fetchProjects();
      setProjects(fetched);
      setSelectedProject((prev) =>
        prev ? fetched.find((p) => p.id === prev.id) ?? null : null,
      );
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      setLoadError('Failed to load projects. Please refresh.');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const filteredProjects = useMemo(
    () =>
      projects.filter((project) => {
        const matchesCategory =
          filteredCategory === 'All' || project.category === filteredCategory;
        const matchesStatus =
          filteredStatus === 'All' || project.status === filteredStatus;
        return matchesCategory && matchesStatus;
      }),
    [projects, filteredCategory, filteredStatus],
  );

  const handleCreateProject = useCallback(
    async (payload: CreateProjectPayload) => {
      await projectService.createProject(payload);
      await fetchProjects();
      setFilteredCategory('All');
      setFilteredStatus('All');
    },
    [fetchProjects],
  );

  const handleDeleteProject = useCallback(
    async (projectId: string, password: string): Promise<boolean> => {
      try {
        await projectService.deleteProject(projectId, password);
        await fetchProjects();
        if (selectedProject?.id === projectId) {
          setSelectedProject(null);
        }
        return true;
      } catch (err) {
        console.error('Failed to delete project:', err);
        return false;
      }
    },
    [fetchProjects, selectedProject?.id],
  );

  const categories = useMemo(
    () => [...new Set(projects.map((project) => project.category))],
    [projects],
  );

  return {
    projects,
    selectedProject,
    setSelectedProject,
    filteredCategory,
    setFilteredCategory,
    filteredStatus,
    setFilteredStatus,
    filteredProjects,
    loading,
    loadError,
    categories,
    handleCreateProject,
    handleDeleteProject,
  };
}

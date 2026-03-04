import { useCallback, useEffect, useMemo, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { ProjectGrid } from "./components/ProjectGrid";
import { ProjectDetail } from "./components/ProjectDetail";
import { FilterBar } from "./components/FilterBar";
import { AddProjectDialog } from "./components/AddProjectDialog";
import { UploadPage } from "./components/UploadPage";
import type { CreateProjectPayload, Project } from "./types/project";
import { supabase } from "./lib/supabaseClient";

const JHC_BACKGROUND =
  "https://lut.pictures.fi/kuvat/LUT%20Press%20Images/Facilities/JHC%20-%20J.%20Hyneman%20Center/Working%20in%20JHC/8977-jhc-protos.jpg?img=img4k";

type SupabaseProject = {
  id: string;
  title: string;
  description: string | null;
  description_html: string | null;
  category: string | null;
  status: Project["status"] | null;
  started_at: string | null;
  created_at: string | null;
  project_members?: Array<{ name: string | null; initials: string | null }>;
  project_tech?: Array<{ tech: string | null }>;
  project_images?: Array<{ storage_path: string; created_at: string | null }>;
};

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] =
    useState<Project | null>(null);
  const [filteredCategory, setFilteredCategory] =
    useState<string>("All");
  const [filteredStatus, setFilteredStatus] =
    useState<string>("All");
  const [showHeader, setShowHeader] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setShowHeader(window.scrollY < 10);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });
    return () =>
      window.removeEventListener("scroll", handleScroll);
  }, []);

  const mapProject = useCallback((row: SupabaseProject): Project => {
    const imageUrls = (row.project_images ?? [])
      .slice()
      .sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return aTime - bTime;
      })
      .map((image) =>
        supabase.storage
          .from("project-images")
          .getPublicUrl(image.storage_path).data.publicUrl,
      );

    return {
      id: row.id,
      title: row.title,
      description: row.description ?? "",
      description_html: row.description_html ?? undefined,
      category: row.category ?? "Uncategorized",
      status: row.status ?? "In Progress",
      startDate:
        row.started_at ??
        row.created_at ??
        new Date().toISOString(),
      team: (row.project_members ?? [])
        .map((member) => member.name ?? "")
        .filter(Boolean),
      technologies: (row.project_tech ?? [])
        .map((item) => item.tech ?? "")
        .filter(Boolean),
      imageUrl: imageUrls[0],
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
    };
  }, []);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    const { data, error } = await supabase
      .from("projects")
      .select(`
        id,title,description,description_html,category,status,started_at,created_at,
        project_members(name,initials),
        project_tech(tech),
        project_images(storage_path,created_at)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch projects:", error);
      setLoadError("Failed to load projects. Please refresh.");
      setProjects([]);
      setLoading(false);
      return;
    }

    const mapped = (data as SupabaseProject[]).map(mapProject);
    setProjects(mapped);
    setSelectedProject((prev) =>
      prev ? mapped.find((item) => item.id === prev.id) ?? null : null,
    );
    setLoading(false);
  }, [mapProject]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const filteredProjects = useMemo(
    () =>
      projects.filter((project) => {
        const matchesCategory =
          filteredCategory === "All" ||
          project.category === filteredCategory;
        const matchesStatus =
          filteredStatus === "All" ||
          project.status === filteredStatus;
        return matchesCategory && matchesStatus;
      }),
    [projects, filteredCategory, filteredStatus],
  );

  const handleCreateProject = async (payload: CreateProjectPayload) => {
    const { error } = await supabase.functions.invoke("create-project", {
      body: payload,
    });

    if (error) {
      throw error;
    }

    await fetchProjects();
    setFilteredCategory("All");
    setFilteredStatus("All");
  };

  const handleDeleteProject = async (
    projectId: string,
    password: string,
  ): Promise<boolean> => {
    const { error } = await supabase.functions.invoke("delete-project", {
      body: { projectId, password },
    });

    if (error) {
      console.error("Failed to delete project:", error);
      return false;
    }

    await fetchProjects();
    if (selectedProject?.id === projectId) {
      setSelectedProject(null);
    }
    return true;
  };

  const categories = useMemo(
    () => [...new Set(projects.map((project) => project.category))],
    [projects],
  );

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="min-h-screen bg-slate-950 relative">
            {/* Header with JHC Banner */}
            <header
              className={`relative border-b border-slate-800 sticky top-0 z-10 shadow-xl overflow-hidden transition-transform duration-300 ${showHeader ? "translate-y-0" : "-translate-y-full"}`}
            >
              {/* JHC Background Image */}
              <img
                src={JHC_BACKGROUND}
                alt="JHC Laboratory"
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Dark Overlay */}
              <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" />

              {/* Header Content: black box with green stripe */}
              <div className="max-w-[1800px] mx-auto px-12 py-8 relative z-10">
                <div className="flex bg-black border-0 overflow-hidden rounded-sm shadow-2xl w-fit max-w-full">
                  {/* Green accent stripe */}
                  <div
                    className="w-2 shrink-0"
                    style={{ backgroundColor: "#009933" }}
                    aria-hidden
                  />
                  <div className="py-6 pl-6 pr-8">
                    <h1 className="text-white text-xl sm:text-2xl font-bold tracking-tight uppercase">
                      JHC Protolab Project Database
                    </h1>
                  </div>
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="max-w-[1800px] mx-auto px-12 py-6">
              {loadError && (
                <div className="mb-6 rounded-lg border border-red-800 bg-red-900/20 p-4 text-sm text-red-400">
                  {loadError}
                </div>
              )}

              <FilterBar
                selectedCategory={filteredCategory}
                selectedStatus={filteredStatus}
                onCategoryChange={setFilteredCategory}
                onStatusChange={setFilteredStatus}
                projects={projects}
                addProjectSlot={
                  <AddProjectDialog
                    onCreate={handleCreateProject}
                    existingCategories={categories}
                  />
                }
              />

              {loading ? (
                <div className="text-center py-20">
                  <p className="text-slate-500">Loading projects...</p>
                </div>
              ) : (
                <>
                  <ProjectGrid
                    projects={filteredProjects}
                    onProjectClick={setSelectedProject}
                  />

                  {filteredProjects.length === 0 && (
                    <div className="text-center py-20">
                      <p className="text-slate-500">
                        No projects match the current filters
                      </p>
                    </div>
                  )}
                </>
              )}
            </main>

            {/* Footer */}
            <footer className="max-w-[1800px] mx-auto px-12 py-8 mt-6 border-t border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-6 text-sm text-slate-400">
                <div className="flex flex-wrap items-center gap-6">
                  <a
                    href="https://www.lut.fi/en/protolab-j-hyneman-center"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-slate-200 transition-colors"
                  >
                    Protolab J. Hyneman Center
                  </a>
                  <a href="mailto:jhc@lut.fi" className="hover:text-slate-200 transition-colors">
                    jhc@lut.fi
                  </a>
                </div>
              </div>
            </footer>

            {/* Project Detail Dialog */}
            <ProjectDetail
              project={selectedProject}
              onClose={() => setSelectedProject(null)}
              onDelete={handleDeleteProject}
            />
          </div>
        }
      />
      <Route path="/upload/:token" element={<UploadPage />} />
    </Routes>
  );
}
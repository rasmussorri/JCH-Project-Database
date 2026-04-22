import { useCallback, useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { ApiStatusProvider } from "../contexts/ApiStatusContext";
import { useApiStatus } from "../contexts/useApiStatus";
import { ProjectGrid } from "../features/projects/components/ProjectGrid";
import { ProjectDetail } from "../features/projects/components/ProjectDetail";
import { FilterBar } from "../features/projects/components/FilterBar";
import { AddProjectDialog } from "../features/projects/components/AddProjectDialog";
import { CreateFromPhoneDialog } from "../features/projects/components/CreateFromPhoneDialog";
import { UploadPage } from "../features/uploads/components/UploadPage";
import { MobileCreatePage } from "../features/create/components/MobileCreatePage";
import { useProjects } from "../features/projects/hooks/useProjects";
import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../ui/button";
import { Info, X } from "lucide-react";
import { getRuntimeProfile } from "../lib/runtimeProfile";
import { IdleOverlay } from "../components/IdleOverlay";

const JHC_BACKGROUND =
  "https://lut.pictures.fi/kuvat/LUT%20Press%20Images/Facilities/JHC%20-%20J.%20Hyneman%20Center/Working%20in%20JHC/8977-jhc-protos.jpg?img=img4k";

export default function App() {
  const {
    filteredProjects,
    selectedProject,
    setSelectedProject,
    filteredCategory,
    setFilteredCategory,
    filteredStatus,
    setFilteredStatus,
    loading,
    loadError,
    projects,
    categories,
    handleCreateProject,
    handleUpdateProject,
    handleDeleteProject,
    fetchProjects,
  } = useProjects();

  const [showDesktopFallback, setShowDesktopFallback] = useState(false);
  const [isCompatibilityMode, setIsCompatibilityMode] = useState(false);

  useEffect(() => {
    const profile = getRuntimeProfile();
    setIsCompatibilityMode(profile.isCompatibilityMode);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("compat-mode", isCompatibilityMode);
    return () => {
      document.documentElement.classList.remove("compat-mode");
    };
  }, [isCompatibilityMode]);

  const handlePhoneProjectCreated = useCallback(async () => {
    await fetchProjects();
    setFilteredCategory("All");
    setFilteredStatus("All");
  }, [fetchProjects, setFilteredCategory, setFilteredStatus]);

  return (
    <ApiStatusProvider>
      <Routes>
        <Route
          path="/"
          element={
            <HomeWithBanner
              loadError={loadError}
              filteredProjects={filteredProjects}
              setSelectedProject={setSelectedProject}
              filteredCategory={filteredCategory}
              setFilteredCategory={setFilteredCategory}
              filteredStatus={filteredStatus}
              setFilteredStatus={setFilteredStatus}
              projects={projects}
              categories={categories}
              loading={loading}
              handleCreateProject={handleCreateProject}
              handleUpdateProject={handleUpdateProject}
              handleDeleteProject={handleDeleteProject}
              fetchProjects={fetchProjects}
              showDesktopFallback={showDesktopFallback}
              setShowDesktopFallback={setShowDesktopFallback}
              handlePhoneProjectCreated={handlePhoneProjectCreated}
              selectedProject={selectedProject}
              isCompatibilityMode={isCompatibilityMode}
            />
          }
        />
        <Route path="/upload/:token" element={<UploadPage />} />
        <Route path="/create/:token" element={<MobileCreatePage />} />
      </Routes>
    </ApiStatusProvider>
  );
}

function HomeWithBanner({
  loadError,
  filteredProjects,
  setSelectedProject,
  filteredCategory,
  setFilteredCategory,
  filteredStatus,
  setFilteredStatus,
  projects,
  categories,
  loading,
  handleCreateProject,
  handleUpdateProject,
  handleDeleteProject,
  fetchProjects,
  showDesktopFallback,
  setShowDesktopFallback,
  handlePhoneProjectCreated,
  selectedProject,
  isCompatibilityMode,
}: {
  loadError: string | null;
  filteredProjects: import("../features/projects/types").Project[];
  setSelectedProject: (p: import("../features/projects/types").Project | null) => void;
  filteredCategory: string;
  setFilteredCategory: (c: string) => void;
  filteredStatus: string;
  setFilteredStatus: (s: string) => void;
  projects: import("../features/projects/types").Project[];
  categories: string[];
  loading: boolean;
  handleCreateProject: (p: import("../features/projects/types").CreateProjectPayload) => Promise<void>;
  handleUpdateProject: (p: import("../features/projects/types").UpdateProjectPayload) => Promise<void>;
  handleDeleteProject: (id: string, password: string) => Promise<string | true>;
  fetchProjects: () => Promise<import("../features/projects/types").Project[]>;
  showDesktopFallback: boolean;
  setShowDesktopFallback: (v: boolean) => void;
  handlePhoneProjectCreated: () => Promise<void>;
  selectedProject: import("../features/projects/types").Project | null;
  isCompatibilityMode: boolean;
}) {
  const apiStatus = useApiStatus();
  const [showHeader, setShowHeader] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowHeader(window.scrollY < 10);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 relative">
            <header
              className={`relative border-b border-slate-800 sticky top-0 z-10 shadow-xl overflow-hidden transition-transform duration-300 ${showHeader ? "translate-y-0" : "-translate-y-full"}`}
            >
              <img
                src={JHC_BACKGROUND}
                alt="JHC Laboratory"
                className="absolute inset-0 w-full h-full object-cover"
              />

              <div className={`absolute inset-0 bg-slate-900/50 ${isCompatibilityMode ? "" : "backdrop-blur-[2px]"}`} />

              <PageContainer className="py-4 sm:py-6 lg:py-8 relative z-10">
                <div className="flex bg-black border-0 overflow-hidden rounded-sm shadow-2xl w-fit max-w-full">
                  <div
                    className="w-2 shrink-0"
                    style={{ backgroundColor: "#009933" }}
                    aria-hidden
                  />
                  <div className="py-3 px-4 sm:py-6 sm:pl-6 sm:pr-8">
                    <h1 className="text-white text-lg sm:text-xl lg:text-2xl font-bold tracking-tight uppercase">
                      JHC Protolab Project Database
                    </h1>
                  </div>
                </div>
              </PageContainer>
            </header>

            <PageContainer as="main" className="py-4 sm:py-6">
              {loadError && (
                <div className="mb-4 sm:mb-6 rounded-lg border border-red-800 bg-red-900/20 p-3 sm:p-4 text-sm text-red-400">
                  {loadError}
                </div>
              )}

              {apiStatus?.apiCreditsExhausted && (
                <div className="mb-4 sm:mb-6 rounded-lg border border-amber-700 bg-amber-900/20 p-3 sm:p-4 text-sm text-amber-200 flex items-center justify-between gap-3 sm:gap-4">
                  <span className="flex items-center gap-2">
                    <Info className="w-4 h-4 flex-shrink-0" />
                    API credits exhausted. AI-generated descriptions are temporarily unavailable. You can still add and edit projects with your own text.
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => apiStatus?.setApiCreditsExhausted(false)}
                    className="text-amber-200 hover:text-amber-100 hover:bg-amber-800/30 shrink-0"
                    aria-label="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              <FilterBar
                selectedCategory={filteredCategory}
                selectedStatus={filteredStatus}
                onCategoryChange={setFilteredCategory}
                onStatusChange={setFilteredStatus}
                projects={projects}
                isCompatibilityMode={isCompatibilityMode}
                addProjectSlot={
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setCreateDialogOpen(true)}
                      className="border-white text-white hover:bg-white/10 hover:text-white"
                    >
                      + Add Project
                    </Button>
                    <CreateFromPhoneDialog
                      onProjectCreated={handlePhoneProjectCreated}
                      onFallbackClick={() => setShowDesktopFallback(true)}
                      existingCategories={categories}
                      open={createDialogOpen}
                      onOpenChange={setCreateDialogOpen}
                    />
                    {showDesktopFallback && (
                      <AddProjectDialog
                        onCreate={handleCreateProject}
                        existingCategories={categories}
                        externalOpen={showDesktopFallback}
                        onExternalOpenChange={(open) => {
                          setShowDesktopFallback(open);
                        }}
                        isCompatibilityMode={isCompatibilityMode}
                      />
                    )}
                  </>
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
                    isCompatibilityMode={isCompatibilityMode}
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
            </PageContainer>

            <PageContainer as="footer" className="py-6 sm:py-8 mt-4 sm:mt-6 border-t border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-4 sm:gap-6 text-sm text-slate-400">
                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
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
            </PageContainer>

            <ProjectDetail
              project={selectedProject}
              onClose={() => setSelectedProject(null)}
              onDelete={handleDeleteProject}
              onUpdate={handleUpdateProject}
              onRefresh={fetchProjects}
              isCompatibilityMode={isCompatibilityMode}
            />
            <IdleOverlay 
              isCompatibilityMode={isCompatibilityMode} 
              onIdle={() => setSelectedProject(null)}
            />
          </div>
  );
}

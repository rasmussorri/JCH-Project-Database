import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { ProjectGrid } from "../features/projects/components/ProjectGrid";
import { ProjectDetail } from "../features/projects/components/ProjectDetail";
import { FilterBar } from "../features/projects/components/FilterBar";
import { AddProjectDialog } from "../features/projects/components/AddProjectDialog";
import { UploadPage } from "../features/uploads/components/UploadPage";
import { useProjects } from "../features/projects/hooks/useProjects";

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
    handleDeleteProject,
  } = useProjects();

  const [showHeader, setShowHeader] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setShowHeader(window.scrollY < 10);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
              <img
                src={JHC_BACKGROUND}
                alt="JHC Laboratory"
                className="absolute inset-0 w-full h-full object-cover"
              />

              <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" />

              <div className="max-w-[1800px] mx-auto px-12 py-8 relative z-10">
                <div className="flex bg-black border-0 overflow-hidden rounded-sm shadow-2xl w-fit max-w-full">
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

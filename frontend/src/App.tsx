import { useEffect, useMemo, useState } from "react";
import { ProjectGrid } from "./components/ProjectGrid";
import { ProjectDetail } from "./components/ProjectDetail";
import { FilterBar } from "./components/FilterBar";
import { AddProjectDialog } from "./components/AddProjectDialog";
import type { Project } from "./types/project";

const JHC_BACKGROUND =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2400&q=80";

// Admin password for deleting any project
const ADMIN_PASSWORD = "admin123";

// Mock project data
const initialProjects: Project[] = [
  {
    id: "1",
    title: "Smart Indoor Garden",
    description:
      "An automated indoor gardening system with IoT sensors for monitoring soil moisture, temperature, and light levels. Features a mobile app for remote monitoring and control.",
    category: "IoT",
    status: "In Progress",
    team: ["Sarah Chen", "Mike Rodriguez", "Amy Park"],
    image: "garden",
    startDate: "2024-09-15",
    technologies: ["Arduino", "React Native", "Python", "MQTT"],
  },
  {
    id: "2",
    title: "AR Navigation Assistant",
    description:
      "Augmented reality application that helps users navigate indoor spaces using their smartphone camera with real-time directional overlays.",
    category: "AR/VR",
    status: "Completed",
    team: ["James Wilson", "Lisa Zhang"],
    image: "navigation",
    startDate: "2024-08-01",
    technologies: ["Unity", "ARKit", "C#", "Swift"],
  },
  {
    id: "3",
    title: "Waste Sorting Robot",
    description:
      "AI-powered robotic arm that automatically sorts recyclable materials using computer vision and machine learning to identify different types of waste.",
    category: "Robotics",
    status: "In Progress",
    team: [
      "David Kumar",
      "Emma Thompson",
      "Carlos Martinez",
      "Nina Patel",
    ],
    image: "robot",
    startDate: "2024-09-20",
    technologies: ["ROS", "TensorFlow", "Python", "OpenCV"],
  },
  {
    id: "4",
    title: "Accessible Sign Language Translator",
    description:
      "Real-time sign language translation system using computer vision and deep learning to convert sign language gestures into text and speech.",
    category: "AI/ML",
    status: "Testing",
    team: ["Rachel Kim", "Omar Hassan"],
    image: "sign-language",
    startDate: "2024-07-10",
    technologies: ["PyTorch", "MediaPipe", "Flask", "React"],
  },
  {
    id: "5",
    title: "Sustainable Energy Monitor",
    description:
      "Dashboard system for tracking and analyzing energy consumption in campus buildings with predictive analytics for optimization.",
    category: "IoT",
    status: "Completed",
    team: ["Alex Turner", "Sofia Gonzalez", "Ryan Lee"],
    image: "energy",
    startDate: "2024-06-15",
    technologies: ["Node.js", "InfluxDB", "Grafana", "MQTT"],
  },
  {
    id: "6",
    title: "Interactive Museum Guide",
    description:
      "Virtual reality experience that brings museum exhibits to life with immersive 3D environments and interactive historical narratives.",
    category: "AR/VR",
    status: "In Progress",
    team: ["Hannah Brooks", "Tyler Johnson", "Mia Anderson"],
    image: "museum",
    startDate: "2024-09-01",
    technologies: [
      "Unreal Engine",
      "C++",
      "Blender",
      "3D Modeling",
    ],
  },
  {
    id: "7",
    title: "Drone Delivery System",
    description:
      "Autonomous drone network for campus package delivery with GPS navigation, obstacle avoidance, and automated landing stations.",
    category: "Robotics",
    status: "Testing",
    team: ["Kevin O'Brien", "Zara Ali", "Lucas Brown"],
    image: "drone",
    startDate: "2024-08-20",
    technologies: ["ROS", "Python", "GPS", "Computer Vision"],
  },
  {
    id: "8",
    title: "Health Monitoring Wearable",
    description:
      "Custom-built wearable device that tracks vital signs including heart rate, blood oxygen, and stress levels with ML-based health insights.",
    category: "IoT",
    status: "In Progress",
    team: ["Jessica Wang", "Anthony Garcia"],
    image: "wearable",
    startDate: "2024-09-10",
    technologies: [
      "ESP32",
      "Flutter",
      "TensorFlow Lite",
      "BLE",
    ],
  },
  {
    id: "9",
    title: "JHC Ukkonen - Electric Race Bike",
    description:
      "High-performance electric racing motorcycle being developed at JHC. Features advanced battery management, regenerative braking, and aerodynamic carbon fiber bodywork for competitive racing.",
    category: "Robotics",
    status: "In Progress",
    team: ["JHC Engineering Team", "Motorsport Division"],
    image: "electric-bike",
    startDate: "2024-05-01",
    technologies: [
      "Electric Powertrain",
      "Battery Management",
      "Carbon Fiber",
      "Aerodynamics",
    ],
  },
];

export default function App() {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [selectedProject, setSelectedProject] =
    useState<Project | null>(null);
  const [filteredCategory, setFilteredCategory] =
    useState<string>("All");
  const [filteredStatus, setFilteredStatus] =
    useState<string>("All");
  const [showHeader, setShowHeader] = useState(true);

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

  const handleAddProject = (project: Project) => {
    setProjects((prev) => [...prev, project]);
    setFilteredCategory("All");
    setFilteredStatus("All");
  };

  const handleDeleteProject = (projectId: string, password: string): boolean => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return false;

    // Check if password matches admin password or project password
    const isValidPassword =
      password === ADMIN_PASSWORD ||
      (project.password && password === project.password);

    if (!isValidPassword) {
      return false;
    }

    setProjects((prev) => prev.filter((p) => p.id !== projectId));
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
        <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" />

        {/* Header Content */}
        <div className="max-w-[1800px] mx-auto px-12 py-8 relative z-10">
          <h1 className="text-slate-100 mb-2">
            Prototype Laboratory
          </h1>
          <p className="text-slate-400">
            Student Innovation Projects
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto px-12 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
          <div>
            <h2 className="text-slate-100 text-2xl font-medium">
              Project Portfolio
            </h2>
            <p className="text-slate-400">
              Track and showcase ongoing innovation projects
            </p>
          </div>
          <AddProjectDialog
            onAdd={handleAddProject}
            existingCategories={categories}
          />
        </div>

        <FilterBar
          selectedCategory={filteredCategory}
          selectedStatus={filteredStatus}
          onCategoryChange={setFilteredCategory}
          onStatusChange={setFilteredStatus}
          projects={projects}
        />

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
      </main>

      {/* Page curl CTA */}
      <a
        href="https://www.forwardbylutes.fi/"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-0 right-0 z-50"
      >
        <span className="absolute bottom-1 right-[68px] text-white text-sm italic font-serif whitespace-nowrap">
          Ready take the next step?
        </span>
        <div className="relative w-[150px] h-[150px] overflow-visible">
          <div className="curl" />
        </div>
      </a>

      {/* Project Detail Dialog */}
      <ProjectDetail
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
        onDelete={handleDeleteProject}
      />
    </div>
  );
}
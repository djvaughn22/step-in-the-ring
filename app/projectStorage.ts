export type Project = {
  id: string;
  name: string;
  idea: string;
  user: string;
  firstThing: string;
  feel: string;
  version: number;
  feedback: string[];
  updatedAt: string;
  createdAt: string;
};

const key = "step-in-the-ring-projects-v1";

export function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getProjects(): Project[] {
  if (typeof window === "undefined") return [];

  const raw = window.localStorage.getItem(key);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as Project[];
  } catch {
    window.localStorage.removeItem(key);
    return [];
  }
}

export function saveProjects(projects: Project[]) {
  window.localStorage.setItem(key, JSON.stringify(projects));
}

export function getProject(id: string) {
  return getProjects().find((project) => project.id === id) || null;
}

export function saveProject(project: Project) {
  const projects = getProjects();
  const index = projects.findIndex((item) => item.id === project.id);
  const nextProject = { ...project, updatedAt: new Date().toISOString() };

  if (index >= 0) {
    projects[index] = nextProject;
  } else {
    projects.unshift(nextProject);
  }

  saveProjects(projects);
  return nextProject;
}

export function deleteProject(id: string) {
  saveProjects(getProjects().filter((project) => project.id !== id));
}

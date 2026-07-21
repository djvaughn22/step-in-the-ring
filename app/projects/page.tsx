import type { Metadata } from "next";
import ProjectsWorkspace from "./ProjectsWorkspace";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Every project in one place: what it is, what version one includes, what's proven, what's assumed, and the one next action.",
};

export default function ProjectsPage() {
  return <ProjectsWorkspace />;
}

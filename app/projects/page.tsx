"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getProjects, type Project } from "../projectStorage";

function dateLabel(value: string) {
  if (!value) return "";
  return new Date(value).toLocaleString();
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    setProjects(getProjects());
  }, []);

  return (
    <main>
      <h1>Projects</h1>
      <p className="lede">
        Open a saved project and keep shaping the first version.
      </p>

      <div className="actions section">
        <Link className="button" href="/">
          New project
        </Link>
      </div>

      <section className="section">
        {projects.length === 0 ? (
          <p>No saved projects yet.</p>
        ) : (
          <div className="list">
            {projects.map((project) => (
              <Link className="project-row" href={`/project/${project.id}`} key={project.id}>
                <strong>{project.name}</strong>
                <span className="small">
                  Version {project.version} · Updated {dateLabel(project.updatedAt)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

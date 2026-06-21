"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { makeId, saveProject, type Project } from "./projectStorage";

function nameFromIdea(idea: string) {
  const clean = idea.trim();
  if (!clean) return "Untitled project";
  const firstLine = clean.split("\n")[0].trim();
  if (firstLine.length <= 48) return firstLine;
  return `${firstLine.slice(0, 48).trim()}...`;
}

export default function Home() {
  const router = useRouter();
  const [idea, setIdea] = useState("");

  function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanIdea = idea.trim();
    if (!cleanIdea) return;

    const now = new Date().toISOString();
    const project: Project = {
      id: makeId(),
      name: nameFromIdea(cleanIdea),
      idea: cleanIdea,
      user: "",
      firstThing: "",
      feel: "",
      version: 1,
      feedback: [],
      createdAt: now,
      updatedAt: now,
    };

    saveProject(project);
    router.push(`/project/${project.id}`);
  }

  return (
    <main>
      <h1>What do you want to build?</h1>
      <p className="lede">
        Say the idea normally. Save it as a project. Keep editing until the
        first version feels right.
      </p>

      <form className="form" onSubmit={createProject}>
        <textarea
          value={idea}
          onChange={(event) => setIdea(event.target.value)}
          placeholder="Example: I want to make a simple app that helps my kids track chores and earn points."
          autoFocus
          required
        />

        <div className="actions">
          <button type="submit">Step in</button>
        </div>
      </form>

      <div className="footer-note">
        Family MVP1. Saved projects stay in this browser for now.
      </div>
    </main>
  );
}

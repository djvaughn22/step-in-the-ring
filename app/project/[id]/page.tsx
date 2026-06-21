"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { deleteProject, getProject, saveProject, type Project } from "../../projectStorage";

function shortText(value: string, fallback: string) {
  const clean = value.trim();
  if (!clean) return fallback;
  if (clean.length <= 72) return clean;
  return `${clean.slice(0, 72).trim()}...`;
}

export default function ProjectPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [project, setProject] = useState<Project | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setProject(getProject(id));
    setLoaded(true);
  }, [id]);

  const headline = useMemo(() => {
    if (!project) return "First version";
    return shortText(project.name || project.idea, "First version");
  }, [project]);

  function updateField(field: keyof Project, value: string) {
    if (!project) return;
    const next = saveProject({ ...project, [field]: value });
    setProject(next);
  }

  function saveDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!project) return;
    const next = saveProject({ ...project, version: project.version + 1 });
    setProject(next);
  }

  function addFeedback(label: string) {
    if (!project) return;
    const next = saveProject({
      ...project,
      version: project.version + 1,
      feedback: [label, ...project.feedback].slice(0, 8),
    });
    setProject(next);
  }

  function removeProject() {
    if (!project) return;
    deleteProject(project.id);
    router.push("/projects");
  }

  if (!loaded) {
    return <main><p>Loading...</p></main>;
  }

  if (!project) {
    return (
      <main>
        <h1>Project not found.</h1>
        <p className="lede">This project may only exist in another browser.</p>
        <div className="actions">
          <Link className="button" href="/">
            New project
          </Link>
          <Link className="button secondary" href="/projects">
            Projects
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main>
      <h1>{project.name}</h1>
      <p className="lede">
        Keep answering. Keep reacting. Each save becomes the next version.
      </p>

      <section className="section preview">
        <div className="preview-top">Version {project.version}</div>
        <div className="preview-body">
          <h2>{headline}</h2>
          <p>
            For {project.user || "the first user"}, this first version should{" "}
            {project.firstThing || "do one useful thing"}.
          </p>
          <p>
            Feel: {project.feel || "simple and clear"}.
            {project.feedback[0] ? ` Last note: ${project.feedback[0]}.` : ""}
          </p>
          <div className="preview-button">Start</div>
        </div>
      </section>

      <form className="form section" onSubmit={saveDetails}>
        <div className="field">
          <label htmlFor="name">Project name</label>
          <input
            id="name"
            value={project.name}
            onChange={(event) => updateField("name", event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="idea">Idea</label>
          <textarea
            id="idea"
            value={project.idea}
            onChange={(event) => updateField("idea", event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="user">Who is this for first?</label>
          <input
            id="user"
            value={project.user}
            onChange={(event) => updateField("user", event.target.value)}
            placeholder="Example: my kids"
          />
        </div>

        <div className="field">
          <label htmlFor="firstThing">What should it do first?</label>
          <textarea
            id="firstThing"
            value={project.firstThing}
            onChange={(event) => updateField("firstThing", event.target.value)}
            placeholder="Example: let them add a chore and mark it done."
          />
        </div>

        <div className="field">
          <label htmlFor="feel">How should it feel?</label>
          <input
            id="feel"
            value={project.feel}
            onChange={(event) => updateField("feel", event.target.value)}
            placeholder="Example: clean, fun, calm, kid-friendly"
          />
        </div>

        <div className="actions">
          <button type="submit">Save next version</button>
          <Link className="button secondary" href="/projects">Back to projects</Link>
        </div>
      </form>

      <section className="section">
        <h2>React</h2>
        <p>Tap what you feel. The project saves a new version.</p>
        <div className="chips">
          {["Simpler", "More fun", "More serious", "Less crowded", "Closer", "Try again"].map((label) => (
            <button className="chip" key={label} type="button" onClick={() => addFeedback(label)}>
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <button className="secondary" type="button" onClick={removeProject}>
          Delete project
        </button>
      </section>
    </main>
  );
}

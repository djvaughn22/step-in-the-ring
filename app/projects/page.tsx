const projects = [
  {
    title: "Family test ideas",
    label: "Private test",
    copy:
      "Small ideas from family testing help shape the process before wider access.",
  },
  {
    title: "First prototypes",
    label: "MVP1",
    copy:
      "Each project starts with a clear Build Card and a small first version.",
  },
  {
    title: "Approved projects",
    label: "Later",
    copy:
      "Access can stay curated so the guidance stays focused and useful.",
  },
];

export default function ProjectsPage() {
  return (
    <main className="main">
      <section className="page-hero">
        <p className="eyebrow">Projects</p>
        <h1>Simple ideas, shaped carefully.</h1>
        <p className="lede">
          Step In The Ring starts with family testing and approved projects that
          are small enough to build, test, and improve.
        </p>
      </section>

      <section className="section">
        <div className="grid three">
          {projects.map((project) => (
            <article className="card" key={project.title}>
              <span className="badge">{project.label}</span>
              <h3>{project.title}</h3>
              <p>{project.copy}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

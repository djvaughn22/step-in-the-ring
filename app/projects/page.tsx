const projects = [
  {
    title: "Family test dreams",
    label: "Private beta",
    copy:
      "Small, safe ideas from family members help test the Ring before public access.",
  },
  {
    title: "First prototype rides",
    label: "MVP1",
    copy:
      "Each project starts as a simple guided ride: dream, shape, build card, first screen, first button.",
  },
  {
    title: "Approved customer projects",
    label: "Coming later",
    copy:
      "Step In The Ring will stay intentionally curated so the process stays safe, focused, and useful.",
  },
];

export default function ProjectsPage() {
  return (
    <main className="main">
      <section className="page-hero">
        <p className="eyebrow">🎪 Inside the park</p>
        <h1>Approved projects only.</h1>
        <p className="lede">
          This starts with family testing, simple dreams, and carefully approved
          projects that fit the Ring.
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

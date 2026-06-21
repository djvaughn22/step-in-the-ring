const projects = [
  {
    title: "CrossHeartPray",
    label: "Proof project",
    copy:
      "A daily Bible routine became a working web app through careful rounds of shaping, building, testing, and improving.",
  },
  {
    title: "Family test projects",
    label: "Private beta",
    copy:
      "Small, safe ideas from family members will help test the Ring before public access.",
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
          This is not an open free-for-all. Step In The Ring starts with family,
          CrossHeartPray, and carefully approved dreams.
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

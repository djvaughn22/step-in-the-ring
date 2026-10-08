import styles from "./ready.module.css";

// Evidence and feature boundaries: docs/ready-to-build-project-evidence.md.
// 2026-10-08 (owner): plain wording, no AI-themed marketing; CrossHeartPray
// is outreach, not a build showcase, so it is not one of these cards.
const projects = [
  {
    name: "TheDJCares",
    href: "https://thedjcares.com",
    what: "A curated player for Christian music, videos, podcasts, and sermons.",
    helped: "Building and fixing playback controls, volume handling, and the player interface.",
    sources: "An approved media catalog, with YouTube, Apple Music, and Spotify players or links. Code selects from that catalog.",
    matters: "Browsing and playback pick from an approved catalog; nothing is invented. An optional feature can interpret a listening request, and it still selects from approved content.",
  },
  {
    name: "iDontCry",
    href: "https://idontcry.com/sports",
    what: "Games and family tools, including a Sports Desk for following teams, schedules, and reported results.",
    helped: "Improving the Sports Desk’s pages, team navigation, and presentation of schedules and results.",
    sources: "Stored sports records, school EventLink calendars for schedules, and selected school and college athletics pages for published information.",
    matters: "The desk reads collected records and never invents scores. EventLink supplies schedules, not scores; missing results stay unconfirmed.",
  },
  {
    name: "WatchedNotWatched",
    href: "https://watchednotwatched.com",
    what: "Find movies, shows, and books, and keep track of what you have watched or read.",
    helped: "Building book search and detail pages, improving loading reliability, and adding tests.",
    sources: "Open Library for books; TMDB for movies and TV when configured, with TVmaze as a television fallback. Saved choices help organize your library.",
    matters: "Search retrieves provider records instead of generating titles. Recommendations are a separate, controlled feature—not a requirement for each page view.",
  },
];

export default function RealProjects() {
  return (
    <section id="real-projects" className={styles.section} aria-labelledby="real-projects-heading">
      <div className={styles.sectionIntro}>
        <span className="kicker">From our own build history</span>
        <h2 id="real-projects-heading">Real projects. Real sources.</h2>
        <p>These are sites from our own build history, built with the same steps this guide teaches. Their content, links, schedules, books, scores, and other information come from code, public APIs, official developer connections, open data, and trusted source websites.</p>
      </div>

      <div className={styles.truthCallout}>
        <h3>A coding tool can help write the code. It should not be where your facts come from.</h3>
        <p>Whatever tools help you build, the finished site should read its information from real sources.</p>
      </div>

      <ol className={styles.trustFlow} aria-label="From idea to a useful website">
        {["Idea", "Code, written step by step", "Trusted data connections", "Useful live website"].map((step, i) => (
          <li key={step}><span className={styles.number}>0{i + 1}</span><strong>{step}</strong>{i < 3 && <span className={styles.flowArrow} aria-hidden="true">→</span>}</li>
        ))}
      </ol>

      <div className={styles.costModel}>
        <h3>Keep everyday visits simple.</h3>
        <ul>
          <li>Coding tools help during the build: planning, writing, debugging, testing, and improving the software.</li>
          <li>The finished websites do not need a paid service call every time a visitor opens a page. Many pages can be served as normal web pages with ordinary hosting.</li>
          <li>Data can come from official feeds, open-data or open-source APIs, public developer connections, structured source files, or carefully selected trusted sources. An API is simply a way for one service to request information from another.</li>
          <li>Paid services can stay optional, for special features, rather than becoming a required cost for every page view.</li>
        </ul>
        <p>Hosting, storage, data providers, and any optional paid features may still have costs.</p>
      </div>

      <div className={styles.projectEvidenceGrid}>
        {projects.map(project => (
          <article className={styles.projectEvidenceCard} key={project.name}>
            <h3>{project.name}</h3>
            <p>{project.what}</p>
            <dl>
              <div><dt>What the build covered:</dt><dd>{project.helped}</dd></div>
              <div><dt>Built on:</dt><dd>{project.sources}</dd></div>
              <div><dt>Why it matters:</dt><dd>{project.matters}</dd></div>
            </dl>
            <a className={styles.textLink} href={project.href}>Visit {project.name}{project.name === "iDontCry" ? " Sports Desk" : ""} <span aria-hidden="true">↗</span></a>
          </article>
        ))}
      </div>

      <div className={styles.note}>
        <strong>Useful software, without a per-visit bill.</strong>
        <p>The value is in the design, the code, the source selection, and the workflow—not in making up information.</p>
      </div>
      <p className={styles.sourceNote}>Source availability and API terms vary by project and must be checked before building. A working connection is not a promise of free access, unlimited use, or permission to republish everything it returns.</p>
    </section>
  );
}

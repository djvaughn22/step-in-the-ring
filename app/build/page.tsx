"use client";

// Build your first web app — a 6-round beginner coach.
// No API, no login, no database. Progress lives in localStorage.

import { useEffect, useState } from "react";

const STORAGE = "sitr-first-app-v1";
const SEED_KEY = "sitr-build-seed"; // one-time idea handoff from /engines

const IDEA_TYPES = [
  "Business site",
  "Family app",
  "Sports team app",
  "Faith app",
  "AI tool",
  "Local service",
  "I'm not sure",
] as const;

type IdeaType = (typeof IDEA_TYPES)[number];

const SUGGEST: Record<IdeaType, { first: string; pages: string[] }> = {
  "Business site": { first: "One page that says who you are, what you do, and how to reach you.", pages: ["Home", "Services", "About", "Contact"] },
  "Family app": { first: "One private page your family actually checks — photos, dates, notes.", pages: ["Home", "Photos", "Calendar", "Notes"] },
  "Sports team app": { first: "One page with the schedule and last game's score.", pages: ["Home", "Schedule", "Roster", "Scores"] },
  "Faith app": { first: "One page with a daily verse and a prayer.", pages: ["Home", "Daily Verse", "Prayer", "About"] },
  "AI tool": { first: "One page: a text box, a button, and a helpful result.", pages: ["Home", "The Tool", "About"] },
  "Local service": { first: "One page that says what you offer, your area, and your phone number.", pages: ["Home", "Services", "Area", "Contact"] },
  "I'm not sure": { first: "One page about something you love. You can change everything later.", pages: ["Home", "About"] },
};

const TOOLS: { name: string; emoji: string; what: string }[] = [
  { name: "ChatGPT", emoji: "💬", what: "Your thinking partner — planning, writing prompts, and figuring out errors." },
  { name: "Linux Terminal", emoji: "⌨️", what: "The command box. You type a command, the computer does it." },
  { name: "VS Code", emoji: "📝", what: "The editor where your app's files live and get changed." },
  { name: "Git", emoji: "💾", what: "The save system. Every commit is a snapshot you can go back to." },
  { name: "GitHub", emoji: "☁️", what: "Your code's online backup — and how others can help you build." },
  { name: "Vercel", emoji: "🚀", what: "The host. It takes your GitHub code and puts it on the internet." },
  { name: "GoDaddy", emoji: "🌐", what: "Where your domain name lives. DNS points it at your Vercel app." },
];

const ROUNDS = ["Idea", "Tools", "Create", "Save", "Deploy", "Domain"];

function slugify(name: string) {
  return (
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) ||
    "my-first-app"
  );
}

function copyText(text: string) {
  // Clipboard API first; hidden-textarea fallback for older phones/webviews.
  return navigator.clipboard?.writeText(text).catch(() => fallbackCopy(text)) ?? Promise.resolve(fallbackCopy(text));
}

function fallbackCopy(text: string) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
}

function CopyBtn({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-ghost btn-small"
      style={{ flexShrink: 0 }}
      onClick={() =>
        copyText(text).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        })
      }
    >
      {done ? "✓ Copied" : label}
    </button>
  );
}

function Command({ cmd, why }: { cmd: string; why: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <code style={{ flex: 1, display: "block", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "var(--text)", overflowX: "auto", whiteSpace: "pre" }}>
          {cmd}
        </code>
        <CopyBtn text={cmd} />
      </div>
      <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "5px 2px 0" }}>{why}</p>
    </div>
  );
}

function PromptBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="card" style={{ padding: 16, marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: "var(--gold)", margin: 0 }}>{title}</p>
        <CopyBtn text={text} label="Copy prompt" />
      </div>
      <p style={{ fontSize: 13, color: "var(--muted)", whiteSpace: "pre-wrap", margin: 0, lineHeight: 1.6 }}>{text}</p>
    </div>
  );
}

export default function FirstAppCoach() {
  const [round, setRound] = useState(1);
  const [ideaType, setIdeaType] = useState<IdeaType | null>(null);
  const [appName, setAppName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [stuck, setStuck] = useState({ ran: "", expected: "", got: "" });
  const [seededFromEngines, setSeededFromEngines] = useState(false);

  // Restore progress, then apply an Engine Room handoff (if any).
  useEffect(() => {
    let hadProgress = false;
    try {
      const s = JSON.parse(localStorage.getItem(STORAGE) ?? "null");
      if (s) {
        if (s.round) setRound(s.round);
        if (s.ideaType) setIdeaType(s.ideaType);
        if (s.appName) setAppName(s.appName);
        if (s.purpose) setPurpose(s.purpose);
        hadProgress = Boolean(s.appName || s.purpose || (s.round && s.round > 1));
      }
    } catch {}

    // One-time seed from the Engine Room (/engines). Consume it once, and only
    // prefill when there's no build already in progress — never clobber work.
    try {
      const raw = localStorage.getItem(SEED_KEY);
      if (raw) {
        localStorage.removeItem(SEED_KEY);
        const seed = JSON.parse(raw);
        const seedName = typeof seed?.appName === "string" ? seed.appName.trim() : "";
        const seedPurpose = typeof seed?.purpose === "string" ? seed.purpose.trim() : "";
        if (!hadProgress && (seedName || seedPurpose)) {
          if (seedName) setAppName(seedName);
          if (seedPurpose) setPurpose(seedPurpose);
          setRound(1);
          setSeededFromEngines(true);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify({ round, ideaType, appName, purpose }));
  }, [round, ideaType, appName, purpose]);

  const folder = slugify(appName);
  const suggestion = SUGGEST[ideaType ?? "I'm not sure"];
  const stack = "Next.js + Tailwind CSS, saved on GitHub, hosted on Vercel";
  const displayName = appName.trim() || "My First App";

  const chatgptPrompt = `I'm a beginner building my first web app. It's called "${displayName}" — ${purpose.trim() || "a simple first version of my idea"}. The first version is: ${suggestion.first} Pages: ${suggestion.pages.join(", ")}. I'm using Next.js, GitHub, and Vercel. Help me plan the home page: what sections it needs and what each should say. Plain language please — I'm new at this.`;

  const claudePrompt = `Create the first version of my Next.js app "${displayName}" — ${purpose.trim() || "a simple first version of my idea"}. Keep it to these pages: ${suggestion.pages.join(", ")}. Simple, clean, mobile-first. First version only: ${suggestion.first} Explain what you changed in plain language when you're done.`;

  const stuckPrompt = `I am building a Next.js app and I'm stuck.\n\nWhat I ran:\n${stuck.ran || "(paste the command here)"}\n\nWhat I expected:\n${stuck.expected || "(what you thought would happen)"}\n\nThe error I got:\n${stuck.got || "(paste the exact error here)"}\n\nExplain what went wrong in plain language and give me the exact next step.`;

  const kit = [
    `YOUR WEB APP STARTER KIT — ${displayName}`,
    ``,
    `Idea: ${purpose.trim() || suggestion.first}`,
    `First version: ${suggestion.first}`,
    `Pages: ${suggestion.pages.join(", ")}`,
    `Stack: ${stack}`,
    `Folder name: ${folder}`,
    `GitHub repo: ${folder}`,
    `Vercel project: ${folder}`,
    `Domain plan: buy ${folder}.com on GoDaddy → point DNS at Vercel`,
    ``,
    `TERMINAL COMMANDS`,
    `cd ~/OpenMirror`,
    `npx create-next-app@latest ${folder}`,
    `cd ${folder}`,
    `npm run dev`,
    `git add .`,
    `git commit -m "First working version"`,
    `gh repo create ${folder} --source=. --private --push`,
    ``,
    `DNS CHECKLIST (copy exact values from Vercel)`,
    `A record: Name @ → Value from Vercel (commonly 76.76.21.21)`,
    `CNAME: Name www → Value from Vercel`,
    `Wait a few minutes (up to 48 hours).`,
  ].join("\n");

  const tab = (n: number) => (
    <button
      key={n}
      type="button"
      onClick={() => setRound(n)}
      className={n === round ? "btn btn-gold btn-small" : "btn btn-ghost btn-small"}
    >
      {n}. {ROUNDS[n - 1]}
    </button>
  );

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "36px 20px 80px" }}>
        <header style={{ textAlign: "center", marginBottom: 26 }}>
          <p style={{ fontSize: 12, fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--gold)", margin: "0 0 10px" }}>
            🥊 Step In The Ring · First App
          </p>
          <h1 style={{ fontSize: "clamp(1.7rem, 6vw, 2.6rem)", fontWeight: 900, margin: "0 0 10px", lineHeight: 1.1 }}>
            Build your first web app
          </h1>
          <p style={{ fontSize: 15, color: "var(--muted)", margin: "0 0 14px" }}>without knowing where to start</p>
          <p className="card" style={{ fontSize: 14, lineHeight: 1.7, padding: "14px 16px", margin: 0, textAlign: "left" }}>
            <strong style={{ color: "var(--gold)" }}>ChatGPT</strong> helps you think.{" "}
            <strong style={{ color: "var(--gold)" }}>Linux terminal</strong> runs the commands.{" "}
            <strong style={{ color: "var(--gold)" }}>GitHub</strong> saves your code.{" "}
            <strong style={{ color: "var(--gold)" }}>Vercel</strong> hosts it.{" "}
            <strong style={{ color: "var(--gold)" }}>GoDaddy</strong> points your domain to it.
          </p>
        </header>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 22 }}>
          {[1, 2, 3, 4, 5, 6].map(tab)}
          <button type="button" onClick={() => setRound(7)} className={round === 7 ? "btn btn-gold btn-small" : "btn btn-ghost btn-small"}>
            🎁 Kit
          </button>
        </div>

        {round === 1 && (
          <section className="card" style={{ padding: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, margin: "0 0 6px" }}>Round 1 · What do you want to build?</h2>
            <p style={{ fontSize: 14, color: "var(--muted)", margin: "0 0 14px" }}>No wrong answers. Pick the closest one.</p>
            {seededFromEngines && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--gold-soft)", border: "1px solid var(--gold)", borderRadius: 10, padding: "10px 12px", marginBottom: 14 }}>
                <span style={{ fontSize: 16 }}>🧰</span>
                <p style={{ fontSize: 13, color: "var(--text)", margin: 0, lineHeight: 1.5 }}>
                  Idea loaded from the <strong>Engine Room</strong> — edit anything below.
                </p>
              </div>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {IDEA_TYPES.map((t) => (
                <button key={t} type="button" onClick={() => setIdeaType(t)} className={ideaType === t ? "btn btn-gold btn-small" : "btn btn-ghost btn-small"}>
                  {t}
                </button>
              ))}
            </div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 800, marginBottom: 6 }}>Name your app</label>
            <input
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="e.g. Vaughn Family Hub"
              style={{ width: "100%", boxSizing: "border-box", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, padding: "12px 14px", fontSize: 15, color: "var(--text)", marginBottom: 14 }}
            />
            <label style={{ display: "block", fontSize: 13, fontWeight: 800, marginBottom: 6 }}>One sentence: what's it for?</label>
            <input
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. one place for our family's photos and plans"
              style={{ width: "100%", boxSizing: "border-box", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, padding: "12px 14px", fontSize: 15, color: "var(--text)", marginBottom: 16 }}
            />
            {ideaType && (
              <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, padding: 14, marginBottom: 16 }}>
                <p style={{ fontSize: 13, margin: "0 0 6px" }}><strong>First version:</strong> <span style={{ color: "var(--muted)" }}>{suggestion.first}</span></p>
                <p style={{ fontSize: 13, margin: "0 0 6px" }}><strong>Pages:</strong> <span style={{ color: "var(--muted)" }}>{suggestion.pages.join(" · ")}</span></p>
                <p style={{ fontSize: 13, margin: 0 }}><strong>Stack:</strong> <span style={{ color: "var(--muted)" }}>{stack}</span></p>
              </div>
            )}
            <button type="button" className="btn btn-gold" onClick={() => setRound(2)}>Next: meet your tools →</button>
          </section>
        )}

        {round === 2 && (
          <section className="card" style={{ padding: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, margin: "0 0 6px" }}>Round 2 · Meet your corner team</h2>
            <p style={{ fontSize: 14, color: "var(--muted)", margin: "0 0 16px" }}>Seven tools. Each does one job. That's the whole secret.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10, marginBottom: 16 }}>
              {TOOLS.map((t) => (
                <div key={t.name} style={{ display: "flex", gap: 12, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, padding: "12px 14px" }}>
                  <span style={{ fontSize: 22 }}>{t.emoji}</span>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 800, margin: "0 0 2px" }}>{t.name}</p>
                    <p style={{ fontSize: 13, color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>{t.what}</p>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" className="btn btn-gold" onClick={() => setRound(3)}>Next: create your app →</button>
          </section>
        )}

        {round === 3 && (
          <section className="card" style={{ padding: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, margin: "0 0 6px" }}>Round 3 · Create the app on your computer</h2>
            <p style={{ fontSize: 14, color: "var(--muted)", margin: "0 0 16px" }}>Open your terminal and run these, one at a time. Copy buttons do the typing.</p>
            <Command cmd="cd ~/OpenMirror" why="Go to the folder where your projects live." />
            <Command cmd={`npx create-next-app@latest ${folder}`} why="Create a brand-new Next.js app. Say yes to the defaults." />
            <Command cmd={`cd ${folder}`} why="Step inside your new app's folder." />
            <Command cmd="npm run dev" why="Start it. Open http://localhost:3000 in your browser — that's your app." />
            <button type="button" className="btn btn-gold" onClick={() => setRound(4)}>Next: save it to GitHub →</button>
          </section>
        )}

        {round === 4 && (
          <section className="card" style={{ padding: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, margin: "0 0 6px" }}>Round 4 · Save it to GitHub</h2>
            <p style={{ fontSize: 14, color: "var(--muted)", margin: "0 0 16px" }}>Git saves a snapshot; GitHub keeps it safe online.</p>
            <Command cmd="git add ." why="Gather every file for the snapshot." />
            <Command cmd={`git commit -m "First working version"`} why="Take the snapshot and label it." />
            <Command cmd={`gh repo create ${folder} --source=. --private --push`} why="Create the GitHub repo and upload — one command (needs the gh tool)." />
            <p style={{ fontSize: 13, fontWeight: 800, margin: "18px 0 8px", color: "var(--gold)" }}>No gh tool? The manual way:</p>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 10px" }}>Create an empty repo on github.com, copy its URL, then:</p>
            <Command cmd="git remote add origin REMOTE-URL" why="Tell git where its online home is (paste your repo URL)." />
            <Command cmd="git push -u origin main" why="Upload your code to GitHub." />
            <button type="button" className="btn btn-gold" onClick={() => setRound(5)}>Next: put it on the internet →</button>
          </section>
        )}

        {round === 5 && (
          <section className="card" style={{ padding: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, margin: "0 0 6px" }}>Round 5 · Deploy to Vercel</h2>
            <p style={{ fontSize: 14, color: "var(--muted)", margin: "0 0 14px" }}>No commands this round — Vercel does the lifting.</p>
            <ol style={{ fontSize: 14, lineHeight: 1.9, color: "var(--text)", paddingLeft: 20, margin: "0 0 14px" }}>
              <li>Go to <strong>vercel.com</strong> and sign in with GitHub (free).</li>
              <li>Click <strong>Add New → Project</strong> and import <strong>{folder}</strong>.</li>
              <li>Click <strong>Deploy</strong>. That's it.</li>
              <li>You get a live link like <strong>{folder}.vercel.app</strong> — share it today.</li>
            </ol>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 16px" }}>
              From now on, every <code>git push</code> updates the live site automatically.
            </p>
            <button type="button" className="btn btn-gold" onClick={() => setRound(6)}>Next: your own domain →</button>
          </section>
        )}

        {round === 6 && (
          <section className="card" style={{ padding: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, margin: "0 0 6px" }}>Round 6 · Connect your GoDaddy domain</h2>
            <p style={{ fontSize: 14, color: "var(--muted)", margin: "0 0 14px" }}>
              GoDaddy is where the domain lives. Vercel is where the app lives. DNS points the domain to the app.
            </p>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 14px" }}>
              In Vercel: Project → Settings → Domains → add your domain. Vercel shows the exact records. Then in GoDaddy → DNS, add them:
            </p>
            <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, padding: 14, marginBottom: 10 }}>
              <p style={{ fontSize: 13, fontWeight: 800, margin: "0 0 6px", color: "var(--gold)" }}>Root domain (yourname.com)</p>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: 0, lineHeight: 1.8 }}>
                Type: <strong style={{ color: "var(--text)" }}>A</strong> · Name: <strong style={{ color: "var(--text)" }}>@</strong> · Value: <strong style={{ color: "var(--text)" }}>copy the exact A record from Vercel (commonly 76.76.21.21)</strong> · TTL: default
              </p>
            </div>
            <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, padding: 14, marginBottom: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 800, margin: "0 0 6px", color: "var(--gold)" }}>www (www.yourname.com)</p>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: 0, lineHeight: 1.8 }}>
                Type: <strong style={{ color: "var(--text)" }}>CNAME</strong> · Name: <strong style={{ color: "var(--text)" }}>www</strong> · Value: <strong style={{ color: "var(--text)" }}>copy the exact CNAME from Vercel</strong> · TTL: default
              </p>
            </div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--gold)", margin: "0 0 16px" }}>
              ⚠️ Always copy the exact record values Vercel shows for your project. DNS can take minutes — or up to 48 hours.
            </p>
            <button type="button" className="btn btn-gold" onClick={() => setRound(7)}>🎁 Get your Starter Kit →</button>
          </section>
        )}

        {round === 7 && (
          <section>
            <div className="card" style={{ padding: 20, marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
                <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>🎁 Your Web App Starter Kit</h2>
                <CopyBtn text={kit} label="Copy kit" />
              </div>
              <pre style={{ fontSize: 12.5, color: "var(--muted)", whiteSpace: "pre-wrap", margin: 0, lineHeight: 1.7, fontFamily: "inherit" }}>{kit}</pre>
            </div>
            <PromptBlock title="💬 Paste into ChatGPT (plan your pages)" text={chatgptPrompt} />
            <PromptBlock title="🤖 Paste into Claude Code (build it)" text={claudePrompt} />
            <div className="card" style={{ padding: 20, marginBottom: 14 }}>
              <h3 style={{ fontSize: 16, fontWeight: 900, margin: "0 0 6px" }}>🆘 I'm stuck</h3>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 12px" }}>Fill these in, copy the prompt, paste it into ChatGPT. That's how everyone debugs.</p>
              {(["ran", "expected", "got"] as const).map((k) => (
                <textarea
                  key={k}
                  value={stuck[k]}
                  onChange={(e) => setStuck((s) => ({ ...s, [k]: e.target.value }))}
                  placeholder={k === "ran" ? "What did you run?" : k === "expected" ? "What did you expect?" : "Paste the exact error"}
                  rows={2}
                  style={{ width: "100%", boxSizing: "border-box", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "var(--text)", marginBottom: 8, resize: "vertical" }}
                />
              ))}
              <PromptBlock title="Your error helper prompt" text={stuckPrompt} />
            </div>
            <p style={{ fontSize: 13, color: "var(--muted)", textAlign: "center" }}>
              You did it. Idea → live on the internet. 🥊{" "}
              <a href="/" style={{ color: "var(--gold)", fontWeight: 800, textDecoration: "none" }}>Back to Step In The Ring →</a>
            </p>
          </section>
        )}
      </div>
    </main>
  );
}

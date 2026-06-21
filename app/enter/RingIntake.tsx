"use client";

import { FormEvent, useEffect, useState } from "react";

type BuildCard = {
  projectName: string;
  dream: string;
  audience: string;
  helpsWith: string;
  appKind: string;
  smallestVersion: string;
  firstScreen: string;
  firstButton: string;
};

const storageKey = "step-in-the-ring-build-card-v1";

const emptyCard: BuildCard = {
  projectName: "",
  dream: "",
  audience: "",
  helpsWith: "",
  appKind: "Simple web app",
  smallestVersion: "",
  firstScreen: "",
  firstButton: "",
};

function valueFrom(form: FormData, key: keyof BuildCard) {
  return String(form.get(key) || "").trim();
}

export default function RingIntake() {
  const [card, setCard] = useState<BuildCard | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      try {
        setCard(JSON.parse(saved) as BuildCard);
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const nextCard: BuildCard = {
      projectName: valueFrom(form, "projectName") || "Untitled project",
      dream: valueFrom(form, "dream"),
      audience: valueFrom(form, "audience"),
      helpsWith: valueFrom(form, "helpsWith"),
      appKind: valueFrom(form, "appKind"),
      smallestVersion: valueFrom(form, "smallestVersion"),
      firstScreen: valueFrom(form, "firstScreen"),
      firstButton: valueFrom(form, "firstButton"),
    };

    setCard(nextCard);
    window.localStorage.setItem(storageKey, JSON.stringify(nextCard));
  }

  function clearCard() {
    setCard(null);
    window.localStorage.removeItem(storageKey);
  }

  return (
    <section className="section">
      <div className="grid two">
        <form className="form-card" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="projectName">What should we call this project?</label>
            <input
              id="projectName"
              name="projectName"
              placeholder="Example: Family Chore Quest"
              defaultValue={card?.projectName || emptyCard.projectName}
            />
          </div>

          <div className="field">
            <label htmlFor="dream">What is the idea?</label>
            <textarea
              id="dream"
              name="dream"
              placeholder="Describe the idea in normal words."
              defaultValue={card?.dream || emptyCard.dream}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="audience">Who is it for?</label>
            <input
              id="audience"
              name="audience"
              placeholder="Kids, parents, coaches, churches, teams, customers..."
              defaultValue={card?.audience || emptyCard.audience}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="helpsWith">What should it help them do?</label>
            <textarea
              id="helpsWith"
              name="helpsWith"
              placeholder="What problem does it solve or what useful thing does it create?"
              defaultValue={card?.helpsWith || emptyCard.helpsWith}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="appKind">What kind of app is it?</label>
            <select
              id="appKind"
              name="appKind"
              defaultValue={card?.appKind || emptyCard.appKind}
            >
              <option>Simple web app</option>
              <option>Game</option>
              <option>Journal</option>
              <option>Tracker</option>
              <option>Learning app</option>
              <option>Faith app</option>
              <option>Family app</option>
              <option>Business tool</option>
              <option>Community project</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="smallestVersion">
              What is the smallest useful version?
            </label>
            <textarea
              id="smallestVersion"
              name="smallestVersion"
              placeholder="The tiny first version we can actually build and test."
              defaultValue={card?.smallestVersion || emptyCard.smallestVersion}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="firstScreen">What should the first screen say?</label>
            <textarea
              id="firstScreen"
              name="firstScreen"
              placeholder="Write the first thing the user sees."
              defaultValue={card?.firstScreen || emptyCard.firstScreen}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="firstButton">What should the first button do?</label>
            <input
              id="firstButton"
              name="firstButton"
              placeholder="Start, Deal, Create, Save, Ask me questions..."
              defaultValue={card?.firstButton || emptyCard.firstButton}
              required
            />
          </div>

          <div className="action-row">
            <button className="button primary" type="submit">
              Create Build Card
            </button>
            <button className="button secondary" type="button" onClick={clearCard}>
              Start over
            </button>
          </div>
        </form>

        <BuildCardPreview card={card} />
      </div>
    </section>
  );
}

function BuildCardPreview({ card }: { card: BuildCard | null }) {
  if (!card) {
    return (
      <aside className="build-card">
        <span className="badge">Build Card preview</span>
        <h2>Your first card appears here.</h2>
        <p>
          Answer the questions to turn a rough idea into a clean MVP1 starting point.
        </p>
      </aside>
    );
  }

  return (
    <aside className="build-card">
      <span className="badge">MVP1 Build Card</span>
      <h2>{card.projectName}</h2>
      <dl>
        <div>
          <dt>Dream</dt>
          <dd>{card.dream}</dd>
        </div>
        <div>
          <dt>Audience</dt>
          <dd>{card.audience}</dd>
        </div>
        <div>
          <dt>Helps with</dt>
          <dd>{card.helpsWith}</dd>
        </div>
        <div>
          <dt>App kind</dt>
          <dd>{card.appKind}</dd>
        </div>
        <div>
          <dt>Smallest useful version</dt>
          <dd>{card.smallestVersion}</dd>
        </div>
        <div>
          <dt>First screen</dt>
          <dd>{card.firstScreen}</dd>
        </div>
        <div>
          <dt>First button</dt>
          <dd>{card.firstButton}</dd>
        </div>
        <div>
          <dt>Next round</dt>
          <dd>
            Turn this card into a one-page prototype, test it with one person, then improve what feels confusing.
          </dd>
        </div>
      </dl>
    </aside>
  );
}

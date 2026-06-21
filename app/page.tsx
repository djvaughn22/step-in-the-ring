"use client";

import { FormEvent, useEffect, useState } from "react";

type Plan = {
  idea: string;
  user: string;
  firstVersion: string;
  firstScreen: string;
  nextStep: string;
};

const storageKey = "first-version-simple-plan-v1";

function makePlan(rawIdea: string): Plan {
  const idea = rawIdea.trim();

  return {
    idea,
    user: "The first person who would actually use this.",
    firstVersion:
      "One simple screen that proves the idea is useful before adding more features.",
    firstScreen:
      "A clear headline, one short explanation, and one action the user can take.",
    nextStep:
      "Write the first screen in plain language. Then ask AI to build only that screen.",
  };
}

export default function Home() {
  const [idea, setIdea] = useState("");
  const [plan, setPlan] = useState<Plan | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as Plan;
      setPlan(parsed);
      setIdea(parsed.idea);
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextPlan = makePlan(idea);
    setPlan(nextPlan);
    window.localStorage.setItem(storageKey, JSON.stringify(nextPlan));
  }

  function clearPlan() {
    setIdea("");
    setPlan(null);
    window.localStorage.removeItem(storageKey);
  }

  return (
    <main>
      <header>
        <div className="logo">first version</div>
      </header>

      <section>
        <h1>What do you want to build?</h1>
        <p className="lede">
          Describe the idea. Get a smaller first version and a practical next
          step.
        </p>

        <form className="form" onSubmit={handleSubmit}>
          <label htmlFor="idea">Your idea</label>
          <textarea
            id="idea"
            value={idea}
            onChange={(event) => setIdea(event.target.value)}
            placeholder="Example: I want to make a simple app that helps my kids track chores and earn points."
            required
          />

          <div className="actions">
            <button type="submit">Make a first plan</button>
            {plan && (
              <button className="secondary" type="button" onClick={clearPlan}>
                Clear
              </button>
            )}
          </div>
        </form>
      </section>

      {plan && (
        <section className="result">
          <h2>First plan</h2>

          <div className="plan">
            <div className="plan-item">
              <strong>Idea</strong>
              <p>{plan.idea}</p>
            </div>

            <div className="plan-item">
              <strong>First user</strong>
              <p>{plan.user}</p>
            </div>

            <div className="plan-item">
              <strong>Smallest first version</strong>
              <p>{plan.firstVersion}</p>
            </div>

            <div className="plan-item">
              <strong>First screen</strong>
              <p>{plan.firstScreen}</p>
            </div>

            <div className="plan-item">
              <strong>Next step</strong>
              <p>{plan.nextStep}</p>
            </div>
          </div>
        </section>
      )}

      <footer>Private test. No account. No payment. Just the first step.</footer>
    </main>
  );
}

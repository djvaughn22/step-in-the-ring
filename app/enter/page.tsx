import RingIntake from "./RingIntake";

export default function EnterPage() {
  return (
    <main className="main">
      <section className="page-hero">
        <p className="eyebrow">Start</p>
        <h1>Start with the idea in front of you.</h1>
        <p className="lede">
          This private-test version helps shape a rough idea into a clear MVP1
          Build Card and saves it in this browser.
        </p>
      </section>

      <RingIntake />
    </main>
  );
}

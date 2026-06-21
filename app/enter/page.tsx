import RingIntake from "./RingIntake";

export default function EnterPage() {
  return (
    <main className="main">
      <section className="page-hero">
        <p className="eyebrow">◎ Enter the Ring</p>
        <h1>Bring the dream. Leave with a Build Card.</h1>
        <p className="lede">
          This first family-test version does not use an AI API, login, payment,
          or database. It simply helps shape a dream into a clear MVP1 starting
          card and saves it in this browser.
        </p>
      </section>

      <RingIntake />
    </main>
  );
}

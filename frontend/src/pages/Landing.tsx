import { Notice } from "../components/Notice";

/* Checkpoint 1 placeholder: the desk surface and its notice. Replaced by the
   full landing composition in checkpoint 3. */
export function Landing({ navigate }: { navigate: (to: string) => void }) {
  return (
    <main className="desk">
      <section className="wrap">
        <h1>Paid in stock. Released by the work, or by the calendar.</h1>
        <button className="btn btn-light" onClick={() => navigate("/employer/fund")}>
          Give a bonus
        </button>
      </section>
      <Notice surface="desk" />
    </main>
  );
}

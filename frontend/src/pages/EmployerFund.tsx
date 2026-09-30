/* Checkpoint 1 placeholder. The fund flow and its live certificate land in
   checkpoint 4. */
export function EmployerFund({ navigate }: { navigate: (to: string) => void }) {
  return (
    <main className="wrap">
      <h1>Give a bonus.</h1>
      <p>Set the terms once.</p>
      <button className="text-action" onClick={() => navigate("/employer/grants")}>
        Open your bonuses
      </button>
    </main>
  );
}

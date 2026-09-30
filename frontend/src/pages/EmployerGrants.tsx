/* Checkpoint 1 placeholder. The register lands in checkpoint 6. */
export function EmployerGrants({ navigate }: { navigate: (to: string) => void }) {
  return (
    <main className="wrap">
      <h1>Your bonuses.</h1>
      <button className="text-action" onClick={() => navigate("/employer/fund")}>
        Give a bonus
      </button>
    </main>
  );
}

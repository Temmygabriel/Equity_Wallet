/* The strap is the lock. There is no padlock icon anywhere in this product.
   It is always mounted; the certificate's data-s attribute slides it in, away,
   or holds it across the middle. */
export function Strap({ releaseDate }: { releaseDate: string }) {
  return (
    <div className="strap">
      <i>Held</i> until {shortDate(releaseDate)}, or until released
    </div>
  );
}

/* The strap reads "15 October" where the certificate reads "15 October 2026",
   so the year is trimmed. releaseDate is always the en-GB long format. */
export function shortDate(releaseDate: string): string {
  return releaseDate.replace(/\s+\d{4}$/, "");
}

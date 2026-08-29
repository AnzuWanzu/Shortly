export function DashboardPage() {
  return (
    <section className="mx-auto max-w-6xl" aria-labelledby="dashboard-heading">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet">
        Workspace
      </p>
      <h1
        id="dashboard-heading"
        className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-ink"
      >
        Shorten a link
      </h1>
      <p className="mt-2 text-sm text-muted">
        Create a compact link and keep it available for later.
      </p>
    </section>
  );
}

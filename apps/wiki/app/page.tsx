// Public landing page: answers 200 without a session and touches no database.
export default function Welcome() {
  return (
    <main>
      <h1>Team Wiki</h1>
      <p>Shared pages for the team, with editing, revision history and search.</p>
      <p>
        <a href="/login">Sign in</a> to read and edit pages. Already signed in? Go to the{' '}
        <a href="/recent">recent changes</a>.
      </p>
    </main>
  );
}

import { useLogout, useMe } from "../hooks/useAuth";

// Placeholder landing page — replaced by the real /feed page in Phase 4.
export function HomePage() {
  const { data: user } = useMe();
  const logoutMutation = useLogout();

  return (
    <main>
      <h1>NewsHub</h1>
      <p>Logged in as {user?.email}</p>
      <button onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending}>
        Log out
      </button>
    </main>
  );
}

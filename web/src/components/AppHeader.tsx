import { Link } from "react-router-dom";
import { useLogout, useMe } from "../hooks/useAuth";

export function AppHeader() {
  const { data: user } = useMe();
  const logoutMutation = useLogout();

  return (
    <header>
      <Link to="/feed">NewsHub</Link>
      {" | "}
      <Link to="/organizations">Organizations</Link>
      {user && (
        <>
          {" — "}
          {user.email}{" "}
          <button onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending}>
            Log out
          </button>
        </>
      )}
    </header>
  );
}

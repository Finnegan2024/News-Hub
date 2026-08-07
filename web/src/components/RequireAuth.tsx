import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useMe } from "../hooks/useAuth";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { data: user, isPending } = useMe();

  if (isPending) {
    return <p>Loading…</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

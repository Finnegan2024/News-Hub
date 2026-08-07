import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useLogin } from "../hooks/useAuth";
import { ApiError } from "../lib/api";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const loginMutation = useLogin();
  const navigate = useNavigate();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    loginMutation.mutate(
      { email, password },
      { onSuccess: () => navigate("/") },
    );
  }

  return (
    <main>
      <h1>Log in</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={loginMutation.isPending}>
          Log in
        </button>
      </form>
      {loginMutation.isError && (
        <p role="alert">
          {loginMutation.error instanceof ApiError
            ? loginMutation.error.message
            : "Something went wrong."}
        </p>
      )}
      <p>
        Need an account? <Link to="/register">Register</Link>
      </p>
    </main>
  );
}

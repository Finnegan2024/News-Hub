import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useRegister } from "../hooks/useAuth";
import { ApiError } from "../lib/api";

export function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const registerMutation = useRegister();
  const navigate = useNavigate();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    registerMutation.mutate(
      { email, password },
      { onSuccess: () => navigate("/") },
    );
  }

  return (
    <main>
      <h1>Register</h1>
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
            minLength={8}
            required
          />
        </label>
        <button type="submit" disabled={registerMutation.isPending}>
          Register
        </button>
      </form>
      {registerMutation.isError && (
        <p role="alert">
          {registerMutation.error instanceof ApiError
            ? registerMutation.error.message
            : "Something went wrong."}
        </p>
      )}
      <p>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </main>
  );
}

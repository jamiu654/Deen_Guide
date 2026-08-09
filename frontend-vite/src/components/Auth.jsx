import { useState } from "react";
import apiClient from "../apiClient";

const BACKEND_AUTH = `${apiClient.API_BASE}/auth`;

export default function Auth({ onAuthChange }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const endpoint = isRegister ? "register" : "login";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const payload = {
      username: username.trim(),
      password,
    };

    if (isRegister) {
      payload.email = email.trim();
      payload.passwordConfirm = confirmPassword;
    }

    try {
      const response = await fetch(`${BACKEND_AUTH}/${endpoint}/`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      let data = null;
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        data = await response.json();
        console.log("REGISTER RESPONSE:", data);
      } else {
        const text = await response.text();
        throw new Error(
          `Server returned non-JSON response: ${text.slice(0, 500)}`,
        );
      }
      if (!response.ok) {
        setError(data.error || "Authentication failed.");
        return;
      }
      onAuthChange({ username: data.username, email: data.email || "" });
      setSuccess(
        isRegister
          ? "Account created successfully."
          : "Logged in successfully.",
      );
      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        `Unable to reach the authentication service.${
          err?.message ? ` (${err.message})` : ""
        }`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card section-card">
      <h2>{isRegister ? "Create an account" : "Log in"}</h2>
      <p className="section-intro">
        {isRegister
          ? "Create a new Deen Guide account to save progress and access your bookmarks across devices."
          : "Log in to continue using your dashboard, bookmarks, and study tools."}
      </p>
      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          Username
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </label>
        {isRegister && (
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
        )}
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        {isRegister && (
          <label>
            Confirm password
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </label>
        )}
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <div className="auth-actions">
          <button type="submit" disabled={loading}>
            {loading ? "Working..." : isRegister ? "Create account" : "Log in"}
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setIsRegister((register) => !register);
              setError("");
              setSuccess("");
            }}
          >
            {isRegister
              ? "Already have an account? Log in"
              : "Create an account"}
          </button>
        </div>
      </form>
    </section>
  );
}

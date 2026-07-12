import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen flex dark" style={{ background: "var(--hq-bg)" }}>
      {/* ── Brand panel ── */}
      <div
        className="hidden md:flex md:w-[42%] flex-col justify-between p-10 relative overflow-hidden"
        style={{ background: "var(--hq-panel-2)", borderRight: "1px solid var(--hq-border)" }}
      >
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, transparent, transparent 22px, color-mix(in srgb, var(--hq-amber) 6%, transparent) 22px, color-mix(in srgb, var(--hq-amber) 6%, transparent) 23px)",
          }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <span
              className="w-9 h-9 flex items-center justify-center font-display font-bold text-lg"
              style={{ background: "var(--hq-amber)", color: "#0a0b0d" }}
            >
              T
            </span>
            <span className="font-display font-bold text-2xl tracking-wide" style={{ color: "var(--hq-text)" }}>
              TransitOps
            </span>
          </div>
          <p className="text-sm mt-2 font-mono-hq" style={{ color: "var(--hq-text-dim)" }}>
            Smart Transport Operations Platform
          </p>
        </div>

        <div className="relative z-10">
          <p
            className="text-[11px] font-mono-hq uppercase tracking-[0.16em] mb-3"
            style={{ color: "var(--hq-amber)" }}
          >
            One login · Four roles
          </p>
          <ul className="space-y-2">
            {["Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst"].map((r) => (
              <li key={r} className="flex items-center gap-2 text-sm" style={{ color: "var(--hq-text)" }}>
                <span className="w-1 h-1" style={{ background: "var(--hq-amber)" }} />
                {r}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 text-[10px] font-mono-hq" style={{ color: "var(--hq-text-dim)" }}>
          TRANSITOPS © 2026 · RBAC ENABLED
        </div>
      </div>

      {/* ── Form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="hq-panel hq-rise w-full max-w-sm p-7">
          <h1 className="font-display font-bold text-xl" style={{ color: "var(--hq-text)" }}>
            Sign in to your account
          </h1>
          <p className="text-sm mt-1 mb-6" style={{ color: "var(--hq-text-dim)" }}>
            Enter your credentials to continue
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-[0.12em] font-mono-hq" style={{ color: "var(--hq-text-dim)" }}>
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="hq-glow w-full mt-1.5 px-3 py-2.5 text-sm border outline-none font-mono-hq"
                style={{ background: "var(--hq-bg)", borderColor: "var(--hq-border)", color: "var(--hq-text)" }}
                placeholder="you@transitops.in"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.12em] font-mono-hq" style={{ color: "var(--hq-text-dim)" }}>
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="hq-glow w-full mt-1.5 px-3 py-2.5 text-sm border outline-none font-mono-hq"
                style={{ background: "var(--hq-bg)", borderColor: "var(--hq-border)", color: "var(--hq-text)" }}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div
                className="text-sm px-3 py-2 border font-mono-hq"
                style={{ color: "#ff4757", borderColor: "#ff475755", background: "#ff475714" }}
              >
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 font-display font-semibold text-sm tracking-wide transition-opacity hover:opacity-90"
              style={{ background: "var(--hq-amber)", color: "#0a0b0d" }}
            >
              SIGN IN
            </button>
          </form>

          <p className="text-sm mt-5 text-center" style={{ color: "var(--hq-text-dim)" }}>
            No account?{" "}
            <Link to="/signup" style={{ color: "var(--hq-amber)" }}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

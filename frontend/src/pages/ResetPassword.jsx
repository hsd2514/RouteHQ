import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import client from "../api/client";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });

    if (!token) {
      setStatus({ type: "error", message: "Missing reset token. Please use the link from your email." });
      return;
    }

    if (password !== confirmPassword) {
      setStatus({ type: "error", message: "Passwords do not match." });
      return;
    }

    if (password.length < 6) {
      setStatus({ type: "error", message: "Password must be at least 6 characters long." });
      return;
    }

    setLoading(true);
    
    try {
      const response = await client.post("/auth/reset-password", { 
        token, 
        new_password: password 
      });
      setStatus({ type: "success", message: response.data.message });
      // Redirect after short delay
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setStatus({ 
        type: "error", 
        message: err.response?.data?.detail || "Invalid or expired reset token." 
      });
    } finally {
      setLoading(false);
    }
  };

  if (!token && !status.message) {
    return (
      <div className="min-h-screen flex items-center justify-center dark p-6" style={{ background: "var(--hq-bg)" }}>
        <div className="hq-panel w-full max-w-sm p-7 text-center">
          <p className="text-sm font-mono-hq mb-4" style={{ color: "#ff4757" }}>
            Invalid or missing reset token.
          </p>
          <Link
            to="/forgot-password"
            className="inline-block px-4 py-2 font-display font-semibold text-sm tracking-wide transition-opacity hover:opacity-90"
            style={{ background: "var(--hq-amber)", color: "#0a0b0d" }}
          >
            REQUEST NEW LINK
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center dark p-6" style={{ background: "var(--hq-bg)" }}>
      <div className="hq-panel hq-rise w-full max-w-sm p-7">
        <h1 className="font-display font-bold text-xl" style={{ color: "var(--hq-text)" }}>
          Reset Password
        </h1>
        <p className="text-sm mt-1 mb-6" style={{ color: "var(--hq-text-dim)" }}>
          Enter your new password below.
        </p>

        {status.message && status.type === "success" ? (
          <div className="space-y-4">
            <div
              className="text-sm px-3 py-3 border font-mono-hq rounded-sm text-center"
              style={{
                color: "#10b981",
                borderColor: "#10b98155",
                background: "#10b98114",
              }}
            >
              {status.message}
              <br />
              Redirecting to login...
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-[0.12em] font-mono-hq" style={{ color: "var(--hq-text-dim)" }}>
                New Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="hq-glow w-full mt-1.5 px-3 py-2.5 text-sm border outline-none font-mono-hq"
                style={{ background: "var(--hq-bg)", borderColor: "var(--hq-border)", color: "var(--hq-text)" }}
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-[0.12em] font-mono-hq" style={{ color: "var(--hq-text-dim)" }}>
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="hq-glow w-full mt-1.5 px-3 py-2.5 text-sm border outline-none font-mono-hq"
                style={{ background: "var(--hq-bg)", borderColor: "var(--hq-border)", color: "var(--hq-text)" }}
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            {status.type === "error" && (
              <div
                className="text-sm px-3 py-2 border font-mono-hq"
                style={{ color: "#ff4757", borderColor: "#ff475755", background: "#ff475714" }}
              >
                ⚠ {status.message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 font-display font-semibold text-sm tracking-wide transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: "var(--hq-amber)", color: "#0a0b0d" }}
            >
              {loading ? "RESETTING..." : "RESET PASSWORD"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

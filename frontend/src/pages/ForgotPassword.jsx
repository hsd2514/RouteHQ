import { useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });
    setLoading(true);
    
    try {
      const response = await client.post("/auth/forgot-password", { email });
      setStatus({ type: "success", message: response.data.message });
    } catch (err) {
      setStatus({ 
        type: "error", 
        message: err.response?.data?.detail || "An error occurred." 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center dark p-6" style={{ background: "var(--hq-bg)" }}>
      <div className="hq-panel hq-rise w-full max-w-sm p-7">
        <h1 className="font-display font-bold text-xl" style={{ color: "var(--hq-text)" }}>
          Forgot Password
        </h1>
        <p className="text-sm mt-1 mb-6" style={{ color: "var(--hq-text-dim)" }}>
          Enter your email to receive a reset link.
        </p>

        {status.message ? (
          <div className="space-y-4">
            <div
              className="text-sm px-3 py-3 border font-mono-hq rounded-sm"
              style={{
                color: status.type === "success" ? "#10b981" : "#ff4757",
                borderColor: status.type === "success" ? "#10b98155" : "#ff475755",
                background: status.type === "success" ? "#10b98114" : "#ff475714",
              }}
            >
              {status.message}
            </div>
            {status.type === "success" && (
              <Link
                to="/login"
                className="block text-center w-full py-2.5 font-display font-semibold text-sm tracking-wide transition-opacity hover:opacity-90"
                style={{ background: "var(--hq-amber)", color: "#0a0b0d" }}
              >
                RETURN TO LOGIN
              </Link>
            )}
            {status.type === "error" && (
              <button
                onClick={() => setStatus({ type: "", message: "" })}
                className="w-full py-2.5 font-display font-semibold text-sm tracking-wide transition-opacity hover:opacity-90 border"
                style={{ background: "var(--hq-panel-2)", color: "var(--hq-text)", borderColor: "var(--hq-border)" }}
              >
                TRY AGAIN
              </button>
            )}
          </div>
        ) : (
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
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 font-display font-semibold text-sm tracking-wide transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: "var(--hq-amber)", color: "#0a0b0d" }}
            >
              {loading ? "SENDING..." : "SEND RESET LINK"}
            </button>
          </form>
        )}

        <p className="text-sm mt-5 text-center" style={{ color: "var(--hq-text-dim)" }}>
          Remember your password?{" "}
          <Link to="/login" style={{ color: "var(--hq-amber)" }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

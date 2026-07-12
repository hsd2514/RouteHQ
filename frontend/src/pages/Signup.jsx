import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLES = [
  { value: "fleet_manager", label: "Fleet Manager" },
  { value: "driver", label: "Dispatcher" },
  { value: "safety_officer", label: "Safety Officer" },
  { value: "financial_analyst", label: "Financial Analyst" },
];

const fieldLabelCls = "text-[10px] uppercase tracking-[0.12em] font-mono-hq";
const fieldCls = "hq-glow w-full mt-1.5 px-3 py-2.5 text-sm border outline-none font-mono-hq";
const fieldStyle = { background: "var(--hq-bg)", borderColor: "var(--hq-border)", color: "var(--hq-text)" };

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "fleet_manager" });
  const [error, setError] = useState("");

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await signup(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen dark flex items-center justify-center p-6" style={{ background: "var(--hq-bg)" }}>
      <div className="hq-panel hq-rise w-full max-w-sm p-7">
        <div className="flex items-center gap-2.5 mb-6">
          <span
            className="w-8 h-8 flex items-center justify-center font-display font-bold"
            style={{ background: "var(--hq-amber)", color: "#0a0b0d" }}
          >
            T
          </span>
          <span className="font-display font-bold text-lg" style={{ color: "var(--hq-text)" }}>
            TransitOps
          </span>
        </div>

        <h1 className="font-display font-bold text-xl" style={{ color: "var(--hq-text)" }}>
          Create account
        </h1>
        <p className="text-sm mt-1 mb-6" style={{ color: "var(--hq-text-dim)" }}>
          Join the operations platform
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={fieldLabelCls} style={{ color: "var(--hq-text-dim)" }}>Name</label>
            <input required value={form.name} onChange={(e) => update("name", e.target.value)} className={fieldCls} style={fieldStyle} />
          </div>
          <div>
            <label className={fieldLabelCls} style={{ color: "var(--hq-text-dim)" }}>Email</label>
            <input type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} className={fieldCls} style={fieldStyle} />
          </div>
          <div>
            <label className={fieldLabelCls} style={{ color: "var(--hq-text-dim)" }}>Password</label>
            <input type="password" required value={form.password} onChange={(e) => update("password", e.target.value)} className={fieldCls} style={fieldStyle} />
          </div>
          <div>
            <label className={fieldLabelCls} style={{ color: "var(--hq-text-dim)" }}>Role</label>
            <select value={form.role} onChange={(e) => update("role", e.target.value)} className={fieldCls} style={fieldStyle}>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="text-sm px-3 py-2 border font-mono-hq" style={{ color: "#ff4757", borderColor: "#ff475755", background: "#ff475714" }}>
              ⚠ {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 font-display font-semibold text-sm tracking-wide transition-opacity hover:opacity-90"
            style={{ background: "var(--hq-amber)", color: "#0a0b0d" }}
          >
            CREATE ACCOUNT
          </button>
        </form>

        <p className="text-sm mt-5 text-center" style={{ color: "var(--hq-text-dim)" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--hq-amber)" }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

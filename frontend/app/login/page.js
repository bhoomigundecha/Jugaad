"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowUpRight } from "lucide-react";
import { loginWithEmail } from "@/lib/auth";

export default function LoginPage() {
  const router   = useRouter();
  const [tab, setTab]           = useState("signin");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setError("");
    setLoading(true);
    try {
      loginWithEmail(email.trim(), password);
      router.push("/home");
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: "var(--jugaad-purple)" }}>

      {/* ── Header ── */}
      <div className="-mt-4 pt-10 pb-8 px-6 text-center">
        <h1
          className="text-white leading-none"
          style={{
            fontFamily: "var(--font-playfair), Georgia, serif",
            fontSize: 48,
            fontWeight: 900,
            letterSpacing: "-0.02em",
          }}
        >
          Jugaad
        </h1>
        <p className="text-purple-200 text-xs mt-1 tracking-widest uppercase">
          Mol karo · Save karo
        </p>
      </div>

      {/* ── White bottom card ── */}
      <div
        className="mt-10 mx-4 rounded-3xl px-6 pt-7 pb-8 mb-8"
        style={{ background: "#fff", boxShadow: "0 8px 40px rgba(0,0,0,0.25)" }}
      >
        {/* Tab switcher */}
        <div
          className="flex gap-1 p-1 rounded-2xl mb-7"
          style={{ background: "#f3f4f6" }}
        >
          {["signin", "signup"].map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(""); }}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
              style={tab === t
                ? { background: "var(--jugaad-purple)", color: "#fff" }
                : { color: "#9ca3af" }
              }
            >
              {t === "signin" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* Heading */}
        <p className="text-2xl font-black text-gray-900 mb-1">
          {tab === "signin" ? "Welcome back!" : "Create account"}
        </p>
        <p className="text-sm text-gray-400 mb-6">
          {tab === "signin" ? "Sign in to start negotiating." : "Join Jugaad and start saving."}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="bhoomigundecha@gmail.com"
              autoComplete="email"
              style={{
                display: "block", width: "100%",
                padding: "14px 16px", borderRadius: 16,
                border: "1.5px solid #e5e7eb",
                fontSize: 14, color: "#111", outline: "none",
                background: "#fafafa",
              }}
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Password
              </label>
              <button type="button" className="text-xs font-medium"
                style={{ color: "var(--jugaad-purple-light)" }}>
                Forgot?
              </button>
            </div>
            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={tab === "signin" ? "current-password" : "new-password"}
                style={{
                  display: "block", width: "100%",
                  padding: "14px 48px 14px 16px", borderRadius: 16,
                  border: "1.5px solid #e5e7eb",
                  fontSize: 14, color: "#111", outline: "none",
                  background: "#fafafa",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                style={{
                  position: "absolute", right: 14,
                  top: "50%", transform: "translateY(-50%)",
                  color: "#9ca3af", background: "none", border: "none",
                  cursor: "pointer", display: "flex",
                }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p style={{ color: "#ef4444", fontSize: 12, fontWeight: 600, marginTop: -4 }}>
              {error}
            </p>
          )}

          {/* Demo hint */}
          <p style={{ fontSize: 11, color: "#9ca3af", marginTop: -4 }}>
            Demo: <span style={{ fontFamily: "monospace" }}>bhoomigundecha@gmail.com</span> / <span style={{ fontFamily: "monospace" }}>bhoomi123</span>
          </p>

          {/* Sliding circle button */}
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full overflow-hidden rounded-full p-1 pl-7 pr-14 h-14
                       transition-all duration-500 ease-in-out
                       hover:pl-14 hover:pr-7 active:scale-95 cursor-pointer"
            style={{ background: "#111", opacity: loading ? 0.6 : 1, marginTop: 4 }}
          >
            <span className="relative z-10 text-white font-bold text-base tracking-wide transition-all duration-500">
              {loading ? "Signing in…" : tab === "signin" ? "Sign In" : "Create Account"}
            </span>
            <div className="absolute top-1 right-1 w-11 h-11 bg-white rounded-full
                            flex items-center justify-center
                            transition-all duration-500 ease-in-out
                            group-hover:right-[calc(100%-48px)] group-hover:rotate-45">
              <ArrowUpRight size={18} color="#111" strokeWidth={2.5} />
            </div>
          </button>
        </form>

        {/* Vendor link */}
        {/* <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <button
            onClick={() => router.push("/vendor")}
            className="text-sm text-gray-400"
          >
            Are you a vendor?{" "}
            <span className="font-semibold" style={{ color: "var(--jugaad-purple-light)" }}>
              Login here →
            </span>
          </button>
        </div> */}
      </div>
    </div>
  );
}

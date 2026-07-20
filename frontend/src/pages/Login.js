import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatApiErrorDetail } from "@/lib/api";
import { ThemeToggle } from "@/components/ThemeToggle";

const FORM_REVEAL = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, ease: "easeOut" } };

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      navigate("/");
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 bg-background lg:grid-cols-2">
      {/* Left: form */}
      <div className="relative flex flex-col justify-center px-8 py-12 sm:px-16 lg:px-20">
        <div className="absolute right-6 top-6"><ThemeToggle /></div>
        <motion.div
          {...FORM_REVEAL}
          className="mx-auto w-full max-w-sm"
        >
          <div className="mb-10 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center bg-primary text-primary-foreground">
              <FileText className="h-5 w-5" />
            </div>
            <div className="leading-none">
              <p className="text-[0.7rem] uppercase tracking-[0.25em] text-muted-foreground">Doc Pipeline</p>
              <p className="font-heading text-lg font-semibold tracking-tight text-foreground">Word → Excel</p>
            </div>
          </div>

          <h1 className="font-heading text-4xl font-semibold leading-none tracking-tight text-foreground sm:text-5xl">
            Sign in.
          </h1>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Extract Titles, Headings and body content from your Word files into structured spreadsheets.
          </p>

          <form onSubmit={submit} className="mt-10 space-y-5" data-testid="login-form">
            <div>
              <label className="mb-2 block text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">Username</label>
              <input
                data-testid="login-username-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-12 w-full border border-border bg-surface px-4 text-foreground outline-none transition-colors focus:border-primary"
                placeholder="admin"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="mb-2 block text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">Password</label>
              <input
                data-testid="login-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 w-full border border-border bg-surface px-4 text-foreground outline-none transition-colors focus:border-primary"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            {error && (
              <p data-testid="login-error" className="border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </p>
            )}
            <button
              data-testid="login-submit-button"
              type="submit"
              disabled={loading}
              className="group flex h-12 w-full items-center justify-center gap-2 bg-primary font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" style={{ transitionProperty: "transform" }} /></>}
            </button>
          </form>
          <p className="mt-6 text-xs text-muted-foreground">Default: <span className="font-mono text-foreground">admin / admin123</span></p>
        </motion.div>
      </div>

      {/* Right: banner */}
      <div className="relative hidden overflow-hidden border-l border-border bg-surface lg:block">
        <img
          src="https://images.pexels.com/photos/7827838/pexels-photo-7827838.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
          alt="Geometric shapes"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-primary/20 mix-blend-multiply" />
        <div className="absolute bottom-10 left-10 right-10">
          <p className="font-heading text-2xl font-semibold leading-tight tracking-tight text-white drop-shadow">
            Batch convert up to 200 documents into one clean spreadsheet.
          </p>
        </div>
      </div>
    </div>
  );
}

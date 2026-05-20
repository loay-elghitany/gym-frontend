import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, tenant } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);

      const returnTo = location.state?.from?.pathname;
      const destination =
        returnTo && returnTo !== "/login" ? returnTo : "/dashboard";

      navigate(destination, { replace: true });
    } catch (loginError) {
      setError(
        loginError?.response?.data?.message ||
          loginError?.message ||
          "Unable to sign in.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-12 sm:px-8 lg:flex-row lg:items-center lg:gap-12">
        <section className="mb-10 max-w-xl lg:mb-0 lg:flex-1">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_30px_60px_-30px_rgba(15,23,42,0.85)] backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-300/90">
              Gym SaaS Workspace
            </p>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Secure access for your team.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
              {tenant?.displayName
                ? `Enter your credentials to continue to ${tenant.displayName}.`
                : "Log in to manage your fitness workspace, schedules, and members with confidence."}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-900/70 p-4">
                <p className="text-sm font-semibold text-slate-100">
                  Quick access
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Bring your entire gym team together with personalized
                  dashboards.
                </p>
              </div>
              <div className="rounded-3xl bg-slate-900/70 p-4">
                <p className="text-sm font-semibold text-slate-100">
                  Secure sessions
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  All logins are protected with reliable session controls and
                  role-based access.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full max-w-md lg:flex-1">
          <div className="rounded-3xl border border-white/10 bg-slate-900/95 p-8 shadow-2xl shadow-slate-950/40">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-300/90">
                Welcome back
              </p>
              <h2 className="text-3xl font-semibold text-white">
                Sign in to continue
              </h2>
              <p className="text-sm text-slate-400">
                Use your gym workspace credentials to access your dashboard.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-3 w-full rounded-3xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-3 w-full rounded-3xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                />
              </div>

              {error && (
                <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-3xl bg-gradient-to-r from-sky-500 via-sky-400 to-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/20 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <div className="mt-7 border-t border-white/10 pt-5 text-sm text-slate-400">
              <p>
                Need help? Contact your gym administrator for account access.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

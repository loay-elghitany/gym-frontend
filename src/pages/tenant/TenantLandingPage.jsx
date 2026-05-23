import { useAuth } from "../../context/authContextValue";

export default function TenantLandingPage() {
  const { tenant } = useAuth();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 py-16 lg:px-8">
        <div className="rounded-4xl border border-slate-200 bg-white px-6 py-10 shadow-xl shadow-slate-900/5 sm:px-10">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">
              Multi-tenant gym SaaS
            </p>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              {tenant?.displayName
                ? `${tenant.displayName} Workspace`
                : "Gym Management for Owners, Staff, and Members"}
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Build member loyalty, grow recurring revenue, and manage every
              check-in, plan, and measurement from one central dashboard.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <a
                href="/login"
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800"
              >
                Sign in to your gym
              </a>
              <a
                href="/admin-login"
                className="text-sm font-semibold text-slate-700 underline transition hover:text-slate-900"
              >
                Super Admin login
              </a>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              Access owner, staff, and member dashboards with a single login.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Membership control
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Track active, frozen, and expiring memberships in real time.
              </p>
            </article>
            <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Attendance insights
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                View QR check-ins, manual sign-ins, and weekly footfall trends.
              </p>
            </article>
            <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Plan management
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Create workout and nutrition plans aligned with each member's
                goals.
              </p>
            </article>
          </div>
        </div>
      </div>
    </main>
  );
}

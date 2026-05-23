import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/authContextValue";

const menuItems = [
  { label: "Dashboard", path: "/admin/dashboard" },
  { label: "Tenants", path: "/admin/tenants" },
  { label: "Plans", path: "/admin/plans" },
  { label: "Broadcasts", path: "/admin/broadcasts" },
  { label: "Audit Logs", path: "/admin/audit-logs" },
];

export default function SuperAdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-7xl gap-6 p-6">
        <aside className="w-full max-w-xs rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">
              Super Admin
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">
              Platform Management
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Manage tenants, SaaS plans, alerts, and audit trails.
            </p>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `block rounded-3xl px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-slate-950 text-white"
                      : "text-slate-700 hover:bg-slate-50"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-8 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Signed in as
            </p>
            <p className="mt-3 text-sm font-semibold text-slate-900">
              {user?.name || "Super Admin"}
            </p>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <button
              type="button"
              onClick={logout}
              className="mt-4 w-full rounded-3xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Sign out
            </button>
          </div>
        </aside>

        <main className="flex-1">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-sky-600">
                    Platform Operations
                  </p>
                  <h1 className="text-3xl font-semibold text-slate-950">
                    Super Admin Console
                  </h1>
                </div>
                <p className="text-sm text-slate-500">
                  Quick links to critical governance and billing tools.
                </p>
              </div>
            </div>
            <div className="p-6">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

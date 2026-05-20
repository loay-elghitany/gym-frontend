import { NavLink, Outlet } from "react-router-dom";
import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";

const roleNavItems = {
  gym_owner: [
    { label: "Dashboard", path: "owner", icon: "home" },
    { label: "Members", path: "members", icon: "users" },
    { label: "Subscriptions", path: "subscriptions", icon: "credit-card" },
    { label: "Reports", path: "reports", icon: "chart" },
  ],
  receptionist: [
    { label: "Dashboard", path: "reception", icon: "home" },
    { label: "Check-ins", path: "checkins", icon: "check" },
    { label: "Register Member", path: "register-member", icon: "user-plus" },
  ],
  trainer: [
    { label: "Dashboard", path: "trainer", icon: "home" },
    { label: "Classes", path: "classes", icon: "calendar" },
    { label: "InBody Records", path: "inbody", icon: "barbell" },
  ],
  member: [
    { label: "Dashboard", path: "dashboard", icon: "home" },
    { label: "My Plans", path: "my-plans", icon: "clipboard" },
    { label: "Profile", path: "profile", icon: "user" },
  ],
};

const friendlyRoleLabel = {
  gym_owner: "Gym Owner",
  receptionist: "Receptionist",
  trainer: "Trainer",
  super_admin: "Super Admin",
  member: "Member",
};

function NavIcon({ type }) {
  const iconClasses = "h-5 w-5 stroke-current fill-current text-slate-500";

  switch (type) {
    case "home":
      return (
        <svg viewBox="0 0 24 24" aria-hidden className={iconClasses}>
          <path d="M3 11.5L12 3l9 8.5v8.5a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-8.5Z" />
        </svg>
      );
    case "users":
      return (
        <svg viewBox="0 0 24 24" aria-hidden className={iconClasses}>
          <path d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Zm-6 5a6 6 0 0 0-6 6h2a4 4 0 0 1 8 0h2a6 6 0 0 0-6-6Zm10-2a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-1 4a5 5 0 0 0-4.5 2.5h9A5 5 0 0 0 19 18Z" />
        </svg>
      );
    case "credit-card":
      return (
        <svg viewBox="0 0 24 24" aria-hidden className={iconClasses}>
          <path d="M3 6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6Zm2 2v2h14V8H5Zm0 4v6h14v-6H5Z" />
        </svg>
      );
    case "chart":
      return (
        <svg viewBox="0 0 24 24" aria-hidden className={iconClasses}>
          <path d="M5 19h14v2H5v-2Zm3-6h2v6H8v-6Zm4-4h2v10h-2V9Zm4 2h2v8h-2v-8Z" />
        </svg>
      );
    case "check":
      return (
        <svg viewBox="0 0 24 24" aria-hidden className={iconClasses}>
          <path d="M20.29 5.71 9 17l-5.29-5.29 1.42-1.42L9 14.17l9.88-9.88 1.41 1.42Z" />
        </svg>
      );
    case "user-plus":
      return (
        <svg viewBox="0 0 24 24" aria-hidden className={iconClasses}>
          <path d="M15 14a4 4 0 1 0-6 0 6 6 0 0 0-6 6h2a4 4 0 0 1 8 0h2a6 6 0 0 0-6-6Zm5-6h2v2h-2v2h-2v-2h-2V8h2V6h2v2Z" />
        </svg>
      );
    case "calendar":
      return (
        <svg viewBox="0 0 24 24" aria-hidden className={iconClasses}>
          <path d="M6 2h2v2h8V2h2a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm0 4v2h12V6H6Zm0 4v8h12v-8H6Z" />
        </svg>
      );
    case "barbell":
      return (
        <svg viewBox="0 0 24 24" aria-hidden className={iconClasses}>
          <path d="M5 8h2v8H5V8Zm12 0h2v8h-2V8Zm-7 3h4v2h-4v-2Zm-4 1H2v2h2v-2Zm16 0h2v2h-2v-2Zm-1 4h-2v-2h2v2ZM9 4h6v2H9V4Z" />
        </svg>
      );
    case "clipboard":
      return (
        <svg viewBox="0 0 24 24" aria-hidden className={iconClasses}>
          <path d="M7 3h10a2 2 0 0 1 2 2v2H5V5a2 2 0 0 1 2-2Zm-2 6h14v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9Zm4 2v2h6v-2H9Zm0 4v2h6v-2H9Z" />
        </svg>
      );
    case "user":
      return (
        <svg viewBox="0 0 24 24" aria-hidden className={iconClasses}>
          <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4 0-7 2-7 4v2h14v-2c0-2-3-4-7-4Z" />
        </svg>
      );
    default:
      return <span className="h-5 w-5 rounded bg-slate-200" />;
  }
}

export default function TenantLayout() {
  const { tenant, user, userRole, logout } = useAuth();

  const navItems = useMemo(() => {
    if (userRole && roleNavItems[userRole]) return roleNavItems[userRole];
    return roleNavItems.member;
  }, [userRole]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col md:flex-row">
        <aside className="w-full md:w-80 shrink-0 border-r border-slate-200 bg-white p-6">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-sky-600">
              {tenant?.displayName || "Gym SaaS"}
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900">
              {tenant?.displayName || "Gym SaaS"}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {friendlyRoleLabel[userRole] || "Workspace"}
            </p>
          </div>

          <nav aria-label="Main navigation" className="space-y-2">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={`/${item.path}`}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition ${
                        isActive
                          ? "bg-slate-900 text-white shadow"
                          : "text-slate-700 hover:bg-slate-100"
                      }`
                    }
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                      <NavIcon type={item.icon} />
                    </span>
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-8 flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {user?.name || "Team Member"}
              </p>
              <p className="text-xs text-slate-500">
                {friendlyRoleLabel[userRole] || "User"}
              </p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Sign out
            </button>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  {tenant?.displayName || "Tenant Workspace"}
                </p>
                <h1 className="mt-1 text-xl font-semibold text-slate-900">
                  Team Dashboard
                </h1>
              </div>

              <div className="mt-2 flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <span className="truncate">
                  {user?.email || "user@yourgym.com"}
                </span>
              </div>
            </div>
          </header>

          <main className="flex-1 p-6">
            <div className="mx-auto w-full max-w-7xl">
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
                <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Core insights
                      </p>
                      <p className="text-sm text-slate-500">
                        Fast access to your workspace dashboards and reports.
                      </p>
                    </div>
                    <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                      Active tenant
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <Outlet />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

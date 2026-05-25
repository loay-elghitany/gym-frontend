import { NavLink, Outlet } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/authContextValue";
import { useTranslation } from "react-i18next";
import api from "../api/axios";

const roleNavItems = {
  gym_owner: [
    { label: "nav.dashboard", path: "owner", icon: "home" },
    { label: "nav.members", path: "members", icon: "users" },
    { label: "nav.subscriptions", path: "subscriptions", icon: "credit-card" },
    { label: "nav.reports", path: "reports", icon: "chart" },
    { label: "nav.landingPage", path: "owner/landing-page", icon: "sparkles" },
    { label: "nav.scanQr", path: "quick-scanner", icon: "qr" },
  ],
  receptionist: [
    { label: "nav.dashboard", path: "reception", icon: "home" },
    { label: "nav.checkins", path: "checkins", icon: "check" },
    { label: "nav.registerMember", path: "register-member", icon: "user-plus" },
    { label: "nav.scanQr", path: "quick-scanner", icon: "qr" },
  ],
  trainer: [
    { label: "nav.dashboard", path: "trainer", icon: "home" },
    { label: "nav.classes", path: "classes", icon: "calendar" },
    { label: "nav.inbodyRecords", path: "inbody", icon: "barbell" },
    { label: "nav.scanQr", path: "quick-scanner", icon: "qr" },
  ],
  member: [
    { label: "nav.dashboard", path: "dashboard", icon: "home" },
    { label: "nav.myPlans", path: "my-plans", icon: "clipboard" },
    { label: "nav.profile", path: "profile", icon: "user" },
    { label: "nav.leaderboard", path: "leaderboard", icon: "trophy" },
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
    case "trophy":
      return (
        <svg viewBox="0 0 24 24" aria-hidden className={iconClasses}>
          <path d="M6 3h12v2H6V3Zm3 4a3 3 0 0 0 6 0h2a1 1 0 0 1 1 1v3a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5V8a1 1 0 0 1 1-1h2Zm-2 8h10v2H7v-2Z" />
        </svg>
      );
    case "clipboard":
      return (
        <svg viewBox="0 0 24 24" aria-hidden className={iconClasses}>
          <path d="M7 3h10a2 2 0 0 1 2 2v2H5V5a2 2 0 0 1 2-2Zm-2 6h14v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9Zm4 2v2h6v-2H9Zm0 4v2h6v-2H9Z" />
        </svg>
      );
    case "qr":
      return (
        <svg viewBox="0 0 24 24" aria-hidden className={iconClasses}>
          <path d="M4 4h6v6H4V4Zm2 2v2h2V6H6Zm10-2h4v4h-4V4Zm2 2v0h0V6Zm-8 8h6v6h-6v-6Zm2 2v2h2v-2h-2Zm-8 8h4v-4H4v4Zm2-2h0v0h0v0Zm10 0h4v-4h-4v4Zm2-2v0h0v0Z" />
        </svg>
      );
    case "user":
      return (
        <svg viewBox="0 0 24 24" aria-hidden className={iconClasses}>
          <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4 0-7 2-7 4v2h14v-2c0-2-3-4-7-4Z" />
        </svg>
      );
    case "sparkles":
      return (
        <svg viewBox="0 0 24 24" aria-hidden className={iconClasses}>
          <path d="M12 2l2.3 4.7 5.2.7-3.7 3.6.9 5.1-4.7-2.5-4.7 2.5.9-5.1L4.5 7.4l5.2-.7L12 2Zm0 6.5 1.2 2.3 2.6.3-1.8 1.7.4 2.5L12 13.5l-2.4 1.3.4-2.5-1.8-1.7 2.6-.3L12 8.5Zm8 7.2-1.4 2.7-2.7 1.4 2.7 1.4 1.4 2.7 1.4-2.7 2.7-1.4-2.7-1.4-1.4-2.7Z" />
        </svg>
      );
    default:
      return <span className="h-5 w-5 rounded bg-slate-200" />;
  }
}

export default function TenantLayout() {
  const { tenant, user, userRole, logout } = useAuth();
  const { t, i18n } = useTranslation();

  const [broadcasts, setBroadcasts] = useState([]);
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(true);
  const [telegramError, setTelegramError] = useState(null);

  const navItems = useMemo(() => {
    if (userRole && roleNavItems[userRole]) return roleNavItems[userRole];
    return roleNavItems.member;
  }, [userRole]);

  useEffect(() => {
    const loadBroadcasts = async () => {
      try {
        const response = await api.get("/broadcasts");
        setBroadcasts(response.data?.data || []);
      } catch (error) {
        console.warn("Unable to load broadcasts", error);
      }
    };

    const loadTelegramStatus = async () => {
      setTelegramLoading(true);
      setTelegramError(null);
      try {
        const response = await api.get("/users/telegram-status");
        setTelegramConnected(Boolean(response.data?.data?.connected));
      } catch (error) {
        setTelegramError(
          error?.response?.data?.message ||
            error?.message ||
            "Unable to determine Telegram status",
        );
      } finally {
        setTelegramLoading(false);
      }
    };

    loadBroadcasts();
    loadTelegramStatus();
  }, []);

  const handleDisconnectTelegram = async () => {
    setTelegramLoading(true);
    setTelegramError(null);
    try {
      await api.post("/users/telegram-disconnect");
      setTelegramConnected(false);
    } catch (error) {
      setTelegramError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to disconnect Telegram",
      );
    } finally {
      setTelegramLoading(false);
    }
  };

  const telegramBotUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME;
  const telegramLink =
    telegramBotUsername && user?._id
      ? `https://t.me/${telegramBotUsername}?start=${user._id}`
      : null;

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
                    <span>{t(item.label)}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-8 space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-4">
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
                {t("button.signOut")}
              </button>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                Notification settings
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Connect Telegram to receive real-time gym alerts and account
                updates.
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  {telegramLoading ? (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      Checking status...
                    </span>
                  ) : telegramConnected ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      Not connected
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {!telegramConnected ? (
                    <a
                      href={telegramLink || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
                    >
                      Connect Telegram
                    </a>
                  ) : null}
                  {telegramConnected ? (
                    <button
                      type="button"
                      disabled={telegramLoading}
                      onClick={handleDisconnectTelegram}
                      className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
                    >
                      Disconnect
                    </button>
                  ) : null}
                </div>
              </div>
              {telegramError ? (
                <p className="mt-3 text-sm text-rose-600">{telegramError}</p>
              ) : null}
              {!telegramLink && !telegramLoading ? (
                <p className="mt-3 text-sm text-slate-500">
                  Telegram bot username is not configured in the frontend
                  environment.
                </p>
              ) : null}
            </div>
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

              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <span className="truncate">
                    {user?.email || "user@yourgym.com"}
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <label htmlFor="language-select" className="text-slate-500">
                    {t("header.language")}
                  </label>
                  <select
                    id="language-select"
                    value={i18n.language}
                    onChange={(event) =>
                      i18n.changeLanguage(event.target.value)
                    }
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                  >
                    <option value="en">{t("language.english")}</option>
                    <option value="ar">{t("language.arabic")}</option>
                  </select>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 p-6">
            <div className="mx-auto w-full max-w-7xl">
              {broadcasts.length > 0 ? (
                <div className="mb-6 space-y-3">
                  {broadcasts.map((broadcast) => (
                    <div
                      key={broadcast._id}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {broadcast.title}
                          </p>
                          <p className="text-sm text-slate-600">
                            {broadcast.message}
                          </p>
                        </div>
                        <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                          {broadcast.audience?.toUpperCase() || "ALL"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
                <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {t("header.teamDashboard")}
                      </p>
                      <p className="text-sm text-slate-500">
                        {t("header.tenantWorkspace")}
                      </p>
                    </div>
                    <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                      {t("header.activeTenant")}
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

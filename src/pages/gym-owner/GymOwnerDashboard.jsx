import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/authContextValue";
import { useTranslation } from "react-i18next";
import ChurnRadarPanel from "../../components/ChurnRadarPanel";
import AIFinancialInsights from "../../components/AIFinancialInsights";
import Loading from "../../components/Loading";

export default function GymOwnerDashboard() {
  const { tenant } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [expiringMembers, setExpiringMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentTenantSlug =
    typeof tenant === "string" ? tenant : tenant?.slug || null;

  const { t } = useTranslation();

  useEffect(() => {
    let isMounted = true;

    if (!currentTenantSlug) {
      setLoading(false);
      setError(null);
      setMetrics(null);
      return () => {
        isMounted = false;
      };
    }

    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const res = await api.get("/gym/reports", {
          headers: {
            "x-tenant-slug": currentTenantSlug,
          },
        });
        if (!isMounted) {
          return;
        }
        setMetrics(res?.data?.data || null);
      } catch (err) {
        if (!isMounted) {
          return;
        }
        setError(
          err?.response?.data?.message ||
            err?.message ||
            t("reports.loading") ||
            "Unable to load metrics",
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const fetchExpiringMembers = async () => {
      try {
        const res = await api.get("/member/expiring?days=7", {
          headers: {
            "x-tenant-slug": currentTenantSlug,
          },
        });
        if (!isMounted) {
          return;
        }
        setExpiringMembers(res?.data?.data || []);
      } catch (err) {
        console.error("Failed to fetch expiring members:", err);
      }
    };

    fetchMetrics();
    fetchExpiringMembers();

    return () => {
      isMounted = false;
    };
  }, [currentTenantSlug]);

  const headerTitle = useMemo(
    () => `${tenant?.displayName || "Your Gym"} Owner Dashboard`,
    [tenant],
  );

  const expiringCount = Math.max(
    metrics?.expiringSoon ?? 0,
    expiringMembers.length,
  );

  const displayMetrics = metrics
    ? [
        {
          key: "activeMembers",
          title: t("reports.activeMembers"),
          value: `${metrics.activeMembers ?? 0}`,
          detail: "",
        },
        {
          key: "newTrainees",
          title: t("reports.newTrainees"),
          value: `${metrics.newTraineesThisMonth ?? 0}`,
          detail: t("newTrainees.detail"),
        },
        {
          key: "expiringSoon",
          title: t("reports.expiringSoon"),
          value: `${metrics.expiringSoon ?? 0}`,
          detail: "",
        },
      ]
    : [];

  if (!currentTenantSlug) {
    return (
      <main className="space-y-6">
        <Loading message="Waiting for your tenant workspace..." />
      </main>
    );
  }

  return (
    <main className="space-y-10">
      {expiringCount > 0 ? (
        <section className="rounded-4xl border border-orange-200 bg-orange-50 p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-orange-600">
                Expiry alert
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-orange-950">
                {expiringCount} member{expiringCount !== 1 ? "s" : ""} may
                expire soon
              </h2>
              <p className="mt-2 text-sm text-orange-700">
                Keep your gym enrollment strong by reviewing soon-to-expire
                plans.
              </p>
            </div>
            <Link
              to="/members"
              className="inline-flex items-center justify-center rounded-full bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-700"
            >
              View expiring members
            </Link>
          </div>
        </section>
      ) : null}
      <section className="rounded-4xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-900/5">
        <div className="max-w-3xl space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-sky-600">
            Gym Owner Workspace
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            {headerTitle}
          </h1>
          <p className="text-base leading-8 text-slate-600">
            Control membership health, revenue pacing, and daily attendance from
            a modern gym command center.
          </p>
          {error ? (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
              {error}
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-4xl border border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950 p-6 shadow-xl shadow-cyan-500/10 text-white">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_auto]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-cyan-300">
              {t("dashboard.leadsCtaCategory")}
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white">
              {t("dashboard.leadsCtaTitle")}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200">
              {t("dashboard.leadsCtaDescription")}
            </p>
          </div>
          <div className="flex items-center">
            <Link
              to="/owner/leads"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-slate-950/10 transition hover:bg-slate-100"
            >
              {t("dashboard.leadsCtaAction")}
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <article
                key={index}
                className="animate-pulse rounded-3xl border border-slate-200 bg-slate-50 p-6"
              >
                <div className="h-4 w-32 rounded bg-slate-200" />
                <div className="mt-5 h-10 w-24 rounded bg-slate-200" />
                <div className="mt-3 h-3 w-40 rounded bg-slate-200" />
              </article>
            ))
          : displayMetrics.map((metric) => (
              <article
                key={metric.title}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">
                    {metric.title}
                  </p>
                  {metric.key === "newTrainees" ? (
                    <div className="ml-4 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-4 w-4"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M15.75 5.25a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 18a6 6 0 1111.955.785A6.5 6.5 0 0014 17.5H4.5zM20.25 8.25a.75.75 0 01.75.75v1.5h1.5a.75.75 0 010 1.5h-1.5v1.5a.75.75 0 01-1.5 0v-1.5h-1.5a.75.75 0 010-1.5h1.5v-1.5c0-.414.336-.75.75-.75z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  ) : null}
                </div>
                <p className="mt-5 text-3xl font-semibold text-slate-950">
                  {metric.value}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {metric.detail}
                </p>
              </article>
            ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <article className="col-span-2 rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-950">
              {t("reports.growth")}
            </h2>
            <span className="text-sm text-slate-500">
              {t("reports.loading")}
            </span>
          </div>

          <div className="mt-6">
            {loading ? (
              <div className="h-48 animate-pulse rounded bg-slate-100"></div>
            ) : metrics &&
              metrics.growthChartData &&
              metrics.growthChartData.length ? (
              <div className="space-y-3">
                <div className="flex items-end gap-3 h-48">
                  {(() => {
                    const max = Math.max(
                      ...metrics.growthChartData.map((d) => d.signups),
                      1,
                    );
                    return metrics.growthChartData.map((d) => {
                      const height = Math.round((d.signups / max) * 100);
                      return (
                        <div key={d.month} className="flex-1 text-center">
                          <div className="mx-auto h-40 flex items-end justify-center">
                            <div
                              className="w-9 rounded-t"
                              style={{
                                height: `${height}%`,
                                background:
                                  "linear-gradient(180deg,#06b6d4,#0ea5a0)",
                              }}
                            />
                          </div>
                          <div className="mt-2 text-sm text-slate-600">
                            {d.month}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            ) : (
              <div className="rounded-3xl bg-slate-50 p-6 text-center text-sm text-slate-600">
                {t("reports.noData")}
              </div>
            )}
          </div>
        </article>

        <article className="col-span-1 rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-950">
            {t("reports.recentActivity")}
          </h2>
          <div className="mt-4">
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-10 animate-pulse rounded bg-slate-100"
                  ></div>
                ))}
              </div>
            ) : metrics &&
              metrics.recentActivity &&
              metrics.recentActivity.length ? (
              <table className="w-full text-left">
                <thead>
                  <tr className="text-sm text-slate-500">
                    <th className="pb-2">{t("reports.registered")}</th>
                    <th className="pb-2">{t("reports.status")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {metrics.recentActivity.map((r, idx) => (
                    <tr key={idx} className="py-2">
                      <td className="py-3">
                        <div className="font-semibold text-slate-900">
                          {r.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {new Date(r.date).toLocaleString()}
                        </div>
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${r.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
                        >
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="rounded-3xl bg-slate-50 p-4 text-center text-sm text-slate-600">
                {t("reports.noData")}
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <article className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-950">
              Expiring Memberships
            </h2>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
              {expiringMembers.length} members
            </span>
          </div>
          <div className="mt-6 space-y-3">
            {expiringMembers.length > 0 ? (
              expiringMembers.slice(0, 5).map((member) => {
                const rawExpiry =
                  member?.subscription?.expiryDate ||
                  member?.subscription?.expiresAt;
                const expiryDate = rawExpiry ? new Date(rawExpiry) : null;
                const daysLeft =
                  expiryDate && !isNaN(expiryDate)
                    ? Math.ceil(
                        (expiryDate - new Date()) / (1000 * 60 * 60 * 24),
                      )
                    : null;
                return (
                  <div
                    key={member._id}
                    className="flex items-center justify-between rounded-3xl bg-slate-50 p-4"
                  >
                    <div>
                      <p className="font-semibold text-slate-950">
                        {member.name}
                      </p>
                      <p className="text-sm text-slate-600">{member.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">
                        {daysLeft !== null
                          ? `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`
                          : "—"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {expiryDate ? expiryDate.toLocaleDateString() : "—"}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-3xl bg-slate-50 p-5 text-center text-sm text-slate-600">
                No members expiring in the next 7 days
              </div>
            )}
          </div>
        </article>
        <AIFinancialInsights />
        <ChurnRadarPanel />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-4xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">
            Workout Plan Adoption
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            62% of active members have at least one assigned workout program.
          </p>
        </article>

        <article className="rounded-4xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">
            Active Classes
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            7 classes running today with 84% attendance forecast.
          </p>
        </article>
      </section>
    </main>
  );
}

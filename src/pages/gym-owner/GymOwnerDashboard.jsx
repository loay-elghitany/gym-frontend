import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import ChurnRadarPanel from "../../components/ChurnRadarPanel";
import AIFinancialInsights from "../../components/AIFinancialInsights";

export default function GymOwnerDashboard() {
  const { tenant } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const res = await api.get("/owner/metrics");
        setMetrics(res?.data?.data || null);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load metrics",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  const headerTitle = useMemo(
    () => `${tenant?.displayName || "Your Gym"} Owner Dashboard`,
    [tenant],
  );

  const displayMetrics = metrics
    ? [
        {
          title: "Net Profit",
          value: `$${metrics.netProfit.toLocaleString()}`,
          detail: `Based on ${metrics.activeSubscriptions} active subscriptions`,
        },
        {
          title: "Monthly Revenue",
          value: `$${metrics.monthlyRevenue.toLocaleString()}`,
          detail: `${metrics.revenueComparison}% growth target`,
        },
        {
          title: "Active Subscriptions",
          value: `${metrics.activeSubscriptions}`,
          detail: `${metrics.expiringSoon} ending soon`,
        },
        {
          title: "Churn Risk",
          value: `${metrics.churnRiskCount}`,
          detail: `Inactive over 10 days`,
        },
      ]
    : [];

  return (
    <main className="space-y-10">
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
                <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">
                  {metric.title}
                </p>
                <p className="mt-5 text-3xl font-semibold text-slate-950">
                  {metric.value}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {metric.detail}
                </p>
              </article>
            ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <article className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-950">
            Expiring Memberships
          </h2>
          <div className="mt-6 space-y-4 text-sm text-slate-600">
            <div className="rounded-3xl bg-slate-50 p-5">
              <p className="font-semibold text-slate-950">Renewal cadence</p>
              <p className="mt-2">
                {metrics
                  ? `${metrics.expiringSoon} members need renewal outreach this week.`
                  : "Loading insights..."}
              </p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-5">
              <p className="font-semibold text-slate-950">Member health</p>
              <p className="mt-2">
                {metrics
                  ? `${metrics.activeMembers} active members remain engaged in the current cycle.`
                  : "Loading insights..."}
              </p>
            </div>
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

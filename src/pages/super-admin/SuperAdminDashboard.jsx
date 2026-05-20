const metrics = [
  { title: "Total MRR", value: "$167,800", detail: "+22% YoY growth" },
  { title: "Active Gym Tenants", value: "38", detail: "22 new gyms onboarded" },
  {
    title: "New Tenant Approvals",
    value: "6 pending",
    detail: "Fresh requests today",
  },
  { title: "Churn Risk", value: "4.3%", detail: "Strong retention" },
];

const recentActivity = [
  {
    label: "New tenant application",
    value: "Pulse Fitness",
    status: "Pending approval",
  },
  {
    label: "Subscription upgrade",
    value: "Warrior Gym",
    status: "Pro plan active",
  },
  {
    label: "Billing alert",
    value: "Eastside Health Club",
    status: "Invoice overdue",
  },
];

export default function SuperAdminDashboard() {
  return (
    <main className="space-y-10">
      <section className="rounded-4xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-900/5">
        <div className="max-w-3xl space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-sky-600">
            SaaS Admin Overview
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
            Super Admin Dashboard
          </h1>
          <p className="text-base leading-8 text-slate-600">
            Monitor platform revenue, tenant growth, and onboarding health
            across the entire network.
          </p>
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
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

      <section className="rounded-4xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-900/5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-950">
              Recent Platform Activity
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              A real-time view of tenant onboarding, upgrades, and billing
              events.
            </p>
          </div>
        </div>

        <ul className="mt-6 space-y-4">
          {recentActivity.map((item) => (
            <li
              key={item.value}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <strong className="text-sm font-semibold text-slate-950">
                  {item.label}
                </strong>
                <span className="text-sm text-slate-500">{item.status}</span>
              </div>
              <p className="mt-3 text-sm text-slate-600">{item.value}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

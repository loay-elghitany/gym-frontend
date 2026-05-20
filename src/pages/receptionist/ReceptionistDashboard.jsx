export default function ReceptionistDashboard() {
  const todayStats = [
    { label: "Check-ins", value: "24", trend: "+3" },
    { label: "New signups", value: "2", trend: "+1" },
    { label: "Pending renewals", value: "7", trend: "+2" },
  ];

  const upcomingVisits = [
    { member: "Alex Johnson", time: "10:30 AM", status: "On time" },
    { member: "Sarah Mitchell", time: "11:15 AM", status: "Confirmed" },
    { member: "Marcus Brown", time: "1:45 PM", status: "Reminder sent" },
  ];

  return (
    <main className="space-y-10">
      <section className="rounded-4xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-900/5">
        <div className="max-w-3xl space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-sky-600">
            Reception Desk
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
            Front Desk Overview
          </h1>
          <p className="text-base leading-8 text-slate-600">
            Manage member check-ins, process renewals, and coordinate daily
            workflows with real-time visibility across your front desk.
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <article className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-950">
            Today's activity
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {todayStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
              >
                <p className="text-sm text-slate-500">{stat.label}</p>
                <div className="mt-4 flex items-end gap-3">
                  <p className="text-3xl font-semibold text-slate-950">
                    {stat.value}
                  </p>
                  <p className="text-sm font-medium text-emerald-600">
                    {stat.trend}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-semibold text-slate-950">
              Upcoming visits
            </h3>
            <div className="space-y-3">
              {upcomingVisits.map((visit, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4"
                >
                  <div>
                    <p className="font-medium text-slate-950">{visit.member}</p>
                    <p className="text-sm text-slate-500">{visit.time}</p>
                  </div>
                  <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                    {visit.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="rounded-4xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">
            Quick actions
          </h2>
          <div className="mt-6 space-y-3">
            <button className="w-full rounded-3xl border border-slate-200 bg-white px-5 py-4 text-left font-medium text-slate-950 transition hover:bg-slate-50">
              ? Check in member
            </button>
            <button className="w-full rounded-3xl border border-slate-200 bg-white px-5 py-4 text-left font-medium text-slate-950 transition hover:bg-slate-50">
              + New enrollment
            </button>
            <button className="w-full rounded-3xl border border-slate-200 bg-white px-5 py-4 text-left font-medium text-slate-950 transition hover:bg-slate-50">
              ? Process renewal
            </button>
            <button className="w-full rounded-3xl border border-slate-200 bg-white px-5 py-4 text-left font-medium text-slate-950 transition hover:bg-slate-50">
              ?? Contact member
            </button>
          </div>

          <div className="mt-8 space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-600">
              Daily target
            </p>
            <div className="rounded-3xl bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">Check-ins goal</p>
                <p className="font-semibold text-slate-950">24 / 30</p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full w-8/12 rounded-full bg-sky-500" />
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-4xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">
            Membership Pipeline
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Track new leads, pending sign-ups, and renewal opportunities to
            maintain steady member growth.
          </p>
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Leads in progress</span>
              <span className="font-semibold text-slate-950">5</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Ready to convert</span>
              <span className="font-semibold text-slate-950">3</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">This week conversions</span>
              <span className="font-semibold text-emerald-600">+2</span>
            </div>
          </div>
        </article>

        <article className="rounded-4xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">
            Alerts & notices
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Stay on top of member renewals, payment issues, and special requests
            requiring immediate attention.
          </p>
          <div className="mt-6 space-y-2">
            <div className="rounded-3xl bg-amber-50 px-4 py-3">
              <p className="text-sm font-medium text-amber-900">
                ? 2 failed payment attempts
              </p>
            </div>
            <div className="rounded-3xl bg-sky-50 px-4 py-3">
              <p className="text-sm font-medium text-sky-900">
                ? 3 memberships expire next week
              </p>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}

import SmartTemplatesBuilder from "../../components/SmartTemplatesBuilder";
import TrainerPlans from "./TrainerPlans";

export default function TrainerDashboard() {
  return (
    <main className="space-y-10">
      <section className="rounded-4xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-900/5">
        <div className="max-w-3xl space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-sky-600">
            Trainer Workspace
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
            Trainer Dashboard
          </h1>
          <p className="text-base leading-8 text-slate-600">
            Build programming, manage sessions, and measure member progress from
            one premium panel.
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">
            Workout Plan Queue
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Quickly assign or review active member training plans.
          </p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">Class Roster</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Prepare for sessions and keep attendance tightly managed.
          </p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">
            InBody Measurements
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Track body metrics and progress reports for every client.
          </p>
        </article>
      </section>

      <SmartTemplatesBuilder />
      <TrainerPlans />
    </main>
  );
}

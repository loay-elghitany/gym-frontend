export default function SmartTemplatesBuilder() {
  const templates = [
    { name: "Strength Microcycle", members: 12, status: "Active" },
    { name: "Recovery Blast", members: 8, status: "Ready" },
    { name: "Fat Loss Focus", members: 14, status: "In use" },
  ];

  const assignments = [
    { member: "Ava P.", template: "Strength Microcycle", nextSession: "Mon" },
    { member: "Leo W.", template: "Recovery Blast", nextSession: "Tue" },
    { member: "Noah S.", template: "Fat Loss Focus", nextSession: "Thu" },
  ];

  return (
    <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-sky-600">
            Smart Templates
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Builder & assignment hub
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Create training templates, assign them instantly, and keep members
            engaged with a single modern workspace.
          </p>
        </div>

        <button className="inline-flex items-center justify-center rounded-3xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
          Create new template
        </button>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4 rounded-[2rem] border border-slate-200 bg-slate-50 p-6">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-950">
              Template library
            </p>
            <div className="mt-5 space-y-3">
              {templates.map((template) => (
                <div
                  key={template.name}
                  className="flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {template.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {template.members} members
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold text-slate-900">
                    {template.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-950">
              Drag & assign
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Drag templates onto members or use quick assign actions to update
              your roster.
            </p>
            <div className="mt-5 space-y-3">
              <button className="w-full rounded-3xl bg-white px-4 py-3 text-left text-sm font-medium text-slate-900 shadow-sm transition hover:bg-slate-100">
                Strength Microcycle → start Monday
              </button>
              <button className="w-full rounded-3xl bg-white px-4 py-3 text-left text-sm font-medium text-slate-900 shadow-sm transition hover:bg-slate-100">
                Recovery Blast → assign to whole yoga cohort
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-600">
            Live assignments
          </p>
          <div className="mt-5 space-y-4">
            {assignments.map((assignment) => (
              <div
                key={assignment.member}
                className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4"
              >
                <p className="font-semibold text-slate-950">
                  {assignment.member}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {assignment.template}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                  Next session: {assignment.nextSession}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

import AdvancedMemberProfile from "../../components/AdvancedMemberProfile";
import VolumeAndMarkers from "../../components/VolumeAndMarkers";

export default function MemberProfile() {
  return (
    <main className="space-y-10">
      <section className="rounded-4xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-900/5">
        <div className="max-w-3xl space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-sky-600">
            Profile center
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
            Advanced member metrics
          </h1>
          <p className="text-base leading-8 text-slate-600">
            Access a polished health report and progress timeline tailored to
            your training. Track body composition, fitness scores, and
            personalized recovery insights.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
              ✓ Member in good standing
            </span>
            <span className="rounded-full bg-sky-100 px-4 py-2 text-sm font-semibold text-sky-700">
              📊 12-week progress
            </span>
          </div>
        </div>
      </section>

      <AdvancedMemberProfile />

      <VolumeAndMarkers />

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-4xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">
            Workout history
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Your complete record of sessions, durations, and performance
            achievements.
          </p>
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between rounded-3xl bg-white px-4 py-3">
              <span className="text-sm font-medium text-slate-950">
                Total workouts
              </span>
              <span className="text-lg font-semibold text-slate-950">87</span>
            </div>
            <div className="flex items-center justify-between rounded-3xl bg-white px-4 py-3">
              <span className="text-sm font-medium text-slate-950">
                Total hours trained
              </span>
              <span className="text-lg font-semibold text-slate-950">
                145.5h
              </span>
            </div>
            <div className="flex items-center justify-between rounded-3xl bg-white px-4 py-3">
              <span className="text-sm font-medium text-slate-950">
                Longest streak
              </span>
              <span className="text-lg font-semibold text-slate-950">
                18 days
              </span>
            </div>
          </div>
        </article>

        <article className="rounded-4xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">
            Training preferences
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Customize your experience and receive personalized recommendations.
          </p>
          <div className="mt-6 space-y-3">
            <label className="flex cursor-pointer items-center gap-3 rounded-3xl bg-white px-4 py-3">
              <input
                type="checkbox"
                className="h-4 w-4 rounded"
                defaultChecked
              />
              <span className="text-sm font-medium text-slate-950">
                Morning workouts preferred
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-3xl bg-white px-4 py-3">
              <input type="checkbox" className="h-4 w-4 rounded" />
              <span className="text-sm font-medium text-slate-950">
                Send recovery reminders
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-3xl bg-white px-4 py-3">
              <input
                type="checkbox"
                className="h-4 w-4 rounded"
                defaultChecked
              />
              <span className="text-sm font-medium text-slate-950">
                Goal-based recommendations
              </span>
            </label>
          </div>
        </article>
      </section>
    </main>
  );
}

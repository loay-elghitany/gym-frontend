import { useMemo } from "react";

const badgeDefinitions = (user) => {
  const streak = user?.gamification?.attendanceStreak || 0;
  const workoutCount = user?.attendanceHistory?.length || 0;
  const badges = [
    {
      title: "Gym Addict",
      detail:
        streak >= 10 ? "10-day streak unlocked" : "Reach 10 consecutive days",
      color:
        streak >= 10
          ? "bg-emerald-500/15 text-emerald-700"
          : "bg-slate-100 text-slate-700",
    },
    {
      title: "Consistency",
      detail:
        workoutCount >= 20 ? "20 sessions completed" : "Complete 20 sessions",
      color:
        workoutCount >= 20
          ? "bg-sky-500/15 text-sky-700"
          : "bg-slate-100 text-slate-700",
    },
    {
      title: "Momentum",
      detail: streak >= 5 ? "5-day momentum" : "Keep your streak alive",
      color:
        streak >= 5
          ? "bg-fuchsia-500/15 text-fuchsia-700"
          : "bg-slate-100 text-slate-700",
    },
  ];
  return badges;
};

export default function GamificationPanel({ user }) {
  const streak = user?.gamification?.attendanceStreak || 0;
  const workoutCount = user?.attendanceHistory?.length || 0;
  const badges = useMemo(() => badgeDefinitions(user || {}), [user]);
  const progressPercent = Math.min(Math.round((streak / 20) * 100), 100);

  return (
    <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-sky-600">
            Gamification
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Active streaks & achievement badges
          </h2>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-sm text-slate-700">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          Live reward tracking
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_0.95fr]">
        <div className="rounded-4xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-sm font-semibold text-slate-500">Active streak</p>
          <div className="mt-5 flex items-end gap-4">
            <div className="flex flex-1 flex-col items-center rounded-3xl bg-white px-6 py-8 text-center shadow-sm">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
                Current run
              </p>
              <p className="mt-4 text-5xl font-semibold text-slate-950">
                {streak}
              </p>
              <p className="mt-2 text-sm text-slate-600">days in a row</p>
            </div>
            <div className="rounded-3xl bg-slate-950/95 p-6 text-white shadow-sm">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-300">
                Next streak
              </p>
              <p className="mt-4 text-3xl font-semibold">
                {Math.max(20 - streak, 0)} days
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-4xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-sm font-semibold text-slate-500">Achievements</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {badges.map((badge) => (
              <div
                key={badge.title}
                className={`rounded-3xl border border-slate-200 p-4 ${badge.color}`}
              >
                <p className="font-semibold text-slate-950">{badge.title}</p>
                <p className="mt-2 text-sm text-slate-700">{badge.detail}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-sm font-medium text-slate-700">
              <span>Progress to next milestone</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-sky-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

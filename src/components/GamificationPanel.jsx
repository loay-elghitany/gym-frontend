import { useMemo } from "react";
import { useTranslation } from "react-i18next";

const badgeDefinitions = (user) => {
  const streak = user?.gamification?.attendanceStreak || 0;
  const workoutCount = user?.attendanceHistory?.length || 0;

  const badges = [
    {
      title: "Gym Addict",
      detail:
        streak >= 10 ? "10-day streak unlocked" : "Reach 10 consecutive days",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
        >
          <path d="M4 11h2v2H4z" />
          <path d="M18 11h2v2h-2z" />
          <path d="M6 9h12v6H6z" />
          <path d="M8 7v10" />
          <path d="M16 7v10" />
        </svg>
      ),
      accent:
        streak >= 10
          ? "bg-emerald-500/15 text-emerald-700"
          : "bg-slate-100 text-slate-700",
      iconWrapper:
        streak >= 10
          ? "bg-emerald-500/15 text-emerald-600"
          : "bg-slate-100 text-slate-600",
    },
    {
      title: "Consistency",
      detail:
        workoutCount >= 20 ? "20 sessions completed" : "Complete 20 sessions",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
        >
          <path d="M8 3v4" />
          <path d="M16 3v4" />
          <path d="M4 8h16" />
          <path d="M5 21h14a2 2 0 0 0 2-2V8H3v11a2 2 0 0 0 2 2Z" />
          <path d="m9 14 2 2 4-4" />
        </svg>
      ),
      accent:
        workoutCount >= 20
          ? "bg-sky-500/15 text-sky-700"
          : "bg-slate-100 text-slate-700",
      iconWrapper:
        workoutCount >= 20
          ? "bg-sky-500/15 text-sky-600"
          : "bg-slate-100 text-slate-600",
    },
    {
      title: "Momentum",
      detail: streak >= 5 ? "5-day momentum" : "Keep your streak alive",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
        >
          <path d="M12 21c-4-1-4-5-4-5a4 4 0 0 1 8 0s0 4-4 5Z" />
          <path d="M8 12c1-2 2-4 4-6 0 0 2.5 1.5 2 4" />
        </svg>
      ),
      accent:
        streak >= 5
          ? "bg-fuchsia-500/15 text-fuchsia-700"
          : "bg-slate-100 text-slate-700",
      iconWrapper:
        streak >= 5
          ? "bg-fuchsia-500/15 text-fuchsia-600"
          : "bg-slate-100 text-slate-600",
    },
  ];

  return badges;
};

export default function GamificationPanel({ user }) {
  const { t } = useTranslation();
  const streak = user?.gamification?.attendanceStreak || 0;
  const badges = useMemo(() => badgeDefinitions(user || {}), [user]);
  const progressPercent = Math.min(Math.round((streak / 20) * 100), 100);

  return (
    <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-sky-600">
            {t("dashboard.gamification")}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {t("dashboard.gamificationSubtitle")}
          </h2>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-sm text-slate-700">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          {t("dashboard.liveRewardTracking")}
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_0.95fr]">
        <div className="rounded-4xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-sm font-semibold text-slate-500">
            {t("dashboard.activeStreak")}
          </p>
          <div className="mt-5 flex items-end gap-4">
            <div className="flex flex-1 flex-col items-center rounded-3xl bg-white px-6 py-8 text-center shadow-sm">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
                {t("dashboard.currentRun")}
              </p>
              <p className="mt-4 text-5xl font-semibold text-slate-950">
                {streak}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {t("dashboard.daysInARow")}
              </p>
            </div>
            <div className="rounded-3xl bg-slate-950/95 p-6 text-white shadow-sm">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-300">
                {t("dashboard.nextStreak")}
              </p>
              <p className="mt-4 text-3xl font-semibold">
                {Math.max(20 - streak, 0)} days
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-4xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-sm font-semibold text-slate-500">
            {t("dashboard.achievements")}
          </p>
          <div className="mt-5 grid gap-4 grid-cols-1 sm:grid-cols-2">
            {badges.map((badge) => (
              <div
                key={badge.title}
                className="min-h-40 overflow-hidden rounded-4xl border border-slate-200 bg-white p-5 shadow-sm transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex h-full flex-col justify-between gap-5">
                  <div className="flex items-center justify-between gap-4">
                    <div
                      className={`inline-flex h-12 w-12 items-center justify-center rounded-3xl ${badge.iconWrapper}`}
                    >
                      {badge.icon}
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${badge.accent}`}
                    >
                      {badge.title}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm leading-6 text-slate-700 whitespace-normal wrap-break-word">
                      {badge.detail}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-sm font-medium text-slate-700">
              <span>{t("dashboard.progressToNextMilestone")}</span>
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

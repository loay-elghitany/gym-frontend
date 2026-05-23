import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/authContextValue";
import GamificationPanel from "../../components/GamificationPanel";
import ActiveWorkoutSession from "../../components/ActiveWorkoutSession";
import api from "../../api/axios";

export default function MemberDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [attendance, setAttendance] = useState(null);
  const [attendanceError, setAttendanceError] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(true);

  const headerTitle = useMemo(
    () =>
      t("dashboard.welcomeBack", {
        name: user?.name || t("common.member"),
      }),
    [user, t],
  );

  const subscriptionStatus = useMemo(() => {
    if (!user?.subscription?.expiresAt) return null;
    const expiresAt = new Date(user.subscription.expiresAt);
    if (expiresAt < new Date() || user.subscription.status === "expired") {
      return "expired";
    }
    return "active";
  }, [user]);

  const remainingSessions = user?.subscription?.remainingSessions ?? 0;
  const expiresAtLabel = user?.subscription?.expiresAt
    ? new Date(user.subscription.expiresAt).toLocaleDateString()
    : "N/A";
  const activeOccupancy = attendance?.activeOccupancy ?? "-";

  const userRank = useMemo(() => {
    const points = Number(user?.gamification?.points || 0);
    if (points >= 1501) return "Gold";
    if (points >= 501) return "Silver";
    return "Bronze";
  }, [user]);

  const formatHourLabel = (hour) => {
    const isPm = hour >= 12;
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}${isPm ? "pm" : "am"}`;
  };

  useEffect(() => {
    const fetchAttendance = async () => {
      setAttendanceLoading(true);
      setAttendanceError(null);
      try {
        const res = await api.get("/attendance/peak-hours");
        const data = res?.data?.data || res?.data || null;
        setAttendance(data);
      } catch (err) {
        setAttendanceError(
          err?.response?.data?.message ||
            err?.message ||
            t("dashboard.unableToLoad"),
        );
      } finally {
        setAttendanceLoading(false);
      }
    };
    fetchAttendance();
  }, [t]);

  const handleCheckIn = async () => {
    setAttendanceLoading(true);
    setAttendanceError(null);
    try {
      const res = await api.post("/attendance/check-in");
      const data = res?.data?.data || res?.data || null;
      setAttendance((current) => ({
        ...current,
        activeOccupancy: data?.activeOccupancy ?? current?.activeOccupancy,
      }));
    } catch (err) {
      setAttendanceError(
        err?.response?.data?.message ||
          err?.message ||
          t("dashboard.unableToLoad"),
      );
    } finally {
      setAttendanceLoading(false);
    }
  };

  const badges = useMemo(() => user?.gamification?.badges || [], [user]);

  return (
    <main className="space-y-10">
      <section className="rounded-4xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-900/5">
        <div className="max-w-3xl space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-sky-600">
            {t("dashboard.memberExperience")}
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
            {headerTitle}
          </h1>
          <p className="text-base leading-8 text-slate-600">
            {t("dashboard.streakHint")}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/profile"
              className="inline-flex items-center justify-center rounded-3xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {t("dashboard.viewProfile")}
            </Link>
            <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {t("dashboard.streakHint")}
            </div>
          </div>
          {subscriptionStatus === "expired" ? (
            <div className="rounded-4xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
              {t("dashboard.subscriptionExpired")}
            </div>
          ) : null}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_0.9fr]">
        <article className="rounded-4xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-sky-600">
            {t("dashboard.quickStats")}
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Remaining sessions</p>
              <p className="mt-4 text-3xl font-semibold text-slate-950">
                {remainingSessions}
              </p>
            </div>
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Expires at</p>
              <p className="mt-4 text-3xl font-semibold text-slate-950">
                {expiresAtLabel}
              </p>
            </div>
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                {t("dashboard.pointsEarned")}
              </p>
              <p className="mt-4 text-3xl font-semibold text-slate-950">
                {user?.gamification?.points || 0}
              </p>
            </div>
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Current rank</p>
              <p className="mt-4 text-3xl font-semibold text-slate-950">
                {userRank}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Your active gamification tier.
              </p>
            </div>
          </div>
        </article>

        <GamificationPanel user={user} />
      </section>

      <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-600">
              {t("dashboard.myAchievements")}
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">
              {t("dashboard.badgeHighlights")}
            </h2>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {badges.length > 0 ? (
            badges.map((badge) => (
              <div
                key={badge.name}
                className="overflow-hidden rounded-4xl bg-linear-to-br from-sky-500 via-cyan-500 to-emerald-500 p-6 text-white shadow-xl shadow-sky-500/20"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="rounded-3xl bg-white/15 px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em]">
                    {badge.name}
                  </span>
                  <div className="flex h-11 w-11 items-center justify-center rounded-3xl bg-white/15 text-xl">
                    ⭐
                  </div>
                </div>
                <p className="text-sm leading-6 text-white/90">
                  {badge.description}
                </p>
                <p className="mt-6 text-xs uppercase tracking-[0.24em] text-white/70">
                  {new Date(badge.awardedAt).toLocaleDateString()}
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-4xl border border-slate-200 bg-slate-50 p-8 text-sm text-slate-600">
              {t("dashboard.noBadges")}
            </div>
          )}
        </div>
      </section>

      <ActiveWorkoutSession />

      <section className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-sky-600">
              {t("dashboard.gymOccupancy")}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              {t("dashboard.currentGymStatus")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {t("dashboard.smartVisits")}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCheckIn}
            className="inline-flex items-center justify-center rounded-3xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {attendanceLoading
              ? t("button.checkingIn")
              : t("dashboard.checkInNow")}
          </button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_0.6fr]">
          <div className="rounded-4xl border border-slate-200 bg-slate-50 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  {t("dashboard.currentOccupancy")}
                </p>
                <p className="mt-3 text-4xl font-semibold text-slate-950">
                  {activeOccupancy} {t("dashboard.peopleInside")}
                </p>
              </div>
              <div className="rounded-3xl bg-sky-100 px-4 py-3 text-sm font-semibold text-sky-700">
                {t("dashboard.live")}
              </div>
            </div>
            {attendanceError ? (
              <div className="mt-4 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {attendanceError}
              </div>
            ) : null}
          </div>

          <div className="rounded-4xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              {t("dashboard.peakHours")}
            </p>
            <div className="mt-5 space-y-3">
              {(attendance?.peakHours || []).slice(6, 22).map((hourEntry) => {
                const maxCount = Math.max(
                  ...((attendance?.peakHours || []).map(
                    (item) => item.count,
                  ) || [0]),
                  1,
                );
                return (
                  <div key={hourEntry.hour} className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>{formatHourLabel(hourEntry.hour)}</span>
                      <span>{hourEntry.count} check-ins</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-sky-500"
                        style={{
                          width: `${(hourEntry.count / maxCount) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

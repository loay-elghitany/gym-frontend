import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "../../context/authContextValue";
import GamificationPanel from "../../components/GamificationPanel";
import ActiveWorkoutSession from "../../components/ActiveWorkoutSession";
import api from "../../api/axios";

export default function MemberDashboard() {
  const { t } = useTranslation();
  const { user, tenant } = useAuth();
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

  const daysUntilExpiry = useMemo(() => {
    if (!user?.subscription?.expiresAt) return null;
    const expiresAt = new Date(user.subscription.expiresAt);
    const today = new Date();
    const diffTime = expiresAt - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [user]);

  const remainingSessions = user?.subscription?.remainingSessions ?? 0;
  const expiresAtLabel = user?.subscription?.expiresAt
    ? new Date(user.subscription.expiresAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : t("dashboard.notAvailable");
  const activeOccupancy = attendance?.activeOccupancy ?? "-";

  const userRank = useMemo(() => {
    const points = Number(user?.gamification?.points || 0);
    if (points >= 1501) return "Gold";
    if (points >= 501) return "Silver";
    return "Bronze";
  }, [user]);

  const currentTenantSlug =
    typeof tenant === "string" ? tenant : tenant?.slug || null;
  const qrCodeValue = useMemo(() => {
    if (!user?._id || !currentTenantSlug) {
      return "";
    }

    return JSON.stringify({
      memberId: user._id,
      tenantSlug: currentTenantSlug,
    });
  }, [currentTenantSlug, user]);

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
      {/* Expiry Banner */}
      {daysUntilExpiry !== null &&
        daysUntilExpiry <= 3 &&
        daysUntilExpiry > 0 && (
          <div className="sticky top-0 z-50 rounded-4xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 px-6 py-4 shadow-lg">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="font-semibold text-orange-900">
                    Your subscription expires in {daysUntilExpiry} day
                    {daysUntilExpiry !== 1 ? "s" : ""}
                  </p>
                  <p className="text-sm text-orange-700">
                    Please renew at the reception to avoid interruption.
                  </p>
                </div>
              </div>
              <button
                onClick={() => (window.location.href = "/profile")}
                className="rounded-full bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
              >
                View Details
              </button>
            </div>
          </div>
        )}

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
          <div className="mt-6 flex flex-wrap gap-4">
            <div className="flex-1 min-w-[160px] rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
                {t("dashboard.remainingSessions")}
              </p>
              <p className="mt-4 text-3xl font-bold text-slate-950">
                {remainingSessions}
              </p>
            </div>
            <div className="flex-1 min-w-[200px] rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
                {t("dashboard.expiresAt")}
              </p>
              <p className="mt-4 text-2xl font-bold text-slate-950 break-words">
                {user?.subscription?.expiresAt
                  ? new Date(user.subscription.expiresAt).toLocaleDateString(
                      undefined,
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      },
                    )
                  : t("dashboard.notAvailable")}
              </p>
            </div>
            <div className="flex-1 min-w-[160px] rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
                {t("dashboard.pointsEarned")}
              </p>
              <p className="mt-4 text-3xl font-bold text-slate-950">
                {user?.gamification?.points || 0}
              </p>
            </div>
            <div className="flex-1 min-w-[160px] rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
                {t("dashboard.currentRank")}
              </p>
              <p className="mt-4 text-3xl font-bold text-slate-950">
                {userRank}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {t("dashboard.rankDescription")}
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

        <div className="mt-6 grid gap-4 grid-cols-1 md:grid-cols-2">
          {badges.length > 0 ? (
            badges.map((badge) => (
              <div
                key={badge.name}
                className="flex min-h-[200px] flex-col justify-between rounded-4xl bg-gradient-to-br from-sky-500 via-cyan-500 to-emerald-500 p-6 shadow-xl shadow-sky-500/20"
              >
                <div>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className="rounded-3xl bg-white/15 px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white">
                      {badge.name}
                    </span>
                    <div className="flex h-11 w-11 items-center justify-center rounded-3xl bg-white/15 text-xl text-white">
                      ⭐
                    </div>
                  </div>
                  <p className="text-sm leading-6 text-white/95 whitespace-normal break-words">
                    {badge.description}
                  </p>
                </div>
                <p className="mt-6 text-xs uppercase tracking-[0.24em] text-white/70">
                  {badge.awardedAt
                    ? new Date(badge.awardedAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : t("dashboard.notAvailable")}
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

      <section className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
        <article className="mx-auto w-full max-w-md rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-950 via-sky-950 to-slate-900 p-5 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.45)] sm:p-6 lg:max-w-none">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-200">
              Scan for Check-in
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
              Check-in card
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-200/90">
              Show this QR code to the reception scanner for a fast, contactless
              check-in.
            </p>
          </div>

          <div className="mt-6 rounded-[24px] bg-white px-4 py-5 shadow-inner sm:px-5">
            {qrCodeValue ? (
              <div className="mx-auto flex w-full max-w-[260px] items-center justify-center rounded-[20px] bg-white p-3 sm:p-4">
                <QRCodeSVG
                  value={qrCodeValue}
                  size={180}
                  bgColor="#ffffff"
                  fgColor="#0f172a"
                  level="H"
                  includeMargin={false}
                  className="mx-auto block h-auto w-full"
                />
              </div>
            ) : (
              <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-sm text-slate-500">
                Loading QR code...
              </div>
            )}
          </div>

          <p className="mt-4 text-center text-xs leading-6 text-slate-300">
            Keep this card visible on your phone and scan it at the front desk
            or gym entrance.
          </p>
        </article>

        <article className="rounded-4xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-500">
            Check-in guidance
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-950">
            Keep your attendance streak alive
          </h2>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
            <li>
              • Scan the QR code before entering the gym to auto-validate your
              session.
            </li>
            <li>
              • Check in daily to keep your streak and badge rewards active.
            </li>
            <li>
              • Use the live occupancy panel to plan your visit during peak
              hours.
            </li>
          </ul>
        </article>
      </section>

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

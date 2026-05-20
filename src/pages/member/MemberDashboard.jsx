import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import GamificationPanel from "../../components/GamificationPanel";
import ActiveWorkoutSession from "../../components/ActiveWorkoutSession";
import api from "../../api/axios";
import CommunityLeaderboard from "../../components/CommunityLeaderboard";
import SmoothieBar from "../../components/SmoothieBar";

export default function MemberDashboard() {
  const { tenant, user } = useAuth();
  const [attendance, setAttendance] = useState(null);
  const [attendanceError, setAttendanceError] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(true);

  const headerTitle = useMemo(
    () => `${user?.name || "Member"} Dashboard`,
    [user],
  );

  const subscriptionStatus = useMemo(() => {
    if (!user?.subscription?.expiresAt) return null;
    const expiresAt = new Date(user.subscription.expiresAt);
    if (expiresAt < new Date() || user.subscription.status === "expired") {
      return "expired";
    }
    return "active";
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
            "Unable to load gym occupancy",
        );
      } finally {
        setAttendanceLoading(false);
      }
    };
    fetchAttendance();
  }, []);

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
        err?.response?.data?.message || err?.message || "Unable to check in",
      );
    } finally {
      setAttendanceLoading(false);
    }
  };

  return (
    <main className="space-y-10">
      <section className="rounded-4xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-900/5">
        <div className="max-w-3xl space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-sky-600">
            Member experience
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
            {headerTitle}
          </h1>
          <p className="text-base leading-8 text-slate-600">
            Welcome back to {tenant?.displayName || "your gym"}. Track your
            progress, unlock rewards, and keep your streak going.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/profile"
              className="inline-flex items-center justify-center rounded-3xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              View advanced profile
            </Link>
            <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Keep your next workout streak going to unlock new badges.
            </div>
          </div>
          {subscriptionStatus === "expired" ? (
            <div className="rounded-4xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
              Your subscription has expired. Renew now to keep training without
              interruption.
            </div>
          ) : null}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_0.9fr]">
        <article className="rounded-4xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-600">
            Quick stats
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Workouts this week</p>
              <p className="mt-4 text-3xl font-semibold text-slate-950">
                {user?.gamification?.attendanceStreak || 0}
              </p>
            </div>
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Total check-ins</p>
              <p className="mt-4 text-3xl font-semibold text-slate-950">
                {user?.attendanceHistory?.length || 0}
              </p>
            </div>
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Points earned</p>
              <p className="mt-4 text-3xl font-semibold text-slate-950">
                {user?.gamification?.points || 0}
              </p>
            </div>
          </div>
        </article>

        <GamificationPanel user={user} />
      </section>

      <ActiveWorkoutSession />

      <section className="grid gap-6 lg:grid-cols-2">
        <CommunityLeaderboard />
        <SmoothieBar />
      </section>

      <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.32em] text-sky-600">
              Upcoming goals
              <section className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.32em] text-sky-600">
                      Gym occupancy
                    </p>
                    <h2 className="text-2xl font-semibold text-slate-950">
                      Current gym status
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Track live occupancy and discover peak attendance hours
                      for smarter visits.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCheckIn}
                    className="inline-flex items-center justify-center rounded-3xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    {attendanceLoading ? "Checking in…" : "Check in now"}
                  </button>
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_0.6fr]">
                  <div className="rounded-4xl border border-slate-200 bg-slate-50 p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-500">
                          Current occupancy
                        </p>
                        <p className="mt-3 text-4xl font-semibold text-slate-950">
                          {attendance?.activeOccupancy ?? "-"} people inside
                        </p>
                      </div>
                      <div className="rounded-3xl bg-sky-100 px-4 py-3 text-sm font-semibold text-sky-700">
                        Live
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
                      Peak hours
                    </p>
                    <div className="mt-5 space-y-3">
                      {(attendance?.peakHours || [])
                        .slice(6, 22)
                        .map((hourEntry) => {
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
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              Personalized habits and rewards
            </h2>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
            Trending now
          </span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl bg-slate-50 p-5 shadow-sm">
            <p className="text-sm text-slate-500">Next milestone</p>
            <p className="mt-3 text-xl font-semibold text-slate-950">
              {user?.attendanceHistory?.length + 5 || 20} workouts
            </p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-5 shadow-sm">
            <p className="text-sm text-slate-500">Buddy challenge</p>
            <p className="mt-3 text-xl font-semibold text-slate-950">
              Invite 2 friends
            </p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-5 shadow-sm">
            <p className="text-sm text-slate-500">Nutrition tip</p>
            <p className="mt-3 text-xl font-semibold text-slate-950">
              Hydrate smarter
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

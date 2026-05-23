import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/authContextValue";
import api from "../../api/axios";

const getOrdinal = (index) => {
  const rank = index + 1;
  if (rank % 10 === 1 && rank % 100 !== 11) return `${rank}st`;
  if (rank % 10 === 2 && rank % 100 !== 12) return `${rank}nd`;
  if (rank % 10 === 3 && rank % 100 !== 13) return `${rank}rd`;
  return `${rank}th`;
};

const rankStyles = {
  Bronze: "bg-amber-100 text-amber-900",
  Silver: "bg-slate-100 text-slate-900",
  Gold: "bg-amber-100 text-amber-900",
};

export default function Leaderboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentIndex = useMemo(
    () => leaderboard.findIndex((row) => row._id === user?._id),
    [leaderboard, user],
  );

  const currentPosition = useMemo(
    () => (currentIndex >= 0 ? currentIndex + 1 : null),
    [currentIndex],
  );

  const currentUserRank = useMemo(() => {
    const points = Number(user?.gamification?.points || 0);
    if (points >= 1501) return "Gold";
    if (points >= 501) return "Silver";
    return "Bronze";
  }, [user]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get("/members/leaderboard");
        const data = response?.data?.data || [];
        setLeaderboard(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load leaderboard",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  return (
    <main className="space-y-8 p-6">
      <section className="rounded-4xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-900/5">
        <div className="max-w-3xl space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-sky-600">
            {t("leaderboard.prestige")}
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
            {t("leaderboard.title") || "Top Performers"}
          </h1>
          <p className="text-base leading-8 text-slate-600">
            {t("leaderboard.description") ||
              "Celebrate your gym community with points, rank, and achievement highlights."}
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_0.6fr]">
        <article className="rounded-4xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">
                Leaderboard
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {t("leaderboard.topMembers") ||
                  "Top 20 members by gym engagement points."}
              </p>
            </div>
            <div className="rounded-3xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
              {user ? `${user.name} · ${currentUserRank}` : "Member rank"}
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-4">#</th>
                  <th className="px-5 py-4">Member</th>
                  <th className="px-5 py-4">Points</th>
                  <th className="px-5 py-4">Rank</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-8 text-center text-slate-500"
                    >
                      Loading leaderboard...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-8 text-center text-rose-600"
                    >
                      {error}
                    </td>
                  </tr>
                ) : leaderboard.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-8 text-center text-slate-500"
                    >
                      No leaderboard data available.
                    </td>
                  </tr>
                ) : (
                  leaderboard.map((member, index) => {
                    const isCurrent = member._id === user?._id;
                    return (
                      <tr
                        key={member._id}
                        className={
                          isCurrent ? "bg-sky-50" : "border-t border-slate-200"
                        }
                      >
                        <td className="px-5 py-4 font-semibold text-slate-900">
                          {getOrdinal(index)}
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-950">
                            {member.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {member.email}
                          </div>
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-900">
                          {member.points}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              rankStyles[member.rank] ||
                              "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {member.rank}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </article>

        <aside className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-4">
            <div className="rounded-4xl bg-slate-50 p-5">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
                Your rank
              </p>
              <p className="mt-4 text-3xl font-semibold text-slate-950">
                {currentUserRank}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {user?.gamification?.points || 0} points earned so far.
              </p>
            </div>
            <div className="rounded-4xl bg-linear-to-br from-sky-500 via-cyan-500 to-emerald-500 p-6 text-white shadow-xl">
              <p className="text-sm uppercase tracking-[0.24em]">
                Leaderboard boost
              </p>
              <p className="mt-4 text-2xl font-semibold">Stay consistent</p>
              <p className="mt-2 text-sm leading-6 text-sky-100">
                The more classes and gym attendances you complete, the faster
                you climb from Bronze to Gold.
              </p>
            </div>
            <div className="rounded-4xl border border-slate-200 p-5">
              <p className="text-sm font-semibold text-slate-900">
                Current position
              </p>
              <p className="mt-3 text-4xl font-semibold text-slate-950">
                {currentPosition
                  ? `${currentPosition}${currentPosition === 1 ? "st" : "th"}`
                  : "Outside top 20"}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {currentPosition
                  ? "Your leaderboard placement among the top members."
                  : "Keep earning points to break into the top 20."}
              </p>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

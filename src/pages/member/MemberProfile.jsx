import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/authContextValue";
import api from "../../api/axios";

export default function MemberProfile() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const rank = user?.gamification?.rank || "Bronze";
  const points = user?.gamification?.points ?? 0;
  const subscriptionStatus = user?.subscription?.status || "inactive";
  const joinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString()
    : "Unknown";
  const latestRecord = records?.[0] || null;
  const bodyFatPercent = latestRecord?.bodyFatPercentage ?? 0;

  const sortedRecords = useMemo(
    () => [...records].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [records],
  );

  useEffect(() => {
    const loadInBodyRecords = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get("/members/inbody");
        const data = response.data?.data || [];
        setRecords(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load InBody progress",
        );
      } finally {
        setLoading(false);
      }
    };

    loadInBodyRecords();
  }, []);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
    : "MB";

  return (
    <main className="space-y-8">
      <section className="rounded-4xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-900/5">
        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <div className="space-y-6">
            <div className="flex flex-col gap-6 rounded-4xl border border-slate-200 bg-slate-50 p-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-5">
                <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-slate-900 text-3xl font-bold text-white">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-24 w-24 rounded-3xl object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">
                    Member profile
                  </p>
                  <h1 className="mt-3 text-4xl font-semibold text-slate-950">
                    {user?.name || "Member"}
                  </h1>
                  <p className="mt-2 text-sm text-slate-600">
                    {user?.email || "No email available"}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl bg-white p-5 shadow-sm">
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
                    Rank
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-slate-950">
                    {rank}
                  </p>
                </div>
                <div className="rounded-3xl bg-white p-5 shadow-sm">
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
                    Points
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-slate-950">
                    {points}
                  </p>
                </div>
                <div className="rounded-3xl bg-white p-5 shadow-sm">
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
                    Latest body fat
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-slate-950">
                    {bodyFatPercent ? `${bodyFatPercent}%` : "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-4xl bg-slate-50 p-6 shadow-sm">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
                  Subscription
                </p>
                <p className="mt-3 text-xl font-semibold text-slate-950 capitalize">
                  {subscriptionStatus}
                </p>
              </div>
              <div className="rounded-4xl bg-slate-50 p-6 shadow-sm">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
                  Join date
                </p>
                <p className="mt-3 text-xl font-semibold text-slate-950">
                  {joinDate}
                </p>
              </div>
              <div className="rounded-4xl bg-slate-50 p-6 shadow-sm">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
                  Current plan
                </p>
                <p className="mt-3 text-xl font-semibold text-slate-950">
                  {user?.subscription?.packageType || "Standard Plan"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-4xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-600">
              InBody progress
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-950">
              Body composition timeline
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Track your body fat, weight, and visceral health over time with a
              clean historical view.
            </p>
          </div>
          <div className="w-full max-w-sm rounded-4xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Latest body fat progress</p>
            <div className="mt-4 rounded-full bg-slate-200 p-1">
              <div
                className="h-4 rounded-full bg-emerald-500 transition-all"
                style={{ width: `${Math.min(bodyFatPercent, 100)}%` }}
              />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-900">
              {bodyFatPercent ? `${bodyFatPercent}%` : "No recent data"}
            </p>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-4xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Weight</th>
                  <th className="px-6 py-4 font-semibold">Body Fat</th>
                  <th className="px-6 py-4 font-semibold">Muscle Mass</th>
                  <th className="px-6 py-4 font-semibold">Visceral Fat</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-8 text-center text-slate-500"
                    >
                      Loading InBody records...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-8 text-center text-rose-600"
                    >
                      {error}
                    </td>
                  </tr>
                ) : sortedRecords.length ? (
                  sortedRecords.map((record) => (
                    <tr
                      key={record._id}
                      className="border-b border-slate-200 last:border-b-0"
                    >
                      <td className="px-6 py-4 text-slate-900">
                        {record.date
                          ? new Date(record.date).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-6 py-4">
                        {record.weight ? `${record.weight} kg` : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="text-slate-900 font-semibold">
                            {record.bodyFatPercentage != null
                              ? `${record.bodyFatPercentage}%`
                              : "—"}
                          </div>
                          {record.bodyFatPercentage != null ? (
                            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                              <div
                                className="h-full rounded-full bg-sky-600"
                                style={{
                                  width: `${Math.min(record.bodyFatPercentage, 100)}%`,
                                }}
                              />
                            </div>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {record.muscleMass ? `${record.muscleMass} kg` : "—"}
                      </td>
                      <td className="px-6 py-4">
                        {record.visceralFat ? `${record.visceralFat}` : "—"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-8 text-center text-slate-500"
                    >
                      No InBody progress records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}

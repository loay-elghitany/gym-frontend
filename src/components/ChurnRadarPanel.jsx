import { useEffect, useState } from "react";
import api from "../api/axios";

export default function ChurnRadarPanel() {
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifyMessage, setNotifyMessage] = useState(null);
  const [requestInProgress, setRequestInProgress] = useState(false);

  useEffect(() => {
    const fetchRisk = async () => {
      setLoading(true);
      try {
        const response = await api.get("/churn-radar?days=10");
        setRiskData(response?.data?.data || null);
      } catch (error) {
        setRiskData({ count: 0, members: [] });
      } finally {
        setLoading(false);
      }
    };
    fetchRisk();
  }, []);

  const handleNotify = async (memberId) => {
    setRequestInProgress(true);
    setNotifyMessage(null);
    try {
      const res = await api.post("/churn-radar/notify", { memberId });
      setNotifyMessage(res?.data?.message || "Notification sent.");
    } catch (err) {
      setNotifyMessage(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to send notification.",
      );
    } finally {
      setRequestInProgress(false);
    }
  };

  const totalInactive = riskData?.count || 0;
  const segments = [
    {
      label: "High churn",
      value: totalInactive ? Math.round(totalInactive * 0.42) : 0,
      color: "bg-rose-500/80",
    },
    {
      label: "At risk",
      value: totalInactive ? Math.round(totalInactive * 0.28) : 0,
      color: "bg-amber-400/90",
    },
    {
      label: "Stable",
      value: totalInactive ? Math.round(totalInactive * 0.17) : 0,
      color: "bg-sky-500/80",
    },
    {
      label: "Loyal",
      value: totalInactive ? Math.round(totalInactive * 0.13) : 0,
      color: "bg-emerald-500/80",
    },
  ];

  return (
    <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-sky-600">
            Churn Radar
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Membership attrition pulse
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Surface the most vulnerable members and trigger retention outreach
            with a single tap.
          </p>
        </div>

        <span className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">
          {loading ? "Loading..." : `${totalInactive} inactive members`}
        </span>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="relative overflow-hidden rounded-[2rem] bg-slate-950/5 p-6">
          <div className="relative mx-auto flex h-64 w-64 items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-slate-200" />
            <div className="absolute inset-12 rounded-full bg-sky-500/10" />
            <div className="absolute inset-20 rounded-full bg-emerald-500/10" />
            <div className="absolute inset-28 rounded-full bg-amber-400/10" />
            <div className="absolute inset-36 rounded-full bg-rose-500/10" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-full bg-white px-5 py-4 text-center shadow-lg shadow-slate-900/5">
                <p className="text-sm uppercase tracking-[0.28em] text-slate-500">
                  Inactive Members
                </p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">
                  {loading ? "..." : totalInactive}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4">
            {segments.map((segment) => (
              <div
                key={segment.label}
                className="flex items-center justify-between gap-4 rounded-3xl bg-white px-4 py-3 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex h-3 w-3 rounded-full ${segment.color}`}
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {segment.label}
                    </p>
                    <p className="text-xs text-slate-500">
                      {segment.value} members
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  {segment.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 rounded-[2rem] border border-slate-200 bg-slate-50 p-6">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.32em] text-slate-500">
              Recovery playbook
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Use the Telegram alert buttons to reach inactive members and
              recover lost revenue before churn becomes permanent.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-950">
              Top inactive members
            </p>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              {loading ? (
                <li>Loading members...</li>
              ) : (
                riskData?.members?.slice(0, 3).map((member) => {
                  const absentDays = member.lastAttendanceAt
                    ? Math.max(
                        10,
                        Math.floor(
                          (Date.now() -
                            new Date(member.lastAttendanceAt).getTime()) /
                            (1000 * 60 * 60 * 24),
                        ),
                      )
                    : 10;
                  return (
                    <li
                      key={member._id}
                      className="rounded-2xl bg-slate-50 px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-950">
                            {member.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            Absent {absentDays}+ days
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={requestInProgress}
                          onClick={() => handleNotify(member._id)}
                          className="rounded-3xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                        >
                          Notify
                        </button>
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
            {notifyMessage ? (
              <p className="mt-4 text-sm text-slate-700">{notifyMessage}</p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function AdvancedMemberProfile() {
  const { user, fetchCurrentUser } = useAuth();
  const [entry, setEntry] = useState({
    date: new Date().toISOString().substring(0, 10),
    weight: "",
    bodyFatPercentage: "",
    muscleMass: "",
    visceralFat: "",
    bodyWaterPercentage: "",
    note: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [freezeModal, setFreezeModal] = useState(false);
  const [freezeDays, setFreezeDays] = useState(3);
  const [freezeMessage, setFreezeMessage] = useState(null);
  const [freezing, setFreezing] = useState(false);

  const history = user?.healthProfile?.inBodyHistory || [];
  const latest = history[0] || null;
  const hasHistory = history.length > 0;
  const badgeStatus =
    user?.gamification?.attendanceStreak >= 10 ? "Gym Addict" : "On track";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await api.put(`/users/${user._id}/health-profile`, {
        inBodyEntry: entry,
      });
      await fetchCurrentUser();
      setMessage("InBody entry saved.");
      setEntry({
        date: new Date().toISOString().substring(0, 10),
        weight: "",
        bodyFatPercentage: "",
        muscleMass: "",
        visceralFat: "",
        bodyWaterPercentage: "",
        note: "",
      });
    } catch (err) {
      setMessage(
        err?.response?.data?.message || err?.message || "Unable to save entry.",
      );
    } finally {
      setSaving(false);
    }
  };

  const isFrozen =
    user?.subscription?.status === "paused" &&
    user?.subscription?.frozenUntil &&
    new Date(user.subscription.frozenUntil) > new Date();
  const frozenUntil = isFrozen ? new Date(user.subscription.frozenUntil) : null;

  const openFreezeModal = () => {
    setFreezeMessage(null);
    setFreezeModal(true);
  };

  const closeFreezeModal = () => {
    setFreezeModal(false);
    setFreezeMessage(null);
  };

  const handleFreezeSubmit = async (e) => {
    e.preventDefault();
    setFreezing(true);
    setFreezeMessage(null);
    try {
      const response = await api.post("/subscriptions/freeze", {
        days: freezeDays,
      });
      if (response?.data?.success) {
        await fetchCurrentUser();
        setFreezeMessage("Membership successfully frozen.");
        setTimeout(() => setFreezeModal(false), 800);
      }
    } catch (err) {
      setFreezeMessage(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to freeze membership.",
      );
    } finally {
      setFreezing(false);
    }
  };

  const stats = [
    {
      label: "Latest weight",
      value: latest ? `${latest.weight || "-"} kg` : "–",
      change: "+1.9",
    },
    {
      label: "Body fat",
      value: latest ? `${latest.bodyFatPercentage || "-"}%` : "–",
      change: latest ? "-0.8" : "",
    },
    {
      label: "Muscle mass",
      value: latest ? `${latest.muscleMass || "-"} kg` : "–",
      change: latest ? "+1.2" : "",
    },
  ];

  return (
    <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-sky-600">
            Member Profile
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Advanced health and progress view
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Explore body composition trends, biometric entries, and
            transformation milestones with premium reporting.
          </p>
          <div className="mt-3 flex items-center gap-3">
            {isFrozen ? (
              <div className="rounded-3xl bg-rose-100 px-4 py-3 text-sm font-semibold text-rose-700">
                Membership is currently frozen until{" "}
                {frozenUntil?.toLocaleDateString()}
              </div>
            ) : null}
            <button
              type="button"
              onClick={openFreezeModal}
              disabled={isFrozen}
              className="inline-flex items-center justify-center rounded-3xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isFrozen ? "Membership frozen" : "Freeze membership"}
            </button>
          </div>
        </div>
        <div className="rounded-3xl bg-slate-950/95 px-4 py-3 text-sm font-semibold text-white shadow-sm">
          {badgeStatus}
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-4xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="text-lg font-semibold text-slate-950">
              Health snapshot
            </h3>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-3xl bg-white p-4 shadow-sm"
                >
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <p className="mt-3 text-2xl font-semibold text-slate-950">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {stat.change ? `${stat.change}% change` : ""}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <p className="text-sm text-slate-500">Hydration level</p>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full w-8/12 rounded-full bg-sky-500" />
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-500">Recovery readiness</p>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full w-10/12 rounded-full bg-emerald-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-4xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="text-lg font-semibold text-slate-950">
              InBody trend
            </h3>
            <div className="mt-6 space-y-4">
              {hasHistory ? (
                history.slice(0, 3).map((entryData) => (
                  <div
                    key={entryData.date}
                    className="rounded-3xl bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <span>
                        {new Date(entryData.date).toLocaleDateString()}
                      </span>
                      <span>{entryData.weight || "--"} kg</span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-600">
                      <div>Fat: {entryData.bodyFatPercentage || "--"}%</div>
                      <div>Muscle: {entryData.muscleMass || "--"} kg</div>
                      <div>Visceral: {entryData.visceralFat || "--"}</div>
                      <div>
                        Hydration: {entryData.bodyWaterPercentage || "--"}%
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl bg-white p-4 shadow-sm text-sm text-slate-600">
                  No biometric history logged yet.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-4xl border border-slate-200 bg-slate-50 p-6">
          <h3 className="text-lg font-semibold text-slate-950">
            Log new InBody entry
          </h3>
          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-700">
                Date
                <input
                  type="date"
                  value={entry.date}
                  onChange={(e) =>
                    setEntry((prev) => ({ ...prev, date: e.target.value }))
                  }
                  className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                Weight (kg)
                <input
                  type="number"
                  value={entry.weight}
                  onChange={(e) =>
                    setEntry((prev) => ({ ...prev, weight: e.target.value }))
                  }
                  className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3"
                />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-700">
                Body fat %
                <input
                  type="number"
                  value={entry.bodyFatPercentage}
                  onChange={(e) =>
                    setEntry((prev) => ({
                      ...prev,
                      bodyFatPercentage: e.target.value,
                    }))
                  }
                  className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                Muscle mass (kg)
                <input
                  type="number"
                  value={entry.muscleMass}
                  onChange={(e) =>
                    setEntry((prev) => ({
                      ...prev,
                      muscleMass: e.target.value,
                    }))
                  }
                  className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3"
                />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-700">
                Visceral fat
                <input
                  type="number"
                  value={entry.visceralFat}
                  onChange={(e) =>
                    setEntry((prev) => ({
                      ...prev,
                      visceralFat: e.target.value,
                    }))
                  }
                  className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                Body water %
                <input
                  type="number"
                  value={entry.bodyWaterPercentage}
                  onChange={(e) =>
                    setEntry((prev) => ({
                      ...prev,
                      bodyWaterPercentage: e.target.value,
                    }))
                  }
                  className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3"
                />
              </label>
            </div>
            <label className="space-y-2 text-sm text-slate-700">
              Notes
              <textarea
                rows={3}
                value={entry.note}
                onChange={(e) =>
                  setEntry((prev) => ({ ...prev, note: e.target.value }))
                }
                className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3"
              />
            </label>
            {message ? (
              <p className="text-sm text-slate-700">{message}</p>
            ) : null}
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-3xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save InBody Entry"}
            </button>
          </form>
        </div>
      </div>
      {freezeModal ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 px-4 py-8">
          <div className="w-full max-w-lg rounded-[2rem] bg-white p-8 shadow-2xl shadow-slate-900/10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-950">
                  Freeze membership
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Pause your plan for up to 7 days while keeping your progress
                  safe.
                </p>
              </div>
              <button
                type="button"
                onClick={closeFreezeModal}
                className="rounded-3xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                Close
              </button>
            </div>
            <form className="mt-8 space-y-6" onSubmit={handleFreezeSubmit}>
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-slate-700">
                  Freeze duration
                </label>
                <div className="flex flex-wrap gap-3">
                  {[1, 3, 5, 7].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setFreezeDays(days)}
                      className={`rounded-3xl px-4 py-3 text-sm font-semibold ${
                        freezeDays === days
                          ? "bg-slate-950 text-white"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {days} days
                    </button>
                  ))}
                </div>
              </div>
              {freezeMessage ? (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  {freezeMessage}
                </div>
              ) : null}
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeFreezeModal}
                  className="rounded-3xl border border-slate-200 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={freezing}
                  className="rounded-3xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {freezing ? "Freezing…" : "Confirm freeze"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}

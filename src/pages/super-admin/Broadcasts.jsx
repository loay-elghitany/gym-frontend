import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function Broadcasts() {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", message: "", audience: "all" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const loadBroadcasts = async () => {
    setLoading(true);
    try {
      const response = await api.get("/superadmin/broadcasts");
      setBroadcasts(response.data?.data || []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load broadcasts",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBroadcasts();
  }, []);

  const createBroadcast = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.post("/superadmin/broadcasts", form);
      setForm({ title: "", message: "", audience: "all" });
      await loadBroadcasts();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to create broadcast",
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteBroadcast = async (broadcastId) => {
    const previous = broadcasts;
    setBroadcasts((current) =>
      current.filter((item) => item._id !== broadcastId),
    );
    try {
      await api.delete(`/superadmin/broadcasts/${broadcastId}`);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to delete broadcast",
      );
      setBroadcasts(previous);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
              Platform alerts
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-950">
              Broadcast messages
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Send announcements to tenant users and gym owners across the
              network.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-xl font-semibold text-slate-950">
              Active broadcasts
            </h3>
            <p className="text-sm text-slate-500">
              Messages shown in tenant dashboards.
            </p>
          </div>
          {loading ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-700">
              Loading broadcasts...
            </div>
          ) : (
            <div className="space-y-4">
              {broadcasts.map((item) => (
                <div
                  key={item._id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-slate-950">
                        {item.title}
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        {item.message}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                        {item.audience || "all"}
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteBroadcast(item._id)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                        aria-label="Delete broadcast"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-5 w-5"
                          aria-hidden
                        >
                          <path
                            d="M6 7h12M9 7V5h6v2m-7 0v12a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V7"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill="none"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-3 text-xs text-slate-500">
                    <span>
                      Created at {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-950">
            Create broadcast
          </h3>
          <div className="mt-5 space-y-4">
            <label className="block text-sm text-slate-700">
              Title
              <input
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </label>
            <label className="block text-sm text-slate-700">
              Message
              <textarea
                rows="4"
                value={form.message}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    message: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </label>
            <label className="block text-sm text-slate-700">
              Audience
              <select
                value={form.audience}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    audience: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              >
                <option value="all">All Users</option>
                <option value="owners">Gym Owners</option>
                <option value="members">Members</option>
              </select>
            </label>
            {error ? (
              <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}
            <button
              type="button"
              disabled={saving}
              onClick={createBroadcast}
              className="mt-2 w-full rounded-3xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Broadcasting..." : "Publish broadcast"}
            </button>
          </div>
        </aside>
      </section>
    </div>
  );
}

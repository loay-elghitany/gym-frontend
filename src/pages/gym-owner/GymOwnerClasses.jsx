import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import useBodyScrollLock from "../../hooks/useBodyScrollLock";

const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function GymOwnerClasses() {
  const [classes, setClasses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    capacity: 12,
    trainerId: "",
  });

  useBodyScrollLock(modalOpen);

  const loadClasses = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/classes");
      setClasses(response?.data?.data || []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load classes",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadTrainers = async () => {
    try {
      const response = await api.get("/users?role=trainer&limit=100");
      setTrainers(response?.data?.data?.users || []);
    } catch (err) {
      console.warn("Unable to load trainers", err);
    }
  };

  useEffect(() => {
    loadClasses();
    loadTrainers();
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const classCount = classes.length;

  const handleOpenModal = () => {
    setModalOpen(true);
    setForm({
      title: "",
      description: "",
      startTime: "",
      endTime: "",
      capacity: 12,
      trainerId: "",
    });
    setError(null);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setError(null);
  };

  const refreshClasses = async () => {
    await loadClasses();
  };

  const handleCreateClass = async (event) => {
    event.preventDefault();
    setCreating(true);
    setError(null);

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        startTime: form.startTime,
        endTime: form.endTime,
        capacity: Number(form.capacity),
        trainerId: form.trainerId || undefined,
      };

      const response = await api.post("/classes", payload);
      const created = response?.data?.data;
      if (created) {
        setToast({ type: "success", message: "Class created successfully." });
        handleCloseModal();
        await refreshClasses();
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to create class",
      );
    } finally {
      setCreating(false);
    }
  };

  const sortedClasses = useMemo(
    () =>
      [...classes].sort(
        (a, b) => new Date(a.startTime) - new Date(b.startTime),
      ),
    [classes],
  );

  return (
    <main className="space-y-8 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-sky-600">
            Owner Class Oversight
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
            Gym Class Schedule & Capacity
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
            Review scheduled classes across your gym and inspect enrollment
            counts.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {classCount} class{classCount !== 1 ? "es" : ""} scheduled
          </div>
          <button
            type="button"
            onClick={handleOpenModal}
            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Create New Class
          </button>
        </div>
      </div>

      {toast ? (
        <div
          className={`rounded-3xl border px-5 py-4 text-sm font-medium ${
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-200 bg-rose-50 text-rose-900"
          }`}
        >
          {toast.message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-4xl border border-slate-200 bg-slate-50 p-8 text-slate-600">
          Loading classes...
        </div>
      ) : sortedClasses.length === 0 ? (
        <div className="rounded-4xl border border-slate-200 bg-slate-50 p-8 text-slate-600">
          No classes found for this gym.
        </div>
      ) : (
        <div className="grid gap-6">
          {sortedClasses.map((gymClass) => {
            const enrolledCount = gymClass.enrolledMembers?.length || 0;
            const percentage = gymClass.capacity
              ? Math.round((enrolledCount / gymClass.capacity) * 100)
              : 0;

            return (
              <article
                key={gymClass._id}
                className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-950">
                      {gymClass.title}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">
                      {gymClass.description || "No description provided."}
                    </p>
                  </div>
                  <div className="text-right text-sm text-slate-600">
                    <p>{formatDateTime(gymClass.startTime)}</p>
                    <p>{formatDateTime(gymClass.endTime)}</p>
                    <p className="mt-2 font-semibold text-slate-900">
                      {enrolledCount}/{gymClass.capacity} booked
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
                    <p>Trainer: {gymClass.trainerId?.name || "Unknown"}</p>
                    <p>Occupancy: {percentage}%</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {gymClass.enrolledMembers?.map((member) => (
                      <div
                        key={member._id}
                        className="rounded-3xl border border-slate-200 bg-white p-4"
                      >
                        <p className="font-semibold text-slate-950">
                          {member.name}
                        </p>
                        <p className="text-sm text-slate-600">{member.email}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {modalOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4">
          <div className="w-full max-w-3xl rounded-4xl bg-white p-6 shadow-2xl shadow-slate-950/20">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-950">
                  Create New Class
                </h2>
                <p className="text-sm text-slate-600">
                  Assign this session to a trainer and publish it for members.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-200"
              >
                Close
              </button>
            </div>

            <form className="space-y-6" onSubmit={handleCreateClass}>
              <div className="grid gap-6 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Title
                  </span>
                  <input
                    value={form.title}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    required
                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Trainer
                  </span>
                  <select
                    value={form.trainerId}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        trainerId: event.target.value,
                      }))
                    }
                    required
                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                  >
                    <option value="">Select trainer</option>
                    {trainers.map((trainer) => (
                      <option key={trainer._id} value={trainer._id}>
                        {trainer.name} — {trainer.email}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Description
                </span>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={4}
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                />
              </label>

              <div className="grid gap-6 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Start time
                  </span>
                  <input
                    type="datetime-local"
                    value={form.startTime}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        startTime: event.target.value,
                      }))
                    }
                    required
                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    End time
                  </span>
                  <input
                    type="datetime-local"
                    value={form.endTime}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        endTime: event.target.value,
                      }))
                    }
                    required
                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                  />
                </label>
              </div>

              <label className="block max-w-xs">
                <span className="text-sm font-medium text-slate-700">
                  Capacity
                </span>
                <input
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      capacity: Number(event.target.value),
                    }))
                  }
                  required
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                />
              </label>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {creating ? "Creating..." : "Create Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}

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

export default function TrainerClasses() {
  const [classes, setClasses] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    capacity: 12,
  });
  const [enrollMemberId, setEnrollMemberId] = useState("");

  const selectedClass = useMemo(
    () => classes.find((item) => item._id === selectedClassId) || null,
    [classes, selectedClassId],
  );

  useBodyScrollLock(modalOpen);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [classRes, userRes] = await Promise.all([
          api.get("/trainer/classes"),
          api.get("/users"),
        ]);

        const classData = classRes?.data?.data || [];
        const userData =
          userRes?.data?.data?.users || userRes?.data?.users || [];
        setClasses(Array.isArray(classData) ? classData : []);
        setMembers(Array.isArray(userData) ? userData : []);
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

    loadData();
  }, []);

  const availableMembers = useMemo(
    () => members.filter((member) => member.role === "member"),
    [members],
  );

  const handleOpenModal = () => {
    setModalOpen(true);
    setForm({
      title: "",
      description: "",
      startTime: "",
      endTime: "",
      capacity: 12,
    });
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
      };

      const response = await api.post("/trainer/classes", payload);
      const created = response?.data?.data;
      if (created) {
        setClasses((current) =>
          [...current, created].sort(
            (a, b) => new Date(a.startTime) - new Date(b.startTime),
          ),
        );
        setModalOpen(false);
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to create class",
      );
    } finally {
      setCreating(false);
    }
  };

  const handleEnroll = async () => {
    if (!selectedClass || !enrollMemberId) return;

    try {
      const response = await api.post(
        `/trainer/classes/${selectedClass._id}/enroll`,
        { memberId: enrollMemberId },
      );
      const updated = response?.data?.data;
      if (updated) {
        setClasses((current) =>
          current.map((item) => (item._id === updated._id ? updated : item)),
        );
        setEnrollMemberId("");
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to enroll member",
      );
    }
  };

  const handleToggleAttendance = async (memberId, status) => {
    if (!selectedClass) return;

    try {
      const response = await api.patch(
        `/trainer/classes/${selectedClass._id}/attendance`,
        { memberId, status },
      );
      const updated = response?.data?.data;
      if (updated) {
        setClasses((current) =>
          current.map((item) => (item._id === updated._id ? updated : item)),
        );
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to update attendance",
      );
    }
  };

  return (
    <main className="space-y-8 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-sky-600">
            Trainer Classes
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
            Class Roster & Attendance Matrix
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
            Create classes, manage enrollments, and mark attendance in a single
            trainer view.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenModal}
          className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Create New Class
        </button>
      </div>

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(320px,1fr)_minmax(420px,1.2fr)]">
        <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">
                Upcoming Classes
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Browse scheduled classes and expand any session for attendance
                details.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
              {classes.length} sessions
            </span>
          </div>

          {loading ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-600">
              Loading classes...
            </div>
          ) : classes.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-600">
              No classes scheduled yet. Use the button above to add a class.
            </div>
          ) : (
            <div className="space-y-4">
              {classes.map((gymClass) => {
                const enrolledCount = gymClass.enrolledMembers?.length || 0;
                const isSelected = selectedClassId === gymClass._id;
                return (
                  <button
                    type="button"
                    key={gymClass._id}
                    onClick={() => setSelectedClassId(gymClass._id)}
                    className={`w-full rounded-3xl border p-5 text-left transition ${
                      isSelected
                        ? "border-sky-500 bg-sky-50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-950">
                          {gymClass.title}
                        </h3>
                        <p className="mt-2 text-sm text-slate-600">
                          {gymClass.description || "No description provided."}
                        </p>
                      </div>
                      <div className="text-sm text-slate-600">
                        <p>
                          {formatDateTime(gymClass.startTime)} –{" "}
                          {formatDateTime(gymClass.endTime)}
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {enrolledCount}/{gymClass.capacity} Booked
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-950">
              Class Roster Matrix
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Select a class to view enrolled members, mark attendance, and add
              new participants.
            </p>
          </div>

          {!selectedClass ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-slate-600">
              Select a class from the list to open the roster and attendance
              tools.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-lg font-semibold text-slate-950">
                  {selectedClass.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  {selectedClass.description || "No description provided."}
                </p>
                <p className="mt-3 text-sm text-slate-700">
                  Trainer: {selectedClass.trainerId?.name || "Unknown"}
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {formatDateTime(selectedClass.startTime)} —{" "}
                  {formatDateTime(selectedClass.endTime)}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Enroll Member
                    </p>
                    <p className="text-sm text-slate-600">
                      Add a member to the selected class roster.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <select
                      value={enrollMemberId}
                      onChange={(event) =>
                        setEnrollMemberId(event.target.value)
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 sm:w-auto"
                    >
                      <option value="">Select member</option>
                      {availableMembers.map((member) => (
                        <option key={member._id} value={member._id}>
                          {member.name} — {member.email}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleEnroll}
                      className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      Enroll
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-5 py-4 font-medium uppercase tracking-[0.12em]">
                        Member
                      </th>
                      <th className="px-5 py-4 font-medium uppercase tracking-[0.12em]">
                        Email
                      </th>
                      <th className="px-5 py-4 font-medium uppercase tracking-[0.12em]">
                        Attendance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {selectedClass.enrolledMembers?.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-5 py-7 text-sm text-slate-600"
                        >
                          No enrolled members yet. Enroll members to build the
                          attendance roster.
                        </td>
                      </tr>
                    ) : (
                      selectedClass.enrolledMembers.map((member) => {
                        const record = selectedClass.attendanceRecord?.find(
                          (item) => {
                            const recordId =
                              item.memberId?._id || item.memberId;
                            return String(recordId) === String(member._id);
                          },
                        );
                        const status = record?.status || "absent";
                        return (
                          <tr key={member._id}>
                            <td className="px-5 py-4 font-medium text-slate-900">
                              {member.name}
                            </td>
                            <td className="px-5 py-4 text-slate-600">
                              {member.email}
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleToggleAttendance(
                                      member._id,
                                      "present",
                                    )
                                  }
                                  className={`rounded-2xl px-3 py-2 text-sm font-semibold transition ${
                                    status === "present"
                                      ? "bg-emerald-100 text-emerald-900"
                                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                  }`}
                                >
                                  Present ✅
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleToggleAttendance(member._id, "absent")
                                  }
                                  className={`rounded-2xl px-3 py-2 text-sm font-semibold transition ${
                                    status === "absent"
                                      ? "bg-rose-100 text-rose-900"
                                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                  }`}
                                >
                                  Absent ❌
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-4xl bg-white p-6 shadow-2xl shadow-slate-900/20">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-950">
                  Create New Class
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Schedule a new trainer-led class and invite members to enroll.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 transition hover:text-slate-600"
              >
                Close
              </button>
            </div>

            <form className="space-y-5" onSubmit={handleCreateClass}>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-900">
                  Title
                </label>
                <input
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                  placeholder="Morning Strength Class"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-900">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                  rows={3}
                  placeholder="A focused session for strength, mobility and conditioning."
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-900">
                    Start time
                  </label>
                  <input
                    type="datetime-local"
                    value={form.startTime}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        startTime: event.target.value,
                      }))
                    }
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-900">
                    End time
                  </label>
                  <input
                    type="datetime-local"
                    value={form.endTime}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        endTime: event.target.value,
                      }))
                    }
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-900">
                  Capacity
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.capacity}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      capacity: event.target.value,
                    }))
                  }
                  className="w-32 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                  required
                />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating ? "Saving..." : "Create Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}

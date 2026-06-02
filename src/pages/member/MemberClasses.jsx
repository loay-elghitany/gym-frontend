import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/authContextValue";

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

export default function MemberClasses() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);

  const currentUserId = user?._id;

  useEffect(() => {
    const loadClasses = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get("/classes");
        const classData = response?.data?.data || [];
        setClasses(Array.isArray(classData) ? classData : []);
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

    loadClasses();
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const classIsEnrolled = (gymClass) => {
    if (!gymClass?.enrolledMembers) return false;
    return gymClass.enrolledMembers.some((member) => {
      if (!member) return false;
      return member._id
        ? member._id.toString() === currentUserId?.toString()
        : member.toString() === currentUserId?.toString();
    });
  };

  const handleBook = async (gymClass) => {
    if (!gymClass) return;
    setActionLoading(gymClass._id);
    setError(null);
    try {
      const response = await api.post(`/classes/${gymClass._id}/enroll`);
      const updated = response?.data?.data;
      if (updated) {
        setClasses((current) =>
          current.map((item) => (item._id === updated._id ? updated : item)),
        );
        setToast({ type: "success", message: "Class booked successfully." });
      }
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.message || "Unable to book class",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (gymClass) => {
    if (!gymClass) return;
    setActionLoading(gymClass._id);
    setError(null);
    try {
      const response = await api.delete(`/classes/${gymClass._id}/enroll`);
      const updated = response?.data?.data;
      if (updated) {
        setClasses((current) =>
          current.map((item) => (item._id === updated._id ? updated : item)),
        );
        setToast({ type: "success", message: "Class booking canceled." });
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to cancel booking",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const displayedClasses = useMemo(() => {
    return classes
      .slice()
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  }, [classes]);

  return (
    <main className="space-y-8 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-sky-600">
            My Classes
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
            Book or cancel your gym sessions
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
            Browse available classes for your gym and manage your bookings
            directly.
          </p>
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
      ) : displayedClasses.length === 0 ? (
        <div className="rounded-4xl border border-slate-200 bg-slate-50 p-8 text-slate-600">
          No classes are scheduled yet. Check back later or contact your gym
          owner.
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {displayedClasses.map((gymClass) => {
            const enrolled = classIsEnrolled(gymClass);
            const enrolledCount = gymClass.enrolledMembers?.length || 0;
            const isFull = enrolledCount >= gymClass.capacity;
            const buttonLabel = enrolled
              ? "Cancel Booking"
              : isFull
                ? "Class Full"
                : "Book Class";

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
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-2 text-sm text-slate-700">
                    <p>Trainer: {gymClass.trainerId?.name || "Staff"}</p>
                    <p>
                      Status: {enrolled ? "Booked" : isFull ? "Full" : "Open"}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={
                      actionLoading === gymClass._id || (!enrolled && isFull)
                    }
                    onClick={() =>
                      enrolled ? handleCancel(gymClass) : handleBook(gymClass)
                    }
                    className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition ${
                      enrolled
                        ? "bg-rose-600 text-white hover:bg-rose-700"
                        : isFull
                          ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                          : "bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                  >
                    {actionLoading === gymClass._id
                      ? "Processing..."
                      : buttonLabel}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}

import { useEffect, useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/authContextValue";

export default function WeeklyCheckIn() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    currentWeight: "",
    fatigueLevel: 5,
    notes: "",
    photos: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [myCheckIns, setMyCheckIns] = useState([]);
  const [checkInsLoading, setCheckInsLoading] = useState(true);

  useEffect(() => {
    fetchMyCheckIns();
  }, []);

  const fetchMyCheckIns = async () => {
    try {
      const response = await api.get("/trainee/my-checkins");
      setMyCheckIns(response.data.data || []);
    } catch (err) {
      console.error("Failed to load check-ins:", err);
    } finally {
      setCheckInsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const payload = {
        ...formData,
        currentWeight: Number(formData.currentWeight),
        fatigueLevel: Number(formData.fatigueLevel),
      };
      // include trainerId if available in the user profile
      if (user?.trainerId) payload.trainerId = user.trainerId;
      await api.post("/trainee/checkin", payload);
      setSuccess(true);
      setFormData({
        currentWeight: "",
        fatigueLevel: 5,
        notes: "",
        photos: [],
      });
      fetchMyCheckIns();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to submit check-in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="space-y-8 p-6 lg:p-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">
          Weekly Progress
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Weekly Check-in
        </h1>
        <p className="mt-2 text-slate-600">
          Track your progress and share updates with your trainer
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Check-in Form */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">
            Submit This Week's Check-in
          </h2>
          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Current Weight (kg)
                <input
                  type="number"
                  step="0.1"
                  value={formData.currentWeight}
                  onChange={(e) =>
                    setFormData({ ...formData, currentWeight: e.target.value })
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500"
                  placeholder="75.5"
                />
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Fatigue Level (1-10)
                <div className="mt-2 flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.fatigueLevel}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fatigueLevel: e.target.value,
                      })
                    }
                    className="flex-1"
                  />
                  <span className="text-2xl font-semibold text-slate-900">
                    {formData.fatigueLevel}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  1 = Very Fresh, 10 = Extremely Exhausted
                </p>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Notes for Trainer
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={4}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500"
                  placeholder="How are you feeling? Any challenges or achievements?"
                />
              </label>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                ✓ Check-in submitted successfully!
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {loading ? "Submitting..." : "Submit Check-in"}
            </button>
          </form>
        </div>

        {/* Check-in History */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">
            Your Check-in History
          </h2>
          {checkInsLoading ? (
            <div className="mt-4 text-sm text-slate-600">Loading...</div>
          ) : myCheckIns.length > 0 ? (
            <div className="mt-4 space-y-4">
              {myCheckIns.map((checkIn) => (
                <div
                  key={checkIn._id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Week {checkIn.weekNumber}, {checkIn.year}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(checkIn.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        checkIn.trainerFeedback
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {checkIn.trainerFeedback ? "Reviewed" : "Pending"}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Weight</p>
                      <p className="font-semibold text-slate-900">
                        {checkIn.currentWeight || "-"} kg
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Fatigue</p>
                      <p className="font-semibold text-slate-900">
                        {checkIn.fatigueLevel}/10
                      </p>
                    </div>
                  </div>
                  {checkIn.notes && (
                    <div className="mt-3">
                      <p className="text-xs text-slate-500">Notes</p>
                      <p className="text-sm text-slate-700">{checkIn.notes}</p>
                    </div>
                  )}
                  {checkIn.trainerFeedback && (
                    <div className="mt-3 rounded-lg bg-emerald-50 p-3">
                      <p className="text-xs font-semibold text-emerald-700">
                        Trainer Feedback
                      </p>
                      <p className="mt-1 text-sm text-emerald-900">
                        {checkIn.trainerFeedback}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 text-sm text-slate-500">
              No check-ins submitted yet
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

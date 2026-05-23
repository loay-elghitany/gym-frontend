import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function MyPlans() {
  const [plans, setPlans] = useState([]);
  const [swapSelection, setSwapSelection] = useState({});
  const [completedExercises, setCompletedExercises] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      try {
        const res = await api.get("/plans");
        const payload = res?.data?.data || res?.data || [];
        const planData = Array.isArray(payload?.plans)
          ? payload.plans
          : Array.isArray(payload)
            ? payload
            : [];
        setPlans(planData);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load plans",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const openVideoModal = (exercise) => {
    if (!exercise?.videoUrl) return;
    window.open(exercise.videoUrl, "_blank", "noopener,noreferrer");
  };

  const toggleExerciseCompletion = (planId, index) => {
    const key = `${planId}-${index}`;
    setCompletedExercises((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const getDietItem = (planId, note, index) => {
    const key = `${planId}-${index}`;
    if (typeof note === "string") {
      return { label: note, alternatives: [], active: note };
    }

    const alternatives = Array.isArray(note.alternatives)
      ? note.alternatives
      : [];
    const active = swapSelection[key] || note.item || "";

    return {
      label: note.item || "",
      alternatives,
      active,
    };
  };

  const toggleAlternative = (planId, note, index) => {
    const key = `${planId}-${index}`;
    const alternatives = Array.isArray(note.alternatives)
      ? note.alternatives
      : [];
    if (!alternatives.length) {
      return;
    }

    setSwapSelection((current) => {
      const currentValue = current[key] || note.item;
      const currentIndex = alternatives.indexOf(currentValue);
      const nextIndex =
        currentIndex === -1 ? 0 : (currentIndex + 1) % alternatives.length;
      return {
        ...current,
        [key]: alternatives[nextIndex],
      };
    });
  };

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-slate-500">
        Loading your plans...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        {error}
      </div>
    );
  }

  if (!plans.length) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center rounded-3xl border border-slate-200 bg-white p-8 text-slate-600">
        No plans assigned yet
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {plans.map((plan) => (
        <article
          key={plan._id}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">
                {plan.title}
              </h3>
              <p className="mt-1 text-sm text-slate-600">{plan.description}</p>
              <p className="mt-3 text-xs text-slate-500">
                Assigned by: {plan.createdBy?.name || "Trainer"}
              </p>
            </div>
            <div className="text-right text-sm text-slate-500">
              {new Date(plan.createdAt).toLocaleDateString()}
            </div>
          </div>

          {plan.exercises?.length ? (
            <div className="mt-4 grid gap-3">
              {plan.exercises.map((ex, idx) => {
                const key = `${plan._id}-${idx}`;
                const isCompleted = completedExercises[key];
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-900">
                        <input
                          type="checkbox"
                          checked={Boolean(isCompleted)}
                          onChange={() =>
                            toggleExerciseCompletion(plan._id, idx)
                          }
                          className="h-4 w-4 rounded border-slate-300 text-slate-900"
                        />
                        <span
                          className={
                            isCompleted ? "line-through text-slate-400" : ""
                          }
                        >
                          {ex.name}
                        </span>
                      </label>
                      <div className="text-xs text-slate-500">
                        {ex.sets || "—"} x {ex.reps || "—"}
                      </div>
                    </div>
                    {ex.videoUrl ? (
                      <button
                        type="button"
                        onClick={() => openVideoModal(ex)}
                        className="mt-3 inline-flex items-center gap-2 rounded-3xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                      >
                        <span>▶</span>
                        View technique
                      </button>
                    ) : null}
                    {ex.notes ? (
                      <p className="mt-2 text-sm text-slate-600">{ex.notes}</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}

          {plan.dietNotes?.length ? (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-slate-900">
                Diet notes
              </h4>
              <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">
                {plan.dietNotes.map((note, i) => {
                  const dietItem = getDietItem(plan._id, note, i);
                  return (
                    <li key={i}>
                      {dietItem.active || dietItem.label}
                      {dietItem.alternatives?.length ? (
                        <button
                          type="button"
                          onClick={() => toggleAlternative(plan._id, note, i)}
                          className="ml-3 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700"
                        >
                          Swap alternative
                        </button>
                      ) : null}
                      {dietItem.alternatives?.length ? (
                        <div className="mt-2 text-xs text-slate-500">
                          Alternatives: {dietItem.alternatives.join(", ")}
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}

import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function MyPlans() {
  const [plans, setPlans] = useState([]);
  const [swapSelection, setSwapSelection] = useState({});
  const [videoModal, setVideoModal] = useState({
    open: false,
    url: "",
    name: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      try {
        const res = await api.get("/plans");
        const data = res?.data?.data?.plans || [];
        setPlans(Array.isArray(data) ? data : []);
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
    setVideoModal({ open: true, url: exercise.videoUrl, name: exercise.name });
  };

  const closeVideoModal = () =>
    setVideoModal({ open: false, url: "", name: "" });

  const getDietItem = (planId, note, index) => {
    const key = `${planId}-${index}`;
    if (typeof note === "string") {
      return { label: note, alternatives: [] };
    }
    return {
      label: note.item || "",
      alternatives: Array.isArray(note.alternatives) ? note.alternatives : [],
      active: swapSelection[key] || note.item,
    };
  };

  const toggleAlternative = (planId, index, alternative) => {
    const key = `${planId}-${index}`;
    setSwapSelection((current) => ({
      ...current,
      [key]: alternative,
    }));
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
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-600">
        You have no active plans. Ask your trainer to assign one.
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
              {plan.exercises.map((ex, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-slate-900">{ex.name}</div>
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
              ))}
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
                      {dietItem.label}
                      {dietItem.alternatives?.length ? (
                        <button
                          type="button"
                          onClick={() =>
                            toggleAlternative(
                              plan._id,
                              i,
                              dietItem.alternatives[0],
                            )
                          }
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

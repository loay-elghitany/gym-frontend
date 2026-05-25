import { useEffect, useState } from "react";
import api from "../../api/axios";

const formatDisplayDate = (value) => {
  const date = value ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  const locale =
    typeof navigator !== "undefined" && navigator.language.startsWith("ar")
      ? "ar-EG"
      : "en-US";

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

const SparkIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
  >
    <path d="M12 3l1.6 4.9L18.5 9l-4.9 1.1L12 15l-1.6-4.9L5.5 9l4.9-1.1L12 3Z" />
  </svg>
);

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getBaseMultiplier = (baseUnit) => {
  const normalized = String(baseUnit || "100g")
    .trim()
    .toLowerCase();

  if (normalized === "100g" || normalized === "100 g") {
    return 1 / 100;
  }

  return 1;
};

const normalizeMealForDisplay = (meal, fallbackName = "Meal") => {
  const quantity = toNumber(meal.quantity);
  const baseUnit = String(meal.baseUnit || "100g");
  const multiplier = getBaseMultiplier(baseUnit);
  const normalizedMeal = {
    mealName: meal.mealName || meal.name || meal.item || fallbackName || "Meal",
    quantity,
    baseUnit,
    quantityLabel: quantity > 0 ? `${quantity} ${baseUnit}` : "Custom portion",
    calories:
      meal.calories === null || meal.calories === undefined
        ? 0
        : toNumber(meal.calories) * multiplier,
    protein:
      meal.protein === null || meal.protein === undefined
        ? 0
        : toNumber(meal.protein) * multiplier,
    carbs:
      meal.carbs === null || meal.carbs === undefined
        ? 0
        : toNumber(meal.carbs) * multiplier,
    fats:
      meal.fats === null || meal.fats === undefined
        ? 0
        : toNumber(meal.fats) * multiplier,
    hasNutritionData:
      meal.calories !== null &&
      meal.calories !== undefined &&
      meal.protein !== null &&
      meal.protein !== undefined,
  };

  return normalizedMeal;
};

const getPlanMeals = (plan) => {
  if (Array.isArray(plan.meals) && plan.meals.length) {
    return plan.meals.map((meal) => normalizeMealForDisplay(meal));
  }

  const dietNotes = Array.isArray(plan.dietNotes) ? plan.dietNotes : [];

  return dietNotes.map((note, index) => {
    if (typeof note === "string") {
      return normalizeMealForDisplay(
        {
          mealName: note,
          quantity: 0,
          baseUnit: "100g",
          calories: null,
          protein: null,
          carbs: null,
          fats: null,
        },
        note,
      );
    }

    return normalizeMealForDisplay(
      {
        mealName: note?.item || note?.mealName || `Meal ${index + 1}`,
        quantity: note?.quantity || 0,
        baseUnit: note?.baseUnit || "100g",
        calories: note?.calories,
        protein: note?.protein,
        carbs: note?.carbs,
        fats: note?.fats,
      },
      note?.item || note?.mealName || `Meal ${index + 1}`,
    );
  });
};

const getMacroSummary = (meals) => {
  return meals.reduce(
    (totals, meal) => ({
      calories: totals.calories + meal.calories,
      protein: totals.protein + meal.protein,
      carbs: totals.carbs + meal.carbs,
      fats: totals.fats + meal.fats,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 },
  );
};

export default function MyPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTabs, setSelectedTabs] = useState({});
  const [activeModes, setActiveModes] = useState({});
  const [completedExercises, setCompletedExercises] = useState({});
  const [savingPlanId, setSavingPlanId] = useState(null);
  const [statusMessages, setStatusMessages] = useState({});
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setToast(null), 3200);

    return () => window.clearTimeout(timeoutId);
  }, [toast]);

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
        setSelectedTabs((current) => {
          const next = { ...current };
          planData.forEach((plan) => {
            if (!next[plan._id]) {
              next[plan._id] = "workout";
            }
          });
          return next;
        });
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

  const toggleExercise = (planId, index) => {
    if (!activeModes[planId]) {
      return;
    }

    const key = `${planId}-${index}`;
    setCompletedExercises((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const handleStartWorkout = (planId) => {
    setActiveModes((current) => ({
      ...current,
      [planId]: true,
    }));
    setStatusMessages((current) => ({
      ...current,
      [planId]: {
        tone: "info",
        text: "Workout mode activated. Mark each exercise as you finish it.",
      },
    }));
  };

  const handleFinishWorkout = async (planId, exercises) => {
    const totalExercises = Array.isArray(exercises) ? exercises.length : 0;
    const completedCount = exercises.reduce((count, exercise, index) => {
      const key = `${planId}-${index}`;
      return count + (completedExercises[key] ? 1 : 0);
    }, 0);

    if (totalExercises === 0 || completedCount !== totalExercises) {
      setStatusMessages((current) => ({
        ...current,
        [planId]: {
          tone: "warning",
          text: "Finish all exercises to save your session.",
        },
      }));
      return;
    }

    setSavingPlanId(planId);
    setStatusMessages((current) => ({
      ...current,
      [planId]: {
        tone: "info",
        text: "Saving your workout session...",
      },
    }));

    try {
      await api.post("/member/log-workout", {
        templateId: planId,
        completedAt: new Date().toISOString(),
      });

      setActiveModes((current) => ({
        ...current,
        [planId]: false,
      }));
      setStatusMessages((current) => ({
        ...current,
        [planId]: {
          tone: "success",
          text: "Session saved. Your trainer can now see your completion.",
        },
      }));
      setToast({
        tone: "success",
        title: "Workout saved",
        message: "Your session was logged successfully.",
      });
    } catch (err) {
      setStatusMessages((current) => ({
        ...current,
        [planId]: {
          tone: "error",
          text:
            err?.response?.data?.message ||
            err?.message ||
            "Unable to save your workout right now.",
        },
      }));
    } finally {
      setSavingPlanId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center rounded-[28px] border border-slate-200 bg-white px-6 py-12 text-slate-500 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        Loading your plans...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[28px] border border-rose-200 bg-rose-50 px-6 py-5 text-rose-700 shadow-[0_20px_60px_rgba(244,63,94,0.12)]">
        {error}
      </div>
    );
  }

  if (!plans.length) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center rounded-[28px] border border-slate-200 bg-white px-8 py-10 text-slate-600 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        No plans assigned yet
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast ? (
        <div className="fixed right-4 top-4 z-50 w-[min(92vw,360px)] rounded-3xl border border-emerald-200 bg-white/95 px-4 py-3 shadow-[0_24px_80px_rgba(15,23,42,0.18)] backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              ✓
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-950">
                {toast.title}
              </p>
              <p className="mt-1 text-sm text-slate-600">{toast.message}</p>
            </div>
          </div>
        </div>
      ) : null}

      {plans.map((plan) => {
        const exercises = Array.isArray(plan.exercises) ? plan.exercises : [];
        const planMeals = getPlanMeals(plan);
        const macroSummary = getMacroSummary(planMeals);
        const completedCount = exercises.reduce((count, exercise, index) => {
          const key = `${plan._id}-${index}`;
          return count + (completedExercises[key] ? 1 : 0);
        }, 0);
        const progress = exercises.length
          ? Math.round((completedCount / exercises.length) * 100)
          : 0;
        const isActive = Boolean(activeModes[plan._id]);
        const isSaving = savingPlanId === plan._id;
        const nextTab = selectedTabs[plan._id] || "workout";
        const status = statusMessages[plan._id];

        return (
          <article
            key={plan._id}
            className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]"
          >
            <div className="bg-linear-to-br from-slate-950 via-slate-900 to-cyan-950 px-6 py-6 text-white">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-2xl">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-cyan-200">
                    Assigned plan
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold text-white">
                    {plan.title || "Personalized fitness plan"}
                  </h3>
                  <p className="mt-2 text-sm text-slate-200">
                    {plan.description ||
                      "A focused blend of strength, mobility, and nutrition guidance."}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-100">
                    <span className="rounded-full bg-white/10 px-3 py-1">
                      Trainer: {plan.createdBy?.name || "Your trainer"}
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1">
                      {formatDisplayDate(plan.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="min-w-45 rounded-3xl border border-white/20 bg-white/10 px-4 py-4 backdrop-blur-sm">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-100">
                    Session momentum
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-white">
                    {progress}%
                  </p>
                  <p className="mt-1 text-sm text-slate-200">
                    {completedCount}/{exercises.length} exercises complete
                  </p>
                </div>
              </div>
            </div>

            <div className="border-b border-slate-100 px-6 pt-5">
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "workout", label: "🏋️‍♂️ Workout Plan" },
                  { key: "diet", label: "🍏 Diet Plan" },
                ].map((tab) => {
                  const isSelected = nextTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() =>
                        setSelectedTabs((current) => ({
                          ...current,
                          [plan._id]: tab.key,
                        }))
                      }
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        isSelected
                          ? "bg-slate-950 text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)]"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="px-6 pb-6 pt-5">
              {nextTab === "workout" ? (
                <div className="space-y-5">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">
                          {isActive
                            ? "Active workout mode"
                            : "Ready to begin your session"}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {isActive
                            ? "Tick each exercise as you finish it and watch your progress update in real time."
                            : "Launch the session to unlock interactive checklists and save your completion."}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          isActive
                            ? handleFinishWorkout(plan._id, exercises)
                            : handleStartWorkout(plan._id)
                        }
                        disabled={isSaving || !exercises.length}
                        className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
                          isSaving
                            ? "bg-slate-300 text-slate-700"
                            : isActive && progress === 100
                              ? "bg-emerald-500 text-white shadow-[0_18px_30px_rgba(16,185,129,0.28)]"
                              : "bg-slate-950 text-white shadow-[0_18px_30px_rgba(15,23,42,0.2)]"
                        } ${!isSaving && !exercises.length ? "cursor-not-allowed opacity-60" : "hover:scale-[1.01]"}`}
                      >
                        {isSaving
                          ? "Saving..."
                          : isActive && progress === 100
                            ? "✅ Finish & Save Workout"
                            : isActive
                              ? `In progress • ${completedCount}/${exercises.length} complete`
                              : "🚀 Start Today's Workout"}
                      </button>
                    </div>
                  </div>

                  {status ? (
                    <div
                      className={`rounded-[22px] px-4 py-3 text-sm ${
                        status.tone === "success"
                          ? "bg-emerald-50 text-emerald-700"
                          : status.tone === "warning"
                            ? "bg-amber-50 text-amber-700"
                            : status.tone === "error"
                              ? "bg-rose-50 text-rose-700"
                              : "bg-cyan-50 text-cyan-700"
                      }`}
                    >
                      {status.text}
                    </div>
                  ) : null}

                  {exercises.length ? (
                    <>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm text-slate-500">
                          <span>Daily progress</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="relative h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`absolute inset-0 rounded-full transition-[width,box-shadow] duration-700 ease-out ${
                              isActive
                                ? "bg-linear-to-r from-cyan-500 to-emerald-500 shadow-[0_0_24px_rgba(34,211,238,0.35)]"
                                : "bg-linear-to-r from-cyan-500 to-emerald-500"
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                          <div className="absolute inset-0 rounded-full bg-[linear-gradient(120deg,rgba(255,255,255,0.35),transparent_35%,rgba(255,255,255,0.15)_65%,transparent)] animate-pulse" />
                        </div>
                      </div>

                      <div className="grid gap-3">
                        {exercises.map((exercise, index) => {
                          const key = `${plan._id}-${index}`;
                          const isCompleted = Boolean(completedExercises[key]);
                          const note =
                            exercise.notes || exercise.instruction || "";

                          return (
                            <div
                              key={key}
                              className={`rounded-3xl border px-4 py-4 transition ${
                                isCompleted
                                  ? "border-emerald-200 bg-emerald-50/70"
                                  : "border-slate-200 bg-slate-50"
                              }`}
                            >
                              <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="max-w-2xl">
                                  <div className="flex flex-wrap items-center gap-3">
                                    <span
                                      className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold ${
                                        isCompleted
                                          ? "border-emerald-300 bg-emerald-100 text-emerald-700"
                                          : "border-slate-200 bg-white text-slate-700"
                                      }`}
                                    >
                                      {isCompleted ? "✓" : index + 1}
                                    </span>
                                    {exercise.gifUrl ? (
                                      <button
                                        type="button"
                                        aria-label={`Open animation for ${exercise.name}`}
                                        onClick={() =>
                                          window.open(
                                            exercise.gifUrl,
                                            "_blank",
                                            "noopener,noreferrer",
                                          )
                                        }
                                        className="inline-flex shrink-0 rounded-[18px] border border-slate-200 bg-white p-1 shadow-sm transition hover:border-sky-200 hover:shadow-md"
                                      >
                                        <img
                                          src={exercise.gifUrl}
                                          alt={exercise.name}
                                          className="h-14 w-14 rounded-[14px] object-cover"
                                          loading="lazy"
                                        />
                                      </button>
                                    ) : null}
                                    <div>
                                      <p className="text-base font-semibold text-slate-950">
                                        {exercise.name}
                                      </p>
                                      <div className="mt-2 flex flex-wrap gap-2">
                                        <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-900">
                                          {exercise.sets || 0} sets
                                        </span>
                                        <span className="rounded-full bg-fuchsia-100 px-3 py-1 text-xs font-semibold text-fuchsia-900">
                                          {exercise.reps || "—"} reps
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {note ? (
                                    <div className="mt-3 rounded-[20px] bg-slate-100 px-4 py-3 text-sm text-slate-700">
                                      {note}
                                    </div>
                                  ) : null}
                                </div>

                                <label className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                                  <input
                                    type="checkbox"
                                    checked={isCompleted}
                                    disabled={!isActive}
                                    onChange={() =>
                                      toggleExercise(plan._id, index)
                                    }
                                    className="h-4 w-4 rounded border-slate-300 text-slate-950"
                                  />
                                  Done
                                </label>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm text-slate-600">
                      No exercises are currently assigned to this plan.
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                      {
                        label: "Calories",
                        value: `${Math.round(macroSummary.calories)} kcal`,
                      },
                      {
                        label: "Protein",
                        value: `${Math.round(macroSummary.protein * 10) / 10} g`,
                      },
                      {
                        label: "Carbs",
                        value: `${Math.round(macroSummary.carbs * 10) / 10} g`,
                      },
                      {
                        label: "Fats",
                        value: `${Math.round(macroSummary.fats * 10) / 10} g`,
                      },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
                      >
                        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                          {stat.label}
                        </p>
                        <p className="mt-3 text-xl font-semibold text-slate-950">
                          {stat.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {planMeals.length ? (
                    <div className="grid gap-3">
                      {planMeals.map((meal, index) => (
                        <div
                          key={`${plan._id}-${index}`}
                          className="rounded-[26px] border border-slate-200 bg-slate-50 px-4 py-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-slate-950">
                                {meal.mealName}
                              </p>
                              <p className="mt-1 text-sm text-slate-600">
                                {meal.quantityLabel}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-900">
                                {Math.round(meal.calories)} kcal
                              </span>
                              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
                                {Math.round(meal.protein * 10) / 10} g protein
                              </span>
                            </div>
                          </div>

                          <div className="mt-3 grid gap-2 sm:grid-cols-3">
                            <div className="rounded-2xl bg-white px-3 py-3 text-sm text-slate-700">
                              <span className="block text-[11px] uppercase tracking-[0.18em] text-slate-500">
                                Carbs
                              </span>
                              <span className="mt-2 block font-semibold text-slate-950">
                                {Math.round(meal.carbs * 10) / 10} g
                              </span>
                            </div>
                            <div className="rounded-2xl bg-white px-3 py-3 text-sm text-slate-700">
                              <span className="block text-[11px] uppercase tracking-[0.18em] text-slate-500">
                                Fats
                              </span>
                              <span className="mt-2 block font-semibold text-slate-950">
                                {Math.round(meal.fats * 10) / 10} g
                              </span>
                            </div>
                            <div className="rounded-2xl bg-white px-3 py-3 text-sm text-slate-700">
                              <span className="block text-[11px] uppercase tracking-[0.18em] text-slate-500">
                                Base unit
                              </span>
                              <span className="mt-2 block font-semibold text-slate-950">
                                {meal.baseUnit}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm text-slate-600">
                      No nutrition data has been added to this plan yet.
                    </div>
                  )}

                  <div className="rounded-3xl bg-slate-950 px-4 py-4 text-white">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <SparkIcon />
                      Premium nutrition flow
                    </div>
                    <p className="mt-2 text-sm text-slate-200">
                      Smart macro summaries update automatically for each meal
                      in the plan.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

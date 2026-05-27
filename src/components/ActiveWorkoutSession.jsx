import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";

export default function ActiveWorkoutSession() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [restSeconds, setRestSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [weightLogs, setWeightLogs] = useState({});
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchPlan = async () => {
      setLoading(true);
      try {
        const res = await api.get("/plans");
        const plans = res?.data?.data?.plans || [];
        setPlan(Array.isArray(plans) ? plans[0] : null);
      } catch (err) {
        setMessage(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load session",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, []);

  useEffect(() => {
    if (!timerRunning || restSeconds <= 0) return undefined;
    const interval = setInterval(() => {
      setRestSeconds((current) => {
        if (current <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [restSeconds, timerRunning]);

  const activeExercise = useMemo(() => {
    const days =
      Array.isArray(plan?.days) && plan.days.length
        ? plan.days
        : [
            {
              dayName: "Day 1",
              exercises: Array.isArray(plan?.exercises) ? plan.exercises : [],
            },
          ];

    const activeDay = days[activeDayIndex] || days[0];
    const ex = Array.isArray(activeDay.exercises) ? activeDay.exercises : [];
    return ex[activeIndex] || ex[0] || null;
  }, [plan, activeIndex]);

  const activeExercises = useMemo(() => {
    const days =
      Array.isArray(plan?.days) && plan.days.length
        ? plan.days
        : [
            {
              dayName: "Day 1",
              exercises: Array.isArray(plan?.exercises) ? plan.exercises : [],
            },
          ];
    const activeDay = days[activeDayIndex] || days[0];
    return Array.isArray(activeDay.exercises) ? activeDay.exercises : [];
  }, [plan, activeDayIndex]);

  const handleStartRest = () => {
    setRestSeconds(45);
    setTimerRunning(true);
  };

  const handleLogWeight = (value) => {
    setWeightLogs((current) => ({
      ...current,
      [`${activeDayIndex}-${activeIndex}`]: value,
    }));
  };

  const nextExercise = () => {
    const days =
      Array.isArray(plan?.days) && plan.days.length
        ? plan.days
        : [
            {
              dayName: "Day 1",
              exercises: Array.isArray(plan?.exercises) ? plan.exercises : [],
            },
          ];
    const activeDay = days[activeDayIndex] || days[0];
    const ex = Array.isArray(activeDay.exercises) ? activeDay.exercises : [];
    setActiveIndex((current) => Math.min(current + 1, ex.length - 1));
    setRestSeconds(0);
    setTimerRunning(false);
  };

  if (loading) {
    return (
      <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Loading active workout...</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">
          No active workout plan is currently assigned.
        </p>
      </div>
    );
  }

  return (
    <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-sky-600">
            Active Workout Session
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {plan.title}
          </h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            {plan.description ||
              "Follow your coach’s latest training sequence to stay on pace."}
          </p>
        </div>
        <div className="flex gap-2">
          {(Array.isArray(plan.days) && plan.days.length
            ? plan.days
            : [
                {
                  dayName: "Day 1",
                  exercises: Array.isArray(plan.exercises)
                    ? plan.exercises
                    : [],
                },
              ]
          ).map((d, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setActiveDayIndex(idx);
                setActiveIndex(0);
              }}
              className={`rounded-full px-3 py-1 text-sm font-semibold ${
                idx === activeDayIndex
                  ? "bg-slate-950 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {d.dayName || `Day ${idx + 1}`}
            </button>
          ))}
        </div>
        <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {plan.dietNotes?.length
            ? `${plan.dietNotes.length} diet tips included`
            : "No nutrition notes yet"}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_0.85fr]">
        <div className="space-y-6">
          <div className="rounded-4xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Current exercise</p>
            <h3 className="mt-3 text-2xl font-semibold text-slate-950">
              {activeExercise?.name || "Rest"}
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              {activeExercise?.notes ||
                "Perfect your form and keep the tempo smooth."}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                  Reps / Sets
                </p>
                <p className="mt-3 text-lg font-semibold text-slate-950">
                  {activeExercise?.sets || "-"} sets •{" "}
                  {activeExercise?.reps || "-"}
                </p>
              </div>
              <div className="rounded-3xl bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                  Weight
                </p>
                <input
                  type="number"
                  step="0.5"
                  value={weightLogs[`${activeDayIndex}-${activeIndex}`] || ""}
                  onChange={(e) => handleLogWeight(e.target.value)}
                  placeholder="kg"
                  className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-sky-500"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Actual weight lifted (kg)
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-4xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-950">Rest timer</p>
              <span className="text-sm text-slate-500">
                Set {activeIndex + 1} of {activeExercises.length}
              </span>
            </div>
            <div className="mt-5 rounded-3xl bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Next break</p>
                  <p className="mt-3 text-4xl font-semibold text-slate-950">
                    {restSeconds}s
                  </p>
                </div>
                {/* Progress Circle */}
                <div className="relative h-20 w-20">
                  <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-200"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                    <path
                      className="text-sky-600 transition-all duration-300"
                      strokeDasharray={`${(restSeconds / 45) * 100}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                  </svg>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={handleStartRest}
                  disabled={timerRunning}
                  className="flex-1 inline-flex items-center justify-center rounded-3xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {timerRunning ? "Running..." : "Start Rest"}
                </button>
                {timerRunning && (
                  <button
                    type="button"
                    onClick={() => {
                      setTimerRunning(false);
                      setRestSeconds(0);
                    }}
                    className="rounded-3xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Skip
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-600">
            Plan details
          </p>
          <div className="mt-5 space-y-4">
            {activeExercises.map((exercise, idx) => (
              <div
                key={exercise.name || idx}
                className={`rounded-3xl p-4 ${idx === activeIndex ? "bg-slate-50" : "bg-slate-100"}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="font-semibold text-slate-950">
                    {exercise.name}
                  </p>
                  <span className="text-xs text-slate-500">
                    {exercise.sets || "-"}x{exercise.reps || "-"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {exercise.notes || "Keep the tempo controlled."}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-sky-600"
                >
                  Select
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={nextExercise}
            disabled={activeIndex >= activeExercises.length - 1}
            className="mt-5 w-full rounded-3xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 hover:bg-slate-800"
          >
            Next Exercise
          </button>
        </div>
      </div>

      {message ? (
        <p className="mt-4 text-sm text-slate-700">{message}</p>
      ) : null}
    </section>
  );
}

import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";

const getSafeText = (value) => {
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (!value || typeof value !== "object") {
    return "";
  }

  if (typeof value.text === "string") {
    return value.text.trim();
  }
  if (typeof value.note === "string") {
    return value.note.trim();
  }
  if (typeof value.mealName === "string") {
    return value.mealName.trim();
  }
  if (typeof value.foodName === "string") {
    return value.foodName.trim();
  }
  if (typeof value.name === "string") {
    return value.name.trim();
  }
  if (typeof value.item === "string") {
    return value.item.trim();
  }
  return getSafeText(value.item);
};

const getDietNotesText = (dietNotes) => {
  if (Array.isArray(dietNotes)) {
    return dietNotes.map(getSafeText).filter(Boolean).join("; ");
  }
  return getSafeText(dietNotes);
};

export default function ActiveWorkoutSession() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [restSeconds, setRestSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [loggedWeights, setLoggedWeights] = useState({});
  const [message, setMessage] = useState(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionError, setCompletionError] = useState(null);

  // Fetch plan on mount
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

  // Rest timer interval
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

  // Get active exercise using memoization
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
    return ex[currentExerciseIndex] || ex[0] || null;
  }, [plan, currentExerciseIndex, activeDayIndex]);

  // Get all exercises for active day
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

  const dietNotesText = getDietNotesText(plan?.dietNotes);
  const activeExerciseNotes = getSafeText(
    activeExercise?.notes || activeExercise?.instruction,
  );

  // Start rest timer
  const handleStartRest = () => {
    const recommendedRest = activeExercise?.restTime || 45;
    setRestSeconds(recommendedRest);
    setTimerRunning(true);
  };

  // Log weight for current exercise
  const handleLogWeight = (value) => {
    setLoggedWeights((current) => ({
      ...current,
      [`${activeDayIndex}-${currentExerciseIndex}`]: value,
    }));
  };

  // Move to previous exercise
  const handlePreviousExercise = () => {
    setCurrentExerciseIndex((current) => Math.max(current - 1, 0));
    setRestSeconds(0);
    setTimerRunning(false);
  };

  // Move to next exercise or complete workout
  const handleNextExercise = async () => {
    // If at last exercise, complete the workout
    if (currentExerciseIndex >= activeExercises.length - 1) {
      await handleCompleteWorkout();
      return;
    }

    // Move to next exercise
    setCurrentExerciseIndex((current) =>
      Math.min(current + 1, activeExercises.length - 1),
    );
    setRestSeconds(0);
    setTimerRunning(false);
  };

  // Complete workout and log it
  const handleCompleteWorkout = async () => {
    try {
      setIsCompleting(true);
      setCompletionError(null);

      // Prepare workout log data
      const workoutData = {
        planId: plan._id,
        day: activeDayIndex + 1,
        exercises: activeExercises.map((exercise, idx) => ({
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          weight: loggedWeights[`${activeDayIndex}-${idx}`] || null,
          notes: getSafeText(exercise.notes || exercise.instruction),
        })),
        completedAt: new Date().toISOString(),
      };

      // Call log-workout endpoint
      const response = await api.post("/workouts/log-workout", workoutData);

      if (response.data?.success) {
        setMessage("Workout completed successfully! Great job! 🎉");
        // Reset state after successful completion
        setTimeout(() => {
          setCurrentExerciseIndex(0);
          setLoggedWeights({});
          setPlan(null);
        }, 2000);
      } else {
        setCompletionError(
          response.data?.message || "Failed to log workout. Please try again.",
        );
      }
    } catch (err) {
      console.error("Complete workout error:", err);
      setCompletionError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to complete workout. Please try again.",
      );
    } finally {
      setIsCompleting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-center text-sm text-slate-500">
          Loading your workout...
        </p>
      </div>
    );
  }

  // No plan state
  if (!plan) {
    return (
      <div className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-center text-sm text-slate-600">
          No active workout plan assigned. Contact your trainer to get started!
        </p>
      </div>
    );
  }

  // Calculate progress percentage
  const progressPercentage =
    activeExercises.length > 0
      ? ((currentExerciseIndex + 1) / activeExercises.length) * 100
      : 0;

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
                setCurrentExerciseIndex(0);
                setRestSeconds(0);
                setTimerRunning(false);
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
      </div>

      {/* Progress bar with exercise counter */}
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-950">Progress</span>
          <span className="text-sm font-semibold text-sky-600">
            Exercise {currentExerciseIndex + 1} of {activeExercises.length}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full bg-linear-to-r from-sky-500 to-sky-600 transition-all duration-300"
            style={{
              width: `${activeExercises.length > 0 ? ((currentExerciseIndex + 1) / activeExercises.length) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Main content: Current Exercise Carousel */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Exercise Display Card */}
        <div className="lg:col-span-2">
          <div className="rounded-3xl border border-slate-200 bg-linear-to-br from-slate-50 to-white p-8 shadow-md transition-all duration-300">
            {/* Exercise Image/GIF */}
            {activeExercise?.gifUrl && (
              <div className="mb-6 flex justify-center rounded-2xl bg-slate-100 p-4">
                <img
                  src={activeExercise.gifUrl}
                  alt={activeExercise.name}
                  className="h-48 w-full object-cover rounded-xl"
                />
              </div>
            )}

            {/* Exercise Name */}
            <h3 className="text-3xl font-bold text-slate-950">
              {activeExercise?.name || "Exercise"}
            </h3>

            {/* Trainer Notes */}
            {activeExerciseNotes && (
              <p className="mt-4 text-sm leading-7 text-slate-600">
                💡 {activeExerciseNotes}
              </p>
            )}

            {/* Sets and Reps */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Sets
                </p>
                <p className="mt-3 text-2xl font-bold text-slate-950">
                  {activeExercise?.sets || "-"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Reps per Set
                </p>
                <p className="mt-3 text-2xl font-bold text-slate-950">
                  {activeExercise?.reps || "-"}
                </p>
              </div>
            </div>

            {/* Weight Logging Input */}
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <label className="block text-sm font-semibold text-slate-950">
                Actual Weight Lifted
              </label>
              <div className="mt-3 flex items-center gap-3">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={
                    loggedWeights[
                      `${activeDayIndex}-${currentExerciseIndex}`
                    ] || ""
                  }
                  onChange={(e) => handleLogWeight(e.target.value)}
                  placeholder="0.0"
                  className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-lg font-semibold text-slate-950 outline-none transition focus:border-sky-500 focus:bg-white focus:shadow-md"
                />
                <span className="text-sm font-semibold text-slate-500">kg</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Enter the weight you're planning to lift or have lifted
              </p>
            </div>

            {/* Rest Timer Section */}
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-950">Rest Timer</p>

              {/* Timer Display */}
              <div className="mt-6 flex items-center gap-8">
                <div className="flex-1">
                  <p className="text-sm text-slate-500">Time Remaining</p>
                  <p className="mt-3 text-5xl font-bold text-slate-950">
                    {restSeconds}
                    <span className="text-2xl text-slate-500">s</span>
                  </p>
                </div>

                {/* Circular Progress */}
                <div className="relative h-24 w-24 shrink-0">
                  <svg className="h-24 w-24 -rotate-90" viewBox="0 0 36 36">
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="text-slate-200"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeDasharray={`${(restSeconds / (activeExercise?.restTime || 45)) * 100}, 100`}
                      className="text-sky-500 transition-all duration-300"
                    />
                  </svg>
                </div>
              </div>

              {/* Timer Controls */}
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={handleStartRest}
                  disabled={timerRunning}
                  className="flex-1 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {timerRunning ? "Timer Running..." : "Start Rest"}
                </button>
                {timerRunning && (
                  <button
                    type="button"
                    onClick={() => {
                      setTimerRunning(false);
                      setRestSeconds(0);
                    }}
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Skip
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: All Exercises List + Navigation */}
        <div className="space-y-6">
          {/* Exercises List */}
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold uppercase tracking-widest text-slate-600">
              Workout Plan
            </p>
            <div className="mt-4 max-h-96 space-y-2 overflow-y-auto">
              {activeExercises.map((exercise, idx) => (
                <button
                  key={exercise.name || idx}
                  type="button"
                  onClick={() => {
                    setCurrentExerciseIndex(idx);
                    setRestSeconds(0);
                    setTimerRunning(false);
                  }}
                  className={`w-full rounded-2xl p-3 text-left text-sm font-semibold transition ${
                    idx === currentExerciseIndex
                      ? "bg-sky-600 text-white shadow-lg"
                      : "bg-white text-slate-950 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{exercise.name}</span>
                    <span className="text-xs opacity-75">
                      {exercise.sets}×{exercise.reps}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="space-y-3">
            {/* Previous Button */}
            <button
              type="button"
              onClick={handlePreviousExercise}
              disabled={currentExerciseIndex === 0}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
            >
              ← Previous
            </button>

            {/* Next / Complete Button */}
            <button
              type="button"
              onClick={handleNextExercise}
              disabled={isCompleting}
              className="w-full rounded-2xl bg-linear-to-r from-sky-600 to-sky-700 px-4 py-3 text-sm font-semibold text-white transition hover:from-sky-700 hover:to-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCompleting
                ? "Completing..."
                : currentExerciseIndex >= activeExercises.length - 1
                  ? "✓ Complete Workout"
                  : "Next Exercise →"}
            </button>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {message && (
        <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-semibold text-green-800">{message}</p>
        </div>
      )}

      {completionError && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-800">
            {completionError}
          </p>
        </div>
      )}

      {dietNotesText ? (
        <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">
            🥗 Nutrition Tips
          </p>
          <p className="mt-2 text-sm text-blue-900">{dietNotesText}</p>
        </div>
      ) : null}
    </section>
  );
}

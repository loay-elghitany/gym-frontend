import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import ExerciseAutocomplete from "./ExerciseAutocomplete";
import FoodAutocomplete from "./FoodAutocomplete";
import useBodyScrollLock from "../hooks/useBodyScrollLock";

const emptyExercise = {
  name: "",
  sets: "",
  reps: "",
  notes: "",
  gifUrl: "",
};

const emptyMeal = {
  mealName: "",
  quantity: "",
  calories: null,
  protein: null,
  carbs: null,
  fats: null,
  baseUnit: "100g",
};

export default function SmartTemplatesBuilder() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDays, setTemplateDays] = useState([
    { dayName: "Day 1", exercises: [{ ...emptyExercise }] },
  ]);
  const [expandedDay, setExpandedDay] = useState(0);
  const [newMeals, setNewMeals] = useState([emptyMeal]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageTone, setMessageTone] = useState("neutral");
  const [assignments] = useState([]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await api.get("/trainer/templates");
      const data = res?.data?.data || [];
      setTemplates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Unable to load trainer templates", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTemplates();
  }, []);

  const openModal = () => setModalOpen(true);
  const closeModal = () => {
    setModalOpen(false);
    setTemplateName("");
    setTemplateDays([{ dayName: "Day 1", exercises: [{ ...emptyExercise }] }]);
    setExpandedDay(0);
    setNewMeals([emptyMeal]);
    setSaving(false);
    setMessage(null);
    setMessageTone("neutral");
  };

  useBodyScrollLock(modalOpen);

  // Day-based functions
  const updateDayName = (dayIndex, value) => {
    setTemplateDays((current) =>
      current.map((day, idx) =>
        idx === dayIndex ? { ...day, dayName: value } : day,
      ),
    );
  };

  const updateExerciseInDay = (dayIndex, exerciseIndex, field, value) => {
    setTemplateDays((current) =>
      current.map((day, idx) => {
        if (idx !== dayIndex) {
          return day;
        }

        return {
          ...day,
          exercises: day.exercises.map((exercise, exIdx) =>
            exIdx === exerciseIndex
              ? { ...exercise, [field]: value }
              : exercise,
          ),
        };
      }),
    );
  };

  const addExerciseToDay = (dayIndex) => {
    setTemplateDays((current) =>
      current.map((day, idx) =>
        idx === dayIndex
          ? { ...day, exercises: [...day.exercises, { ...emptyExercise }] }
          : day,
      ),
    );
  };

  const removeExerciseFromDay = (dayIndex, exerciseIndex) => {
    setTemplateDays((current) =>
      current.map((day, idx) => {
        if (idx !== dayIndex) {
          return day;
        }

        return {
          ...day,
          exercises: day.exercises.filter(
            (_, exIdx) => exIdx !== exerciseIndex,
          ),
        };
      }),
    );
  };

  const addTrainingDay = () => {
    setTemplateDays((current) => {
      const next = [
        ...current,
        {
          dayName: `Day ${current.length + 1}`,
          exercises: [{ ...emptyExercise }],
        },
      ];
      setExpandedDay(next.length - 1);
      return next;
    });
  };

  const removeTrainingDay = (dayIndex) => {
    setTemplateDays((current) =>
      current
        .filter((_, idx) => idx !== dayIndex)
        .map((day, idx) => ({
          ...day,
          dayName: day.dayName || `Day ${idx + 1}`,
        })),
    );
    setExpandedDay((current) => Math.max(0, current - 1));
  };

  // Meal functions
  const updateMeal = (index, field, value) => {
    setNewMeals((prev) =>
      prev.map((meal, idx) => {
        if (idx !== index) {
          return meal;
        }

        const nextMeal = { ...meal, [field]: value };

        if (field === "mealName") {
          nextMeal.calories = null;
          nextMeal.protein = null;
          nextMeal.carbs = null;
          nextMeal.fats = null;
          nextMeal.baseUnit = "100g";
        }

        return nextMeal;
      }),
    );
  };

  const selectFood = (index, selectedFood) => {
    setNewMeals((prev) =>
      prev.map((meal, idx) => {
        if (idx !== index) {
          return meal;
        }

        return {
          ...meal,
          mealName:
            selectedFood?.nameAr?.trim() ||
            selectedFood?.nameEn?.trim() ||
            meal.mealName,
          calories: Number(selectedFood?.calories) || 0,
          protein: Number(selectedFood?.protein) || 0,
          carbs: Number(selectedFood?.carbs) || 0,
          fats: Number(selectedFood?.fats) || 0,
          baseUnit: selectedFood?.baseUnit || "100g",
        };
      }),
    );
  };

  const addMeal = () => {
    setNewMeals((prev) => [...prev, { ...emptyMeal }]);
  };

  const removeMeal = (index) => {
    setNewMeals((prev) => prev.filter((_, idx) => idx !== index));
  };

  const toNumber = (value) => {
    if (value === null || value === undefined || value === "") {
      return 0;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const getCalculatedMacros = (meal) => {
    const quantity = toNumber(meal.quantity);
    const baseUnit = String(meal.baseUnit || "100g")
      .trim()
      .toLowerCase();
    const multiplier =
      baseUnit === "100g" || baseUnit === "100 g" ? quantity / 100 : quantity;

    return {
      calories:
        meal.calories === null ? null : toNumber(meal.calories) * multiplier,
      protein:
        meal.protein === null ? null : toNumber(meal.protein) * multiplier,
      carbs: meal.carbs === null ? null : toNumber(meal.carbs) * multiplier,
      fats: meal.fats === null ? null : toNumber(meal.fats) * multiplier,
    };
  };

  const planTotals = useMemo(() => {
    return newMeals.reduce(
      (totals, meal) => {
        const macros = getCalculatedMacros(meal);

        return {
          calories: totals.calories + (macros.calories || 0),
          protein: totals.protein + (macros.protein || 0),
          carbs: totals.carbs + (macros.carbs || 0),
          fats: totals.fats + (macros.fats || 0),
        };
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0 },
    );
  }, [newMeals]);

  const handleCreateTemplate = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setMessageTone("neutral");

    if (!templateName.trim()) {
      setMessage("Template name is required");
      setMessageTone("error");
      setSaving(false);
      return;
    }

    const cleanedDays = templateDays
      .map((day, dayIndex) => ({
        dayName: day.dayName.trim() || `Day ${dayIndex + 1}`,
        exercises: day.exercises
          .filter((exercise) => exercise.name.trim())
          .map((exercise) => ({
            name: exercise.name.trim(),
            sets: exercise.sets ? Number(exercise.sets) : 0,
            reps: exercise.reps.trim(),
            notes: exercise.notes.trim(),
            gifUrl: exercise.gifUrl?.trim() || "",
          })),
      }))
      .filter((day) => day.exercises.length);

    const payload = {
      templateName: templateName.trim(),
      days: cleanedDays.length
        ? cleanedDays
        : [
            {
              dayName: "Day 1",
              exercises: [
                { name: "", sets: 0, reps: "", notes: "", gifUrl: "" },
              ],
            },
          ],
      meals: newMeals
        .filter((meal) => meal.mealName.trim())
        .map((meal) => ({
          mealName: meal.mealName.trim(),
          description: "",
          quantity: Number(meal.quantity) || 0,
          calories: meal.calories === null ? null : Number(meal.calories) || 0,
          protein: meal.protein === null ? null : Number(meal.protein) || 0,
          carbs: meal.carbs === null ? null : Number(meal.carbs) || 0,
          fats: meal.fats === null ? null : Number(meal.fats) || 0,
          baseUnit: meal.baseUnit || "100g",
        })),
    };

    try {
      await api.post("/trainer/templates", payload);
      setMessage("Template saved successfully.");
      setMessageTone("success");
      closeModal();
      await loadTemplates();
    } catch (error) {
      console.error("Unable to create trainer template", error);
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to save template",
      );
      setMessageTone("error");
      setSaving(false);
    }
  };

  return (
    <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-sky-600">
            Smart Templates
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Builder & assignment hub
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Create training templates, assign them instantly, and keep members
            engaged with a single modern workspace.
          </p>
        </div>

        <button
          onClick={openModal}
          className="inline-flex items-center justify-center rounded-3xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          type="button"
        >
          Create new template
        </button>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4 rounded-4xl border border-slate-200 bg-slate-50 p-6">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-950">
              Template library
            </p>
            <div className="mt-5 space-y-3">
              {loading ? (
                <div className="text-sm text-slate-500">
                  Loading templates...
                </div>
              ) : templates.length ? (
                templates.map((template) => (
                  <div
                    key={template._id}
                    className="flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {template.templateName}
                      </p>
                      <p className="text-sm text-slate-500">
                        {template.exercises?.length || 0} exercises •{" "}
                        {template.meals?.length || 0} meals
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold text-slate-900">
                      {template.createdAt
                        ? new Date(template.createdAt).toLocaleDateString()
                        : "Saved"}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500">
                  No saved templates yet.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-950">
              Drag & assign
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Drag templates onto members or use quick assign actions to update
              your roster.
            </p>
            <div className="mt-5 space-y-3">
              <button
                className="w-full rounded-3xl bg-white px-4 py-3 text-left text-sm font-medium text-slate-900 shadow-sm transition hover:bg-slate-100"
                type="button"
              >
                Quick assign actions are available once members are added.
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-600">
            Live assignments
          </p>
          <div className="mt-5 space-y-4">
            {assignments.length ? (
              assignments.map((assignment) => (
                <div
                  key={assignment.member}
                  className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <p className="font-semibold text-slate-950">
                    {assignment.member}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {assignment.template}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                    Next session: {assignment.nextSession}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                No active assignments yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-4xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-950">
                  Create new template
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Add the template name, exercises, and diet notes to save it
                  for trainers.
                </p>
              </div>
              <button
                onClick={closeModal}
                type="button"
                className="rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="mt-6 space-y-6">
              {message ? (
                <div
                  className={`rounded-3xl border px-4 py-3 text-sm ${
                    messageTone === "error"
                      ? "border-rose-200 bg-rose-50 text-rose-700"
                      : messageTone === "success"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-50 text-slate-700"
                  }`}
                >
                  {message}
                </div>
              ) : null}
              <div>
                <label className="block text-sm font-medium text-slate-900">
                  Template name
                </label>
                <input
                  value={templateName}
                  onChange={(event) => setTemplateName(event.target.value)}
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                  placeholder="Example: Lean Muscle Plan"
                  required
                />
              </div>

              <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      Training Days
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Organize exercises by training day to create a structured
                      template.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addTrainingDay}
                    className="rounded-full border border-slate-200 bg-slate-950 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
                  >
                    Add training day
                  </button>
                </div>
                <div className="space-y-4">
                  {templateDays.map((day, dayIndex) => {
                    const isOpen = expandedDay === dayIndex;
                    const exerciseCount = Array.isArray(day.exercises)
                      ? day.exercises.filter((e) => e.name.trim()).length
                      : 0;
                    return (
                      <div
                        key={dayIndex}
                        className={`overflow-hidden rounded-4xl border-2 transition ${
                          isOpen
                            ? "border-slate-950 bg-white shadow-lg"
                            : "border-slate-200 bg-white shadow-sm hover:shadow-md"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedDay(dayIndex)}
                          className={`flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition ${
                            isOpen
                              ? "bg-slate-950/10"
                              : "bg-linear-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-150"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-base font-semibold text-slate-950">
                                📅 {day.dayName || `Day ${dayIndex + 1}`}
                              </p>
                              <span className="rounded-lg bg-cyan-100 px-2 py-1 text-xs font-semibold text-cyan-700">
                                {exerciseCount} exercise
                                {exerciseCount !== 1 ? "s" : ""}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              {isOpen
                                ? "Click to collapse"
                                : "Click to expand and edit"}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                              isOpen
                                ? "bg-slate-950 text-white"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {isOpen ? "▼" : "▶"}{" "}
                            {isOpen ? "Collapse" : "Expand"}
                          </span>
                        </button>

                        {isOpen ? (
                          <div className="space-y-4 border-t-2 border-slate-950 px-5 py-5 bg-slate-50">
                            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                              <input
                                value={day.dayName}
                                onChange={(e) =>
                                  updateDayName(dayIndex, e.target.value)
                                }
                                className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                                placeholder="Day name (e.g., Chest Day)"
                              />
                              <button
                                type="button"
                                onClick={() => removeTrainingDay(dayIndex)}
                                disabled={templateDays.length <= 1}
                                className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                Remove day
                              </button>
                            </div>

                            <div className="space-y-3">
                              {day.exercises.map((exercise, exerciseIndex) => (
                                <div
                                  key={`${dayIndex}-${exerciseIndex}`}
                                  className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm xl:flex-row xl:items-start"
                                >
                                  <div className="flex-1 min-w-0">
                                    <ExerciseAutocomplete
                                      value={exercise.name}
                                      onValueChange={(nextValue) =>
                                        updateExerciseInDay(
                                          dayIndex,
                                          exerciseIndex,
                                          "name",
                                          nextValue,
                                        )
                                      }
                                      onSelect={(selectedExercise) => {
                                        updateExerciseInDay(
                                          dayIndex,
                                          exerciseIndex,
                                          "name",
                                          selectedExercise?.nameAr?.trim() ||
                                            selectedExercise?.nameEn?.trim() ||
                                            exercise.name,
                                        );
                                        updateExerciseInDay(
                                          dayIndex,
                                          exerciseIndex,
                                          "gifUrl",
                                          selectedExercise?.gifUrl?.trim() ||
                                            "",
                                        );
                                      }}
                                      placeholder="Search exercise or type custom"
                                    />
                                  </div>
                                  <input
                                    placeholder="Sets"
                                    value={exercise.sets}
                                    onChange={(e) =>
                                      updateExerciseInDay(
                                        dayIndex,
                                        exerciseIndex,
                                        "sets",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none xl:w-24"
                                    type="number"
                                    min="0"
                                  />
                                  <input
                                    placeholder="Reps"
                                    value={exercise.reps}
                                    onChange={(e) =>
                                      updateExerciseInDay(
                                        dayIndex,
                                        exerciseIndex,
                                        "reps",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none xl:w-24"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeExerciseFromDay(
                                        dayIndex,
                                        exerciseIndex,
                                      )
                                    }
                                    className="w-full rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 xl:w-auto"
                                  >
                                    Remove
                                  </button>
                                </div>
                              ))}
                            </div>

                            <button
                              type="button"
                              onClick={() => addExerciseToDay(dayIndex)}
                              className="w-full rounded-3xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 border border-slate-200 transition hover:bg-slate-50"
                            >
                              + Add exercise
                            </button>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      Smart nutrition builder
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Search a food, add quantity, and preview its macros in
                      real time.
                    </p>
                  </div>
                  <button
                    onClick={addMeal}
                    type="button"
                    className="rounded-3xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Add meal
                  </button>
                </div>

                <div className="grid gap-3">
                  {newMeals.map((meal, index) => {
                    const calculated = getCalculatedMacros(meal);
                    const hasMacroData =
                      meal.calories !== null ||
                      meal.protein !== null ||
                      meal.carbs !== null ||
                      meal.fats !== null;

                    return (
                      <div
                        key={index}
                        className="rounded-3xl bg-white p-4 shadow-sm"
                      >
                        <div className="grid gap-3 xl:grid-cols-[1.4fr_0.7fr_auto] xl:items-start">
                          <div className="w-full">
                            <FoodAutocomplete
                              value={meal.mealName}
                              onValueChange={(nextValue) =>
                                updateMeal(index, "mealName", nextValue)
                              }
                              onSelect={(selectedFood) =>
                                selectFood(index, selectedFood)
                              }
                              placeholder="Search food or type custom"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                              Quantity
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={meal.quantity}
                              onChange={(event) =>
                                updateMeal(
                                  index,
                                  "quantity",
                                  event.target.value,
                                )
                              }
                              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                              placeholder="200"
                            />
                          </div>

                          <button
                            onClick={() => removeMeal(index)}
                            type="button"
                            className="rounded-3xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-100"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                              Calories
                            </p>
                            <p className="mt-2 text-sm font-semibold text-slate-900">
                              {hasMacroData
                                ? `${Math.round(calculated.calories || 0)} kcal`
                                : "N/A"}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                              Protein
                            </p>
                            <p className="mt-2 text-sm font-semibold text-slate-900">
                              {hasMacroData
                                ? `${Math.round((calculated.protein || 0) * 10) / 10} g`
                                : "N/A"}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                              Carbs
                            </p>
                            <p className="mt-2 text-sm font-semibold text-slate-900">
                              {hasMacroData
                                ? `${Math.round((calculated.carbs || 0) * 10) / 10} g`
                                : "N/A"}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                              Fats
                            </p>
                            <p className="mt-2 text-sm font-semibold text-slate-900">
                              {hasMacroData
                                ? `${Math.round((calculated.fats || 0) * 10) / 10} g`
                                : "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-3xl bg-slate-950 px-4 py-4 text-white">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold">Total Plan Macros</p>
                      <p className="mt-1 text-sm text-slate-200">
                        Live totals for the template before you save.
                      </p>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-4">
                      <div className="rounded-2xl bg-white/10 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-100">
                          Calories
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          {Math.round(planTotals.calories)} kcal
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white/10 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-100">
                          Protein
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          {Math.round(planTotals.protein * 10) / 10} g
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white/10 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-100">
                          Carbs
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          {Math.round(planTotals.carbs * 10) / 10} g
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white/10 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-100">
                          Fats
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          {Math.round(planTotals.fats * 10) / 10} g
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  onClick={closeModal}
                  type="button"
                  className="rounded-3xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-3xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}

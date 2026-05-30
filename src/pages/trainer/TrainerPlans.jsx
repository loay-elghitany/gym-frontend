import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../../api/axios";
import ExerciseAutocomplete from "../../components/ExerciseAutocomplete";
import FoodAutocomplete from "../../components/FoodAutocomplete";
import useBodyScrollLock from "../../hooks/useBodyScrollLock";

const emptyExercise = {
  name: "",
  sets: "",
  reps: "",
  notes: "",
  gifUrl: "",
};

const emptyFoodItem = {
  foodName: "",
  quantity: "",
  calories: null,
  protein: null,
  carbs: null,
  fats: null,
  baseUnit: "100g",
};

const emptyMeal = {
  mealName: "",
  foods: [{ ...emptyFoodItem }],
};

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getCalculatedFoodItem = (food) => {
  const quantity = toNumber(food.quantity);
  const baseUnit = String(food.baseUnit || "100g")
    .trim()
    .toLowerCase();
  const multiplier =
    baseUnit === "100g" || baseUnit === "100 g" ? quantity / 100 : quantity;

  return {
    calories:
      food.calories === null ? null : toNumber(food.calories) * multiplier,
    protein: food.protein === null ? null : toNumber(food.protein) * multiplier,
    carbs: food.carbs === null ? null : toNumber(food.carbs) * multiplier,
    fats: food.fats === null ? null : toNumber(food.fats) * multiplier,
  };
};

const getMealTotals = (meal) => {
  return meal.foods.reduce(
    (totals, food) => {
      const macros = getCalculatedFoodItem(food);
      return {
        calories: totals.calories + (macros.calories || 0),
        protein: totals.protein + (macros.protein || 0),
        carbs: totals.carbs + (macros.carbs || 0),
        fats: totals.fats + (macros.fats || 0),
      };
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 },
  );
};

const getCalculatedMacros = (meal) => {
  return getMealTotals(meal);
};

export default function TrainerPlans() {
  const { t } = useTranslation();
  const [members, setMembers] = useState([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [planDays, setPlanDays] = useState([
    { dayName: "Day 1", exercises: [{ ...emptyExercise }] },
  ]);
  const [expandedDay, setExpandedDay] = useState(0);

  useBodyScrollLock(templateModalOpen);
  const [meals, setMeals] = useState([emptyMeal]);
  const [assigned, setAssigned] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageTone, setMessageTone] = useState("neutral");

  const planTotals = useMemo(() => {
    return meals.reduce(
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
  }, [meals]);

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      try {
        const res = await api.get("/users");
        const data = res?.data?.data?.users || res?.data?.users || [];
        setMembers(Array.isArray(data) ? data : []);
      } catch (err) {
        setMessage(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load members",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await api.get("/trainer/templates");
        const data = res?.data?.data || [];
        setTemplates(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load plan templates", err);
      }
    };
    fetchTemplates();
  }, []);

  const memberOptions = useMemo(() => {
    return members
      .filter((member) => member.role === "member")
      .filter((member) => {
        const query = memberSearch.trim().toLowerCase();
        if (!query) return true;
        return (
          member.name?.toLowerCase().includes(query) ||
          member.email?.toLowerCase().includes(query)
        );
      });
  }, [members, memberSearch]);

  const visibleMemberIds = useMemo(
    () => memberOptions.map((member) => member._id),
    [memberOptions],
  );

  const allVisibleSelected = useMemo(
    () =>
      visibleMemberIds.length > 0 &&
      visibleMemberIds.every((id) => assigned.includes(id)),
    [assigned, visibleMemberIds],
  );

  const updateDayName = (dayIndex, value) => {
    setPlanDays((current) =>
      current.map((day, idx) =>
        idx === dayIndex ? { ...day, dayName: value } : day,
      ),
    );
  };

  const updateExerciseInDay = (dayIndex, exerciseIndex, field, value) => {
    setPlanDays((current) =>
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
    setPlanDays((current) =>
      current.map((day, idx) =>
        idx === dayIndex
          ? { ...day, exercises: [...day.exercises, { ...emptyExercise }] }
          : day,
      ),
    );
  };

  const removeExerciseFromDay = (dayIndex, exerciseIndex) => {
    setPlanDays((current) =>
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
    setPlanDays((current) => {
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
    setPlanDays((current) =>
      current
        .filter((_, idx) => idx !== dayIndex)
        .map((day, idx) => ({
          ...day,
          dayName: day.dayName || `Day ${idx + 1}`,
        })),
    );
    setExpandedDay((current) => Math.max(0, current - 1));
  };

  const normalizeTemplateExercise = (exercise) => ({
    name: exercise.name || "",
    sets:
      exercise.sets !== undefined && exercise.sets !== null
        ? String(exercise.sets)
        : "",
    reps: exercise.reps || "",
    notes: exercise.notes || "",
    gifUrl: exercise.gifUrl || "",
  });

  const buildDaysFromTemplate = (template) => {
    if (Array.isArray(template.days) && template.days.length) {
      return template.days.map((day, idx) => ({
        dayName: day.dayName || `Day ${idx + 1}`,
        exercises:
          Array.isArray(day.exercises) && day.exercises.length
            ? day.exercises.map(normalizeTemplateExercise)
            : [{ ...emptyExercise }],
      }));
    }

    const flatExercises = Array.isArray(template.exercises)
      ? template.exercises.map(normalizeTemplateExercise)
      : [];

    return [
      {
        dayName: "Day 1",
        exercises: flatExercises.length
          ? flatExercises
          : [{ ...emptyExercise }],
      },
    ];
  };

  const updateMeal = (mealIndex, field, value) => {
    setMeals((current) =>
      current.map((meal, idx) =>
        idx !== mealIndex ? meal : { ...meal, [field]: value },
      ),
    );
  };

  const updateFoodItem = (mealIndex, foodIndex, field, value) => {
    setMeals((current) =>
      current.map((meal, idx) => {
        if (idx !== mealIndex) return meal;

        return {
          ...meal,
          foods: meal.foods.map((food, fIdx) =>
            fIdx !== foodIndex ? food : { ...food, [field]: value },
          ),
        };
      }),
    );
  };

  const selectFood = (mealIndex, foodIndex, selectedFood) => {
    const foodName =
      selectedFood?.nameAr?.trim() || selectedFood?.nameEn?.trim() || "";

    setMeals((current) =>
      current.map((meal, idx) => {
        if (idx !== mealIndex) return meal;

        return {
          ...meal,
          foods: meal.foods.map((food, fIdx) =>
            fIdx !== foodIndex
              ? food
              : {
                  ...food,
                  foodName,
                  calories: Number(selectedFood?.calories) || 0,
                  protein: Number(selectedFood?.protein) || 0,
                  carbs: Number(selectedFood?.carbs) || 0,
                  fats: Number(selectedFood?.fats) || 0,
                  baseUnit: selectedFood?.baseUnit || "100g",
                },
          ),
        };
      }),
    );
  };

  const addMeal = () => {
    setMeals((current) => [...current, { ...emptyMeal }]);
  };

  const addFoodToMeal = (mealIndex) => {
    setMeals((current) =>
      current.map((meal, idx) =>
        idx !== mealIndex
          ? meal
          : { ...meal, foods: [...meal.foods, { ...emptyFoodItem }] },
      ),
    );
  };

  const removeFoodFromMeal = (mealIndex, foodIndex) => {
    setMeals((current) =>
      current.map((meal, idx) => {
        if (idx !== mealIndex) return meal;

        const nextFoods = meal.foods.filter((_, fIdx) => fIdx !== foodIndex);
        return {
          ...meal,
          foods: nextFoods.length ? nextFoods : [{ ...emptyFoodItem }],
        };
      }),
    );
  };

  const removeMeal = (index) => {
    setMeals((current) => current.filter((_, idx) => idx !== index));
  };

  const loadTemplate = (templateId) => {
    if (!templateId) {
      setSelectedTemplateId("");
      return;
    }

    const template = templates.find((item) => item._id === templateId);
    if (!template) return;

    setSelectedTemplateId(templateId);
    setTitle(template.templateName || "");
    setPlanDays(buildDaysFromTemplate(template));
    setExpandedDay(0);
    setMeals(
      Array.isArray(template.meals) && template.meals.length
        ? template.meals.map((meal) => ({
            mealName: meal.mealName || meal.item || "",
            foods: [{ ...emptyFoodItem }],
          }))
        : [emptyMeal],
    );
  };

  const openTemplateModal = () => {
    setTemplateName("");
    setMessage(null);
    setMessageTone("neutral");
    setTemplateModalOpen(true);
  };

  const saveTemplate = async () => {
    if (!templateName.trim()) {
      setMessage(t("plans.templateNameRequired"));
      setMessageTone("error");
      return;
    }

    const cleanedDays = planDays
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
      meals: meals
        .filter((meal) => meal.mealName.trim())
        .map((meal) => ({
          mealName: meal.mealName.trim(),
          description: meal.foods
            .map((food) =>
              String(food.foodName || "").trim()
                ? `${String(food.foodName || "").trim()} ${String(
                    food.quantity || "",
                  ).trim()}`
                : "",
            )
            .filter(Boolean)
            .join(", "),
        })),
    };

    try {
      const res = await api.post("/trainer/templates", payload);
      if (res?.data?.success) {
        setTemplates((current) => [res.data.data, ...current]);
        setMessage(res.data.message || "Template saved");
        setMessageTone("success");
        setTemplateModalOpen(false);
      }
    } catch (err) {
      setMessage(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to save template",
      );
      setMessageTone("error");
    }
  };

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setAssigned((current) =>
        current.filter((id) => !visibleMemberIds.includes(id)),
      );
      return;
    }
    setAssigned((current) =>
      Array.from(new Set([...current, ...visibleMemberIds])),
    );
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const cleanedDays = planDays
        .map((day, dayIndex) => ({
          dayName: day.dayName.trim() || `Day ${dayIndex + 1}`,
          exercises: day.exercises
            .map((exercise) => ({
              name: exercise.name.trim(),
              sets: exercise.sets ? Number(exercise.sets) : undefined,
              reps: exercise.reps.trim() || undefined,
              notes: exercise.notes.trim() || undefined,
              gifUrl: exercise.gifUrl?.trim() || undefined,
            }))
            .filter(
              (item) => item.name || item.sets || item.reps || item.notes,
            ),
        }))
        .filter((day) => day.exercises.length);

      const flattenedExercises = cleanedDays.flatMap((day) => day.exercises);

      const dietNotes = meals
        .filter((meal) => meal.mealName.trim())
        .map((meal) => ({
          item: meal.mealName.trim(),
          alternatives: meal.foods
            .map((food) => String(food.foodName || "").trim())
            .filter(Boolean),
        }));

      const payload = {
        title,
        description,
        days: cleanedDays,
        exercises: flattenedExercises,
        dietNotes,
        assignedTo: assigned,
      };

      const res = await api.post("/plans", payload);
      setMessage(res?.data?.message || t("plans.planCreated"));
      setTitle("");
      setDescription("");
      setPlanDays([{ dayName: "Day 1", exercises: [{ ...emptyExercise }] }]);
      setMeals([emptyMeal]);
      setAssigned([]);
      setMemberSearch("");
    } catch (err) {
      setMessage(
        err?.response?.data?.message || err?.message || t("plans.createFailed"),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold text-slate-950">
        Training & Diet Plans
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        Create templates, add exercises and diet notes, then assign to members.
      </p>

      <form className="mt-6 grid gap-4" onSubmit={handleCreate}>
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-3xl border border-slate-200 px-4 py-3"
          required
        />
        <textarea
          placeholder="Short description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded-2xl border border-slate-200 px-4 py-3"
        />

        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <label className="text-sm text-slate-700">Load from template</label>
          <select
            value={selectedTemplateId}
            onChange={(e) => loadTemplate(e.target.value)}
            className="rounded-3xl border border-slate-200 bg-white px-4 py-3"
          >
            <option value="">Choose a saved template</option>
            {templates.map((template) => (
              <option key={template._id} value={template._id}>
                {template.templateName}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3 rounded-3xl border border-slate-100 bg-slate-50 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <label className="text-sm font-semibold text-slate-900">
                {t("plans.workoutExercises")}
              </label>
              <p className="text-xs text-slate-500">
                {t("plans.workoutExercisesHint")}
              </p>
            </div>
            <button
              type="button"
              onClick={addTrainingDay}
              className="rounded-full border border-slate-200 bg-slate-950 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              {t("plans.addTrainingDay")}
            </button>
          </div>
          <div className="space-y-4">
            {planDays.map((day, dayIndex) => {
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
                          📅{" "}
                          {day.dayName ||
                            `${t("plans.dayLabel", { number: dayIndex + 1 })}`}
                        </p>
                        <span className="rounded-lg bg-cyan-100 px-2 py-1 text-xs font-semibold text-cyan-700">
                          {exerciseCount} exercise
                          {exerciseCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {isOpen
                          ? "Click to collapse"
                          : "Click to expand and edit exercises"}
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
                      {isOpen ? t("plans.collapse") : t("plans.expand")}
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
                          placeholder={t("plans.dayNamePlaceholder")}
                        />
                        <button
                          type="button"
                          onClick={() => removeTrainingDay(dayIndex)}
                          disabled={planDays.length <= 1}
                          className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {t("plans.removeDay")}
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
                                    selectedExercise?.gifUrl?.trim() || "",
                                  );
                                }}
                                placeholder={t(
                                  "plans.exerciseSearchPlaceholder",
                                )}
                              />
                            </div>
                            <input
                              placeholder={t("plans.sets")}
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
                              placeholder={t("plans.reps")}
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
                            <input
                              placeholder={t("plans.notes")}
                              value={exercise.notes}
                              onChange={(e) =>
                                updateExerciseInDay(
                                  dayIndex,
                                  exerciseIndex,
                                  "notes",
                                  e.target.value,
                                )
                              }
                              className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none xl:flex-1"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                removeExerciseFromDay(dayIndex, exerciseIndex)
                              }
                              className="w-full rounded-3xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-100 xl:w-auto"
                            >
                              {t("plans.removeExercise")}
                            </button>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => addExerciseToDay(dayIndex)}
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-950 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
                      >
                        {t("plans.addExercise")}
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-3 rounded-3xl border border-slate-100 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-900">
                Diet meals
              </label>
              <p className="text-xs text-slate-500">
                Search the food library, add quantity, and preview live macros
                in real time.
              </p>
            </div>
            <button
              type="button"
              onClick={addMeal}
              className="rounded-3xl bg-slate-950 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              Add Meal
            </button>
          </div>
          <div className="space-y-3">
            {meals.map((meal, index) => {
              const totals = getMealTotals(meal);
              const mealHasFood = meal.foods.some((food) =>
                String(food.foodName || "").trim(),
              );

              return (
                <div
                  key={index}
                  className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1 min-w-0">
                      <input
                        value={meal.mealName}
                        onChange={(e) =>
                          updateMeal(index, "mealName", e.target.value)
                        }
                        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                        placeholder={`Meal ${index + 1}: Breakfast`}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeMeal(index)}
                      className="rounded-3xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-100"
                    >
                      Remove meal
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    {meal.foods.map((food, foodIndex) => {
                      const calculatedFood = getCalculatedFoodItem(food);
                      const hasFoodData = Boolean(
                        String(food.foodName || "").trim(),
                      );

                      return (
                        <div
                          key={`${index}-${foodIndex}`}
                          className="grid gap-3 sm:grid-cols-[1fr_96px_140px_auto]"
                        >
                          <div className="min-w-0">
                            <FoodAutocomplete
                              value={food.foodName}
                              onValueChange={(nextValue) =>
                                updateFoodItem(
                                  index,
                                  foodIndex,
                                  "foodName",
                                  nextValue,
                                )
                              }
                              onSelect={(selectedFood) =>
                                selectFood(index, foodIndex, selectedFood)
                              }
                              placeholder="Search food or type custom"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                              Qty
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={food.quantity}
                              onChange={(event) =>
                                updateFoodItem(
                                  index,
                                  foodIndex,
                                  "quantity",
                                  event.target.value,
                                )
                              }
                              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                              placeholder="100"
                            />
                          </div>

                          <div className="rounded-3xl border border-slate-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-900">
                            <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-700">
                              Food macros
                            </p>
                            <p className="mt-2 font-semibold">
                              {hasFoodData
                                ? `${Math.round(calculatedFood.calories || 0)} kcal • ${Math.round((calculatedFood.protein || 0) * 10) / 10}g P`
                                : "No food selected"}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFoodFromMeal(index, foodIndex)}
                            className="rounded-3xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-100"
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={() => addFoodToMeal(index)}
                      className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-950 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
                    >
                      Add Food Item
                    </button>
                    <div className="rounded-3xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        Meal subtotal
                      </p>
                      <div className="mt-2 grid gap-2 sm:grid-cols-4">
                        <div className="rounded-2xl bg-white px-3 py-2">
                          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                            kcal
                          </p>
                          <p className="mt-1 font-semibold">
                            {Math.round(totals.calories)}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-white px-3 py-2">
                          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                            protein
                          </p>
                          <p className="mt-1 font-semibold">
                            {Math.round(totals.protein * 10) / 10} g
                          </p>
                        </div>
                        <div className="rounded-2xl bg-white px-3 py-2">
                          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                            carbs
                          </p>
                          <p className="mt-1 font-semibold">
                            {Math.round(totals.carbs * 10) / 10} g
                          </p>
                        </div>
                        <div className="rounded-2xl bg-white px-3 py-2">
                          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                            fats
                          </p>
                          <p className="mt-1 font-semibold">
                            {Math.round(totals.fats * 10) / 10} g
                          </p>
                        </div>
                      </div>
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
                  Live totals for the direct assignment before you save.
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

        <div className="flex flex-col gap-3 rounded-3xl border border-slate-100 bg-slate-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <label className="text-sm font-semibold text-slate-900">
                Assign to members
              </label>
              <p className="text-xs text-slate-500">
                Only gym members are shown here.
              </p>
            </div>
            <button
              type="button"
              onClick={toggleSelectAll}
              className="rounded-3xl bg-slate-950 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              {allVisibleSelected ? "Clear visible" : "Select visible"}
            </button>
          </div>
          <input
            placeholder="Search members by name or email"
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
            className="rounded-3xl border border-slate-200 bg-white px-4 py-3"
          />
          {loading ? (
            <div className="text-sm text-slate-500">Loading members...</div>
          ) : (
            <div className="max-h-48 overflow-auto rounded-3xl border border-slate-200 bg-white p-3">
              {memberOptions.length ? (
                <div className="grid gap-2">
                  {memberOptions.map((m) => (
                    <label
                      key={m._id}
                      className="inline-flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={assigned.includes(m._id)}
                        onChange={(e) =>
                          setAssigned((cur) =>
                            e.target.checked
                              ? [...cur, m._id]
                              : cur.filter((id) => id !== m._id),
                          )
                        }
                        className="h-4 w-4 rounded border-slate-300 text-slate-900"
                      />
                      <span className="text-slate-700">
                        {m.name}{" "}
                        <span className="text-xs text-slate-400">
                          ({m.email})
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-500">
                  No members match your search.
                </div>
              )}
            </div>
          )}
        </div>

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

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={openTemplateModal}
            className="rounded-3xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-slate-50"
          >
            Save as Template
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-3xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Creating..." : "Create & Assign"}
          </button>
        </div>
      </form>

      {templateModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6">
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-4xl border border-slate-700 bg-white p-6 shadow-2xl shadow-slate-950/30">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-950">
                  Save plan as template
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Give this workout and meal plan a reusable name.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTemplateModalOpen(false)}
                className="rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
              >
                Close
              </button>
            </div>
            <div className="mt-6 space-y-4">
              <label className="block text-sm text-slate-700">
                Template name
                <input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="mt-2 w-full rounded-3xl border border-slate-200 px-4 py-3"
                  placeholder="e.g. Beginner Bulking Plan"
                />
              </label>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setTemplateModalOpen(false)}
                  className="rounded-3xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveTemplate}
                  className="rounded-3xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Save Template
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

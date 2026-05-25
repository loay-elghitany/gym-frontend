import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import ExerciseAutocomplete from "../../components/ExerciseAutocomplete";
import FoodAutocomplete from "../../components/FoodAutocomplete";
import useBodyScrollLock from "../../hooks/useBodyScrollLock";

const emptyMeal = {
  mealName: "",
  quantity: "",
  calories: null,
  protein: null,
  carbs: null,
  fats: null,
  baseUnit: "100g",
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
    protein: meal.protein === null ? null : toNumber(meal.protein) * multiplier,
    carbs: meal.carbs === null ? null : toNumber(meal.carbs) * multiplier,
    fats: meal.fats === null ? null : toNumber(meal.fats) * multiplier,
  };
};

export default function TrainerPlans() {
  const [members, setMembers] = useState([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [exercises, setExercises] = useState([
    { name: "", sets: "", reps: "", notes: "", gifUrl: "" },
  ]);

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

  const handleExerciseChange = (index, field, value) => {
    setExercises((current) =>
      current.map((exercise, idx) =>
        idx === index ? { ...exercise, [field]: value } : exercise,
      ),
    );
  };

  const addExercise = () => {
    setExercises((current) => [
      ...current,
      { name: "", sets: "", reps: "", notes: "", gifUrl: "" },
    ]);
  };

  const removeExercise = (index) => {
    setExercises((current) => current.filter((_, idx) => idx !== index));
  };

  const updateMeal = (index, field, value) => {
    setMeals((current) =>
      current.map((meal, idx) => {
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
    setMeals((current) =>
      current.map((meal, idx) => {
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
    setMeals((current) => [...current, { ...emptyMeal }]);
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
    setExercises(
      Array.isArray(template.exercises) && template.exercises.length
        ? template.exercises.map((exercise) => ({
            name: exercise.name || "",
            sets: exercise.sets !== undefined ? String(exercise.sets) : "",
            reps: exercise.reps || "",
            notes: exercise.notes || "",
            gifUrl: exercise.gifUrl || "",
          }))
        : [{ name: "", sets: "", reps: "", notes: "", gifUrl: "" }],
    );
    setMeals(
      Array.isArray(template.meals) && template.meals.length
        ? template.meals.map((meal) => ({
            mealName: meal.mealName || meal.item || "",
            quantity:
              meal.quantity !== undefined && meal.quantity !== null
                ? String(meal.quantity)
                : "",
            calories: meal.calories ?? null,
            protein: meal.protein ?? null,
            carbs: meal.carbs ?? null,
            fats: meal.fats ?? null,
            baseUnit: meal.baseUnit || "100g",
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
      setMessage("Template name is required.");
      setMessageTone("error");
      return;
    }

    const payload = {
      templateName: templateName.trim(),
      exercises: exercises
        .filter((exercise) => exercise.name.trim())
        .map((exercise) => ({
          name: exercise.name.trim(),
          sets: exercise.sets ? Number(exercise.sets) : 0,
          reps: exercise.reps.trim(),
          notes: exercise.notes.trim(),
          gifUrl: exercise.gifUrl?.trim() || "",
        })),
      meals: meals
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
      const filteredExercises = exercises
        .map((exercise) => ({
          name: exercise.name.trim(),
          sets: exercise.sets ? Number(exercise.sets) : undefined,
          reps: exercise.reps.trim() || undefined,
          notes: exercise.notes.trim() || undefined,
          gifUrl: exercise.gifUrl?.trim() || undefined,
        }))
        .filter((item) => item.name || item.sets || item.reps || item.notes);

      const dietNotes = meals
        .filter((meal) => meal.mealName.trim())
        .map((meal) => ({
          item: meal.mealName.trim(),
          alternatives: [],
        }));

      const payload = {
        title,
        description,
        exercises: filteredExercises,
        dietNotes,
        assignedTo: assigned,
      };

      const res = await api.post("/plans", payload);
      setMessage(res?.data?.message || "Plan created");
      setTitle("");
      setDescription("");
      setExercises([{ name: "", sets: "", reps: "", notes: "", gifUrl: "" }]);
      setMeals([emptyMeal]);
      setAssigned([]);
      setMemberSearch("");
    } catch (err) {
      setMessage(
        err?.response?.data?.message || err?.message || "Create failed",
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
          <div className="flex items-center justify-between gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-900">
                Workout exercises
              </label>
              <p className="text-xs text-slate-500">
                Add exercises with smart search, sets, reps, and optional notes.
              </p>
            </div>
            <button
              type="button"
              onClick={addExercise}
              className="rounded-3xl bg-slate-950 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              Add Exercise
            </button>
          </div>
          <div className="space-y-3">
            {exercises.map((exercise, index) => (
              <div
                key={index}
                className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm xl:flex-row xl:items-start"
              >
                <div className="flex-1 min-w-0">
                  <ExerciseAutocomplete
                    value={exercise.name}
                    onValueChange={(nextValue) =>
                      handleExerciseChange(index, "name", nextValue)
                    }
                    onSelect={(selectedExercise) => {
                      handleExerciseChange(
                        index,
                        "name",
                        selectedExercise?.nameAr?.trim() ||
                          selectedExercise?.nameEn?.trim() ||
                          exercise.name,
                      );
                      handleExerciseChange(
                        index,
                        "gifUrl",
                        selectedExercise?.gifUrl?.trim() || "",
                      );
                    }}
                    placeholder="Search exercise or type custom"
                  />
                </div>
                <input
                  placeholder="Sets"
                  value={exercise.sets}
                  onChange={(e) =>
                    handleExerciseChange(index, "sets", e.target.value)
                  }
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none xl:w-24"
                  type="number"
                  min="0"
                />
                <input
                  placeholder="Reps"
                  value={exercise.reps}
                  onChange={(e) =>
                    handleExerciseChange(index, "reps", e.target.value)
                  }
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none xl:w-24"
                />
                <input
                  placeholder="Notes"
                  value={exercise.notes}
                  onChange={(e) =>
                    handleExerciseChange(index, "notes", e.target.value)
                  }
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none xl:flex-1"
                />
                <button
                  type="button"
                  onClick={() => removeExercise(index)}
                  className="w-full rounded-3xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-100 xl:w-auto"
                >
                  Remove
                </button>
              </div>
            ))}
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
              const calculated = getCalculatedMacros(meal);
              const hasMacroData =
                meal.calories !== null ||
                meal.protein !== null ||
                meal.carbs !== null ||
                meal.fats !== null;

              return (
                <div
                  key={index}
                  className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start">
                    <div className="flex-1 min-w-0">
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

                    <div className="xl:w-40">
                      <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={meal.quantity}
                        onChange={(event) =>
                          updateMeal(index, "quantity", event.target.value)
                        }
                        className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                        placeholder="200"
                      />
                    </div>

                    <div className="xl:w-56">
                      <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Live macros
                      </span>
                      <span className="mt-2 inline-flex items-center rounded-full bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900">
                        {hasMacroData
                          ? `${Math.round(calculated.calories || 0)} kcal | ${Math.round((calculated.protein || 0) * 10) / 10}g P`
                          : "Start typing to preview"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeMeal(index)}
                      className="w-full rounded-3xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-100 xl:w-auto"
                    >
                      Remove
                    </button>
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

import { useEffect, useState } from "react";
import api from "../api/axios";
import ExerciseAutocomplete from "./ExerciseAutocomplete";
import useBodyScrollLock from "../hooks/useBodyScrollLock";

export default function SmartTemplatesBuilder() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [newExercises, setNewExercises] = useState([
    { name: "", sets: "", reps: "", gifUrl: "" },
  ]);
  const [newDietNotes, setNewDietNotes] = useState([""]);
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
    setNewExercises([{ name: "", sets: "", reps: "", gifUrl: "" }]);
    setNewDietNotes([""]);
    setSaving(false);
    setMessage(null);
    setMessageTone("neutral");
  };

  useBodyScrollLock(modalOpen);

  const updateExercise = (index, field, value) => {
    setNewExercises((prev) =>
      prev.map((exercise, idx) => {
        if (idx !== index) {
          return exercise;
        }

        const nextExercise = { ...exercise, [field]: value };

        if (field === "name") {
          nextExercise.gifUrl = "";
        }

        return nextExercise;
      }),
    );
  };

  const selectExercise = (index, selectedExercise) => {
    setNewExercises((prev) =>
      prev.map((exercise, idx) => {
        if (idx !== index) {
          return exercise;
        }

        return {
          ...exercise,
          name:
            selectedExercise?.nameAr?.trim() ||
            selectedExercise?.nameEn?.trim() ||
            exercise.name,
          gifUrl: selectedExercise?.gifUrl?.trim() || "",
        };
      }),
    );
  };

  const removeExercise = (index) => {
    setNewExercises((prev) => prev.filter((_, idx) => idx !== index));
  };

  const addExercise = () => {
    setNewExercises((prev) => [
      ...prev,
      { name: "", sets: "", reps: "", gifUrl: "" },
    ]);
  };

  const updateDietNote = (index, value) => {
    setNewDietNotes((prev) =>
      prev.map((note, idx) => (idx === index ? value : note)),
    );
  };

  const addDietNote = () => {
    setNewDietNotes((prev) => [...prev, ""]);
  };

  const removeDietNote = (index) => {
    setNewDietNotes((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleCreateTemplate = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setMessageTone("neutral");

    const payload = {
      templateName: templateName.trim(),
      exercises: newExercises
        .filter((exercise) => exercise.name.trim())
        .map((exercise) => ({
          name: exercise.name.trim(),
          sets: Number(exercise.sets) || 0,
          reps: exercise.reps.trim(),
          notes: exercise.notes?.trim() || "",
          gifUrl: exercise.gifUrl?.trim() || "",
        })),
      meals: newDietNotes
        .filter((note) => note.trim())
        .map((note) => ({
          mealName: note.trim(),
          description: "",
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
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-950">
                    Exercises
                  </p>
                  <button
                    onClick={addExercise}
                    type="button"
                    className="rounded-3xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Add exercise
                  </button>
                </div>
                <div className="space-y-3">
                  {newExercises.map((exercise, index) => (
                    <div
                      key={index}
                      className="flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-sm sm:flex-row sm:items-start"
                    >
                      <div className="w-full flex-1">
                        <ExerciseAutocomplete
                          value={exercise.name}
                          onValueChange={(nextValue) =>
                            updateExercise(index, "name", nextValue)
                          }
                          onSelect={(selectedExercise) =>
                            selectExercise(index, selectedExercise)
                          }
                          placeholder="Search exercise or type custom"
                        />
                      </div>
                      <input
                        value={exercise.sets}
                        onChange={(event) =>
                          updateExercise(index, "sets", event.target.value)
                        }
                        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none sm:w-24"
                        placeholder="Sets"
                        required
                      />
                      <input
                        value={exercise.reps}
                        onChange={(event) =>
                          updateExercise(index, "reps", event.target.value)
                        }
                        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none sm:w-24"
                        placeholder="Reps"
                        required
                      />
                      <button
                        onClick={() => removeExercise(index)}
                        type="button"
                        className="w-full rounded-3xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-100 sm:w-auto"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-950">
                    Diet notes
                  </p>
                  <button
                    onClick={addDietNote}
                    type="button"
                    className="rounded-3xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Add note
                  </button>
                </div>
                <div className="space-y-3">
                  {newDietNotes.map((note, index) => (
                    <div key={index} className="flex gap-3">
                      <input
                        value={note}
                        onChange={(event) =>
                          updateDietNote(index, event.target.value)
                        }
                        className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                        placeholder="Diet guidance or meal note"
                        required
                      />
                      <button
                        onClick={() => removeDietNote(index)}
                        type="button"
                        className="rounded-3xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-100"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
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

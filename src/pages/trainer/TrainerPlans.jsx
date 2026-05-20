import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function TrainerPlans() {
  const [members, setMembers] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [exercisesText, setExercisesText] = useState("");
  const [dietNotesText, setDietNotesText] = useState("");
  const [assigned, setAssigned] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

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

  const parseExercises = (text) => {
    // Simple parser: each line -> name | sets x reps | notes
    return text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split("|").map((p) => p.trim());
        return {
          name: parts[0],
          sets: parts[1] ? Number(parts[1].split("x")[0]) : undefined,
          reps: parts[1] ? parts[1].split("x")[1]?.trim() : undefined,
          notes: parts[2] || undefined,
        };
      });
  };

  const toggleSelectAll = () => {
    if (assigned.length === members.length) {
      setAssigned([]);
      return;
    }
    setAssigned(members.map((member) => member._id));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const exercises = parseExercises(exercisesText);
      const dietNotes = dietNotesText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        title,
        description,
        exercises,
        dietNotes,
        assignedTo: assigned,
      };
      const res = await api.post("/plans", payload);
      setMessage(res?.data?.message || "Plan created");
      // reset form
      setTitle("");
      setDescription("");
      setExercisesText("");
      setDietNotesText("");
      setAssigned([]);
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

        <label className="text-sm text-slate-700">
          Exercises (one per line, format: Name | sets x reps | notes)
        </label>
        <textarea
          value={exercisesText}
          onChange={(e) => setExercisesText(e.target.value)}
          className="rounded-2xl border border-slate-200 px-4 py-3"
          rows={5}
        />

        <label className="text-sm text-slate-700">
          Diet notes (one per line)
        </label>
        <textarea
          value={dietNotesText}
          onChange={(e) => setDietNotesText(e.target.value)}
          className="rounded-2xl border border-slate-200 px-4 py-3"
          rows={3}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="text-sm text-slate-700">Assign to members</label>
          <button
            type="button"
            onClick={toggleSelectAll}
            className="rounded-3xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            {assigned.length === members.length ? "Clear all" : "Select all"}
          </button>
        </div>
        {loading ? (
          <div className="text-sm text-slate-500">Loading members...</div>
        ) : (
          <div className="grid max-h-40 overflow-auto gap-2 rounded-md border border-slate-100 p-2">
            {members.map((m) => (
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
                />
                <span className="text-slate-700">
                  {m.name}{" "}
                  <span className="text-xs text-slate-400">({m.email})</span>
                </span>
              </label>
            ))}
          </div>
        )}

        {message ? (
          <div className="text-sm text-slate-700">{message}</div>
        ) : null}

        <div className="flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-3xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Creating..." : "Create & Assign"}
          </button>
        </div>
      </form>
    </section>
  );
}

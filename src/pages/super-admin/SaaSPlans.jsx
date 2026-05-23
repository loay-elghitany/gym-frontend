import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function SaaSPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    price: 0,
    maxMembers: 100,
    maxTrainers: 10,
    billingCycle: "monthly",
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const response = await api.get("/superadmin/plans");
      setPlans(response.data?.data || []);
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.message || "Unable to load plans",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPlans();
  }, []);

  const createPlan = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.post("/superadmin/plans", {
        ...form,
        features: form.description
          ? form.description
              .split(";")
              .map((item) => item.trim())
              .filter(Boolean)
          : [],
      });
      setForm({
        name: "",
        slug: "",
        description: "",
        price: 0,
        maxMembers: 100,
        maxTrainers: 10,
        billingCycle: "monthly",
      });
      await loadPlans();
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.message || "Unable to create plan",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
              Pricing templates
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-950">
              Plan templates
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Create and manage the SaaS subscription tiers that power tenant
              onboarding.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-xl font-semibold text-slate-950">
              Available plans
            </h3>
            <p className="text-sm text-slate-500">
              {plans.length} active templates
            </p>
          </div>
          {loading ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-700">
              Loading plans...
            </div>
          ) : (
            <div className="space-y-4">
              {plans.map((plan) => (
                <div
                  key={plan._id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-lg font-semibold text-slate-950">
                        {plan.name}
                      </h4>
                      <p className="mt-1 text-sm text-slate-600">
                        {plan.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-semibold text-slate-950">
                        ${plan.price}
                      </p>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                        {plan.billingCycle}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-3xl bg-white p-4 text-sm text-slate-600 shadow-sm">
                      <p className="font-semibold text-slate-900">Members</p>
                      <p className="mt-2 text-lg text-slate-950">
                        {plan.maxMembers}
                      </p>
                    </div>
                    <div className="rounded-3xl bg-white p-4 text-sm text-slate-600 shadow-sm">
                      <p className="font-semibold text-slate-900">Trainers</p>
                      <p className="mt-2 text-lg text-slate-950">
                        {plan.maxTrainers}
                      </p>
                    </div>
                    <div className="rounded-3xl bg-white p-4 text-sm text-slate-600 shadow-sm">
                      <p className="font-semibold text-slate-900">Slug</p>
                      <p className="mt-2 text-lg text-slate-950">{plan.slug}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-950">Create plan</h3>
          <p className="mt-2 text-sm text-slate-600">
            Add a new SaaS tier with limits and pricing.
          </p>
          <div className="mt-6 space-y-4">
            <label className="block text-sm text-slate-700">
              Plan name
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </label>
            <label className="block text-sm text-slate-700">
              Slug
              <input
                value={form.slug}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    slug: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </label>
            <label className="block text-sm text-slate-700">
              Description
              <textarea
                rows="3"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm text-slate-700">
                Price
                <input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      price: Number(event.target.value),
                    }))
                  }
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
              </label>
              <label className="block text-sm text-slate-700">
                Billing cycle
                <select
                  value={form.billingCycle}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      billingCycle: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                >
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual</option>
                  <option value="lifetime">Lifetime</option>
                </select>
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm text-slate-700">
                Member limit
                <input
                  type="number"
                  min="1"
                  value={form.maxMembers}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      maxMembers: Number(event.target.value),
                    }))
                  }
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
              </label>
              <label className="block text-sm text-slate-700">
                Trainer limit
                <input
                  type="number"
                  min="1"
                  value={form.maxTrainers}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      maxTrainers: Number(event.target.value),
                    }))
                  }
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
              </label>
            </div>
            {error ? (
              <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}
            <button
              type="button"
              disabled={saving}
              onClick={createPlan}
              className="mt-2 w-full rounded-3xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Creating plan..." : "Create plan template"}
            </button>
          </div>
        </aside>
      </section>
    </div>
  );
}

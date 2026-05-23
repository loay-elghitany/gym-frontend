import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

const statusClass = {
  active: "bg-emerald-100 text-emerald-700",
  suspended: "bg-rose-100 text-rose-700",
};

export default function SuperAdminDashboard() {
  const [gyms, setGyms] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const navigate = useNavigate();
  const [quotaModal, setQuotaModal] = useState({ open: false, gym: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, gym: null });
  const [newGym, setNewGym] = useState({
    name: "",
    slug: "",
    ownerName: "",
    email: "",
    ownerPassword: "",
    phone: "",
    planId: "",
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [quotaValue, setQuotaValue] = useState(100);

  const totals = useMemo(() => {
    const activeGyms = gyms.filter((gym) => gym.status === "active").length;
    const totalMembers = gyms.reduce(
      (sum, gym) => sum + (gym.totalMembers || 0),
      0,
    );
    const totalCapacity = gyms.reduce(
      (sum, gym) => sum + (gym.maxMembers || 0),
      0,
    );
    const revenueEstimate = Math.round(totalMembers * 75);

    return {
      activeGyms,
      totalMembers,
      revenueEstimate,
      capacityUsage: totalCapacity
        ? Math.min(100, Math.round((totalMembers / totalCapacity) * 100))
        : 0,
    };
  }, [gyms]);

  const loadGyms = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get("/superadmin/gyms");
      const payload = response.data?.data;
      const gymsList =
        Array.isArray(payload) && payload.length > 0
          ? payload
          : Array.isArray(payload?.gyms)
            ? payload.gyms
            : [];
      setGyms(gymsList);
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.message || "Unable to load gyms",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadPlans = async () => {
    try {
      const response = await api.get("/superadmin/plans");
      setPlans(response.data?.data || []);
    } catch (err) {
      // ignore plan load failures until the form is opened
      console.error("Unable to load SaaS plans", err);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      await loadGyms();
      await loadPlans();
    };

    initialize();
  }, []);

  const toggleStatus = async (gym) => {
    setActionLoading(true);
    setError(null);

    try {
      const nextStatus = gym.status === "active" ? "suspended" : "active";
      await api.put(`/superadmin/gyms/${gym.id}/status`, {
        status: nextStatus,
      });
      await loadGyms();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to update gym status",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const openQuotaEdit = (gym) => {
    setQuotaModal({ open: true, gym });
    setQuotaValue(gym.maxMembers || 100);
    setFormError(null);
  };

  const openDeleteConfirm = (gym) => {
    setDeleteModal({ open: true, gym });
    setFormError(null);
  };

  const confirmDelete = async () => {
    if (!deleteModal.gym) return;
    setActionLoading(true);
    setFormError(null);
    try {
      await api.delete(`/superadmin/gyms/${deleteModal.gym.id}`);
      setDeleteModal({ open: false, gym: null });
      await loadGyms();
      // Basic notification fallback
      alert("Gym and associated data deleted successfully.");
    } catch (err) {
      setFormError(
        err?.response?.data?.message || err?.message || "Unable to delete gym",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const saveQuota = async () => {
    if (!quotaModal.gym) return;
    const value = Number(quotaValue);
    if (Number.isNaN(value) || value < 1) {
      setFormError("Quota must be a positive number");
      return;
    }
    setActionLoading(true);
    setFormError(null);
    try {
      await api.put(`/superadmin/gyms/${quotaModal.gym.id}/quota`, {
        maxMembers: value,
      });
      setQuotaModal({ open: false, gym: null });
      await loadGyms();
    } catch (err) {
      setFormError(
        err?.response?.data?.message || err?.message || "Unable to save quota",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const createNewGym = async () => {
    setActionLoading(true);
    setFormError(null);

    if (!newGym.planId) {
      setFormError("Please select a plan for the new gym.");
      setActionLoading(false);
      return;
    }

    try {
      await api.post("/superadmin/gyms", {
        name: newGym.name,
        slug: newGym.slug,
        email: newGym.email,
        ownerName: newGym.ownerName,
        ownerPassword: newGym.ownerPassword,
        phone: newGym.phone,
        planId: newGym.planId,
      });
      setCreateOpen(false);
      setNewGym({
        name: "",
        slug: "",
        ownerName: "",
        email: "",
        ownerPassword: "",
        phone: "",
        planId: "",
      });
      await loadGyms();
    } catch (err) {
      setFormError(
        err?.response?.data?.message || err?.message || "Unable to create gym",
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-slate-500">
        Loading super admin dashboard...
      </div>
    );
  }

  return (
    <main className="space-y-10">
      <section className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-[0_28px_64px_-32px_rgba(15,23,42,0.2)]">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">
              Super Admin Control Center
            </p>
            <h1 className="text-5xl font-semibold tracking-tight text-slate-950">
              Global Gym Network
            </h1>
            <p className="max-w-2xl text-base leading-8 text-slate-600">
              Manage tenant quotas, tenant lifecycle, and membership growth
              across the whole platform.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setCreateOpen(true);
              setFormError(null);
            }}
            className="inline-flex items-center justify-center rounded-3xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Create New Gym
          </button>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <article className="rounded-4xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
            Active Gyms
          </p>
          <p className="mt-5 text-4xl font-semibold text-slate-950">
            {totals.activeGyms}
          </p>
          <p className="mt-3 text-sm text-slate-600">
            Gyms currently running and available to members
          </p>
        </article>

        <article className="rounded-4xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
            Total Members
          </p>
          <p className="mt-5 text-4xl font-semibold text-slate-950">
            {totals.totalMembers}
          </p>
          <p className="mt-3 text-sm text-slate-600">
            Registered active members across the network
          </p>
        </article>

        <article className="rounded-4xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
            Global Revenue Estimate
          </p>
          <p className="mt-5 text-4xl font-semibold text-slate-950">
            ${totals.revenueEstimate.toLocaleString()}
          </p>
          <p className="mt-3 text-sm text-slate-600">
            Projected monthly revenue from active memberships
          </p>
        </article>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
              Tenants Management
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-950">
              Gym quota overview
            </h2>
          </div>
          <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
            Capacity usage {totals.capacityUsage}% across all active quotas
          </div>
        </div>

        {error ? (
          <div className="mb-6 rounded-3xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-50">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-6 py-4 font-semibold">Gym Name</th>
                  <th className="px-6 py-4 font-semibold">Owner Email</th>
                  <th className="px-6 py-4 font-semibold">Plan</th>
                  <th className="px-6 py-4 font-semibold">Usage</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {gyms.map((gym) => {
                  const usage = gym.maxMembers
                    ? Math.min(
                        100,
                        Math.round((gym.totalMembers / gym.maxMembers) * 100),
                      )
                    : 0;
                  return (
                    <tr key={gym.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-6 py-4 font-semibold text-slate-950">
                        {gym.name}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {gym.ownerEmail}
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {gym.planName || "Custom"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="mb-2 flex items-center justify-between gap-3 text-xs text-slate-500">
                          <span>
                            {gym.totalMembers} / {gym.maxMembers}
                          </span>
                          <span>{usage}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-sky-600"
                            style={{ width: `${usage}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${statusClass[gym.status] || statusClass.active}`}
                        >
                          {gym.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-2">
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => navigate(`/admin/tenants/${gym.id}`)}
                          className="inline-flex min-w-[120px] items-center justify-center rounded-3xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-900 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => toggleStatus(gym)}
                          className="inline-flex min-w-[120px] items-center justify-center rounded-3xl bg-slate-950 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {gym.status === "active" ? "Suspend" : "Activate"}
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => openQuotaEdit(gym)}
                          className="inline-flex min-w-[120px] items-center justify-center rounded-3xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-900 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Edit Quota
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => openDeleteConfirm(gym)}
                          className="inline-flex min-w-[120px] items-center justify-center rounded-3xl bg-rose-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {createOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 px-4 py-8">
          <div className="w-full max-w-2xl rounded-[2rem] bg-white p-8 shadow-2xl shadow-slate-900/15">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-semibold text-slate-950">
                  Create new gym
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Provision a new tenant with owner credentials and an initial
                  member quota.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-3xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                Close
              </button>
            </div>

            <div className="mt-8 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-700">
                  Gym name
                  <input
                    name="name"
                    value={newGym.name}
                    onChange={(event) =>
                      setNewGym((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    placeholder="Studio Name"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  Gym slug
                  <input
                    name="slug"
                    value={newGym.slug}
                    onChange={(event) =>
                      setNewGym((current) => ({
                        ...current,
                        slug: event.target.value,
                      }))
                    }
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    placeholder="studio-name"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-700">
                  Owner name
                  <input
                    name="ownerName"
                    value={newGym.ownerName}
                    onChange={(event) =>
                      setNewGym((current) => ({
                        ...current,
                        ownerName: event.target.value,
                      }))
                    }
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    placeholder="Owner name"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  Owner email
                  <input
                    name="email"
                    type="email"
                    value={newGym.email}
                    onChange={(event) =>
                      setNewGym((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    placeholder="owner@example.com"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-700">
                  Owner password
                  <input
                    name="ownerPassword"
                    type="password"
                    value={newGym.ownerPassword}
                    onChange={(event) =>
                      setNewGym((current) => ({
                        ...current,
                        ownerPassword: event.target.value,
                      }))
                    }
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    placeholder="Create a strong password"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  Phone
                  <input
                    name="phone"
                    value={newGym.phone}
                    onChange={(event) =>
                      setNewGym((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    placeholder="Optional phone"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-700">
                  SaaS plan
                  <select
                    name="planId"
                    value={newGym.planId}
                    onChange={(event) =>
                      setNewGym((current) => ({
                        ...current,
                        planId: event.target.value,
                      }))
                    }
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  >
                    <option value="">Select a pricing plan</option>
                    {plans.map((plan) => (
                      <option key={plan._id} value={plan._id}>
                        {plan.name} — ${plan.price}/{plan.billingCycle}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {formError ? (
                <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
                  {formError}
                </div>
              ) : null}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="inline-flex items-center justify-center rounded-3xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={createNewGym}
                  className="inline-flex items-center justify-center rounded-3xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {actionLoading ? "Creating..." : "Create gym"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {quotaModal.open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 px-4 py-8">
          <div className="w-full max-w-xl rounded-[2rem] bg-white p-8 shadow-2xl shadow-slate-900/15">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-semibold text-slate-950">
                  Edit quota
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Adjust the maximum allowed active members for this gym.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuotaModal({ open: false, gym: null })}
                className="rounded-3xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                Close
              </button>
            </div>

            <div className="mt-8 space-y-4">
              <div>
                <p className="text-sm text-slate-500">Gym</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {quotaModal.gym?.name}
                </p>
                <p className="text-sm text-slate-500">
                  Owner: {quotaModal.gym?.ownerEmail}
                </p>
              </div>

              <label className="space-y-2 text-sm text-slate-700">
                Member quota
                <input
                  type="number"
                  min="1"
                  value={quotaValue}
                  onChange={(event) =>
                    setQuotaValue(Number(event.target.value) || 1)
                  }
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
              </label>

              {formError ? (
                <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
                  {formError}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setQuotaModal({ open: false, gym: null })}
                  className="inline-flex items-center justify-center rounded-3xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={saveQuota}
                  className="inline-flex items-center justify-center rounded-3xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {actionLoading ? "Saving..." : "Save quota"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {deleteModal.open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 px-4 py-8">
          <div className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-2xl shadow-slate-900/15">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-950">
                  Confirm permanent delete
                </h2>
                <p className="mt-2 text-sm leading-6 text-rose-700">
                  Are you sure you want to permanently delete this gym and ALL
                  associated data? This action cannot be undone.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModal({ open: false, gym: null })}
                className="rounded-3xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                Cancel
              </button>
            </div>

            {formError ? (
              <div className="mt-4 rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
                {formError}
              </div>
            ) : null}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setDeleteModal({ open: false, gym: null })}
                className="inline-flex items-center justify-center rounded-3xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={confirmDelete}
                className="inline-flex items-center justify-center rounded-3xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading ? "Deleting..." : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

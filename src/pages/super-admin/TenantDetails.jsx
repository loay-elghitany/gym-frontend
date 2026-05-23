import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/axios";
import useBodyScrollLock from "../../hooks/useBodyScrollLock";

export default function TenantDetails() {
  const { id } = useParams();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    maxMembers: 0,
    primaryColor: "",
    logoUrl: "",
    status: "",
    subscriptionStatus: "",
  });
  const [ownerModalOpen, setOwnerModalOpen] = useState(false);
  const [ownerSaving, setOwnerSaving] = useState(false);

  useBodyScrollLock(ownerModalOpen);
  const [ownerForm, setOwnerForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const loadTenant = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/superadmin/gyms/${id}`);
      const data = response.data?.data;
      setTenant(data);
      setForm({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        maxMembers: data.maxMembers || 0,
        primaryColor: data.primaryColor || "",
        logoUrl: data.logoUrl || "",
        status: data.status || "",
        subscriptionStatus: data.subscriptionStatus || "",
      });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load tenant details",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const initializeTenant = async () => {
      await loadTenant();
    };

    initializeTenant();
  }, [loadTenant]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await api.put(`/superadmin/gyms/${id}`, form);
      await loadTenant();
      setSuccess("Tenant details updated successfully.");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to save tenant details",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCreateOwner = async () => {
    setOwnerSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await api.post(`/superadmin/gyms/${id}/owner`, ownerForm);
      setOwnerModalOpen(false);
      setOwnerForm({ name: "", email: "", password: "" });
      await loadTenant();
      setSuccess("Owner account created successfully.");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to create owner account",
      );
    } finally {
      setOwnerSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-700">
        Loading tenant details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
              Tenant details
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-950">
              {tenant.name}
            </h2>
            <p className="mt-1 text-sm text-slate-600">{tenant.slug}</p>
          </div>
          <div className="space-y-4 text-sm text-slate-600">
            <div>Owner: {tenant.ownerName}</div>
            <div>Email: {tenant.ownerEmail}</div>
            <div>Plan: {tenant.planName}</div>
            <button
              type="button"
              onClick={() => {
                setOwnerModalOpen(true);
                setError(null);
                setSuccess(null);
              }}
              className="inline-flex items-center justify-center rounded-3xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Add Owner
            </button>
          </div>
        </div>
      </section>

      {success ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
          {success}
        </div>
      ) : null}
      <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
              Subscription summary
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  Status
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {tenant.status}
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  Subscription
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {tenant.subscriptionStatus}
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  Members quota
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {tenant.maxMembers}
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  Trainers quota
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {tenant.maxTrainers}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block space-y-2 text-sm text-slate-700">
              Gym name
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </label>
            <label className="block space-y-2 text-sm text-slate-700">
              Contact email
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </label>
            <label className="block space-y-2 text-sm text-slate-700">
              Phone
              <input
                value={form.phone}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    phone: event.target.value,
                  }))
                }
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2 text-sm text-slate-700">
                Member quota
                <input
                  type="number"
                  min="1"
                  value={form.maxMembers}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      maxMembers: Number(event.target.value) || 0,
                    }))
                  }
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
              </label>
              <label className="block space-y-2 text-sm text-slate-700">
                Brand color
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      primaryColor: event.target.value,
                    }))
                  }
                  className="h-12 w-full rounded-3xl border border-slate-200 bg-slate-50 p-2"
                />
              </label>
            </div>
            <label className="block space-y-2 text-sm text-slate-700">
              Logo URL
              <input
                value={form.logoUrl}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    logoUrl: event.target.value,
                  }))
                }
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </label>
            {error ? (
              <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
                {error}
              </div>
            ) : null}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center justify-center rounded-3xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save tenant updates"}
            </button>
          </div>
        </div>

        <aside className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
            White-label preview
          </p>
          <div
            className="mt-5 rounded-3xl border border-slate-200 bg-white p-5"
            style={{ borderColor: tenant.primaryColor || undefined }}
          >
            <div className="flex items-center gap-3">
              <div
                className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-lg font-semibold"
                style={{ backgroundColor: tenant.primaryColor || "#0f172a" }}
              >
                {tenant.name?.charAt(0) || "G"}
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-950">
                  {tenant.name}
                </p>
                <p className="text-sm text-slate-500">
                  brand color: {tenant.primaryColor || "#0f172a"}
                </p>
              </div>
            </div>
            {tenant.logoUrl ? (
              <img
                src={tenant.logoUrl}
                alt="Logo preview"
                className="mt-5 w-full rounded-3xl border border-slate-200 object-cover"
              />
            ) : (
              <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-slate-100 p-6 text-sm text-slate-500">
                Upload a logo URL to preview it here.
              </div>
            )}
          </div>
        </aside>
      </section>

      {ownerModalOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 px-4 py-8">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-[2rem] bg-white p-8 shadow-2xl shadow-slate-900/15">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-semibold text-slate-950">
                  Add gym owner
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Create an owner account linked to this gym.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOwnerModalOpen(false)}
                className="rounded-3xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                Close
              </button>
            </div>

            <div className="mt-8 space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="space-y-2 text-sm text-slate-700">
                  Owner name
                  <input
                    value={ownerForm.name}
                    onChange={(event) =>
                      setOwnerForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  Owner email
                  <input
                    type="email"
                    value={ownerForm.email}
                    onChange={(event) =>
                      setOwnerForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  Password
                  <input
                    type="password"
                    value={ownerForm.password}
                    onChange={(event) =>
                      setOwnerForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                </label>
              </div>
              {error ? (
                <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={ownerSaving}
                  onClick={() => setOwnerModalOpen(false)}
                  className="inline-flex items-center justify-center rounded-3xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={ownerSaving}
                  onClick={handleCreateOwner}
                  className="inline-flex items-center justify-center rounded-3xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {ownerSaving ? "Creating..." : "Create owner"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

import { useEffect, useState } from "react";
import api from "../../api/axios";
import useBodyScrollLock from "../../hooks/useBodyScrollLock";

export default function SubscriptionsPage() {
  const [activeTab, setActiveTab] = useState("subscriptions");
  const [subscriptions, setSubscriptions] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [packagesError, setPackagesError] = useState(null);
  const [packageModalOpen, setPackageModalOpen] = useState(false);
  const [packageSaving, setPackageSaving] = useState(false);

  useBodyScrollLock(packageModalOpen);
  const [packageDeleting, setPackageDeleting] = useState(false);
  const [activePackageId, setActivePackageId] = useState(null);
  const [packageForm, setPackageForm] = useState({
    name: "",
    price: "",
    durationInDays: "",
    unlimited: true,
    sessionCount: "",
  });
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    async function loadSubscriptions() {
      try {
        setLoading(true);
        const response = await api.get("/users?role=member");
        const members = Array.isArray(response.data?.data)
          ? response.data.data
          : Array.isArray(response.data?.data?.users)
            ? response.data.data.users
            : [];

        setSubscriptions(
          members
            .filter((user) => user.role === "member" && user.subscription)
            .map((user) => ({
              id: user._id,
              name: user.name,
              email: user.email,
              packageType: user.subscription.packageType || "Standard",
              membershipType: user.subscription.membershipType || "limited",
              totalSessions: user.subscription.totalSessions || 0,
              remainingSessions: user.subscription.remainingSessions || 0,
              price: user.subscription.price || 0,
              status: user.subscription.status || "active",
              expiryDate:
                user.subscription.expiryDate || user.subscription.expiresAt,
            }))
            .sort((a, b) => a.name.localeCompare(b.name)),
        );
      } catch (fetchError) {
        setError(
          fetchError?.response?.data?.message ||
            fetchError.message ||
            "Unable to load subscriptions.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadSubscriptions();
  }, []);

  useEffect(() => {
    if (activeTab !== "packages") {
      return;
    }

    async function loadPackages() {
      try {
        setPackagesLoading(true);
        const response = await api.get("/owner/packages");
        setPackages(
          Array.isArray(response.data?.data) ? response.data.data : [],
        );
      } catch (fetchError) {
        setPackagesError(
          fetchError?.response?.data?.message ||
            fetchError.message ||
            "Unable to load membership packages.",
        );
      } finally {
        setPackagesLoading(false);
      }
    }

    loadPackages();
  }, [activeTab]);

  const refreshPackages = async () => {
    try {
      setPackagesLoading(true);
      const response = await api.get("/owner/packages");
      setPackages(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (fetchError) {
      setPackagesError(
        fetchError?.response?.data?.message ||
          fetchError.message ||
          "Unable to load membership packages.",
      );
    } finally {
      setPackagesLoading(false);
    }
  };

  const handleCreatePackage = async () => {
    setPackageSaving(true);
    setPackagesError(null);
    setSuccessMessage(null);

    try {
      const payload = {
        name: packageForm.name,
        price: Number(packageForm.price),
        durationInDays: Number(packageForm.durationInDays),
        sessionCount: packageForm.unlimited
          ? null
          : Number(packageForm.sessionCount),
      };

      await api.post("/owner/packages", payload);
      setPackageModalOpen(false);
      setPackageForm({
        name: "",
        price: "",
        durationInDays: "",
        unlimited: true,
        sessionCount: "",
      });
      setSuccessMessage("Package created successfully.");
      refreshPackages();
    } catch (fetchError) {
      setPackagesError(
        fetchError?.response?.data?.message ||
          fetchError.message ||
          "Unable to create package.",
      );
    } finally {
      setPackageSaving(false);
    }
  };

  const handleDeletePackage = async (packageId) => {
    setPackageDeleting(true);
    setPackagesError(null);
    setSuccessMessage(null);

    try {
      await api.delete(`/owner/packages/${packageId}`);
      setSuccessMessage("Package deleted successfully.");
      refreshPackages();
    } catch (fetchError) {
      setPackagesError(
        fetchError?.response?.data?.message ||
          fetchError.message ||
          "Unable to delete package.",
      );
    } finally {
      setPackageDeleting(false);
      setActivePackageId(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Subscription management
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            Membership subscriptions
          </h1>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab("subscriptions")}
          className={`rounded-3xl px-4 py-3 text-sm font-semibold transition ${
            activeTab === "subscriptions"
              ? "bg-slate-950 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          Active subscriptions
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("packages")}
          className={`rounded-3xl px-4 py-3 text-sm font-semibold transition ${
            activeTab === "packages"
              ? "bg-slate-950 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          Membership packages
        </button>
        {activeTab === "packages" ? (
          <button
            type="button"
            onClick={() => {
              setPackageModalOpen(true);
              setSuccessMessage(null);
              setPackagesError(null);
            }}
            className="ml-auto inline-flex items-center justify-center rounded-3xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Create package
          </button>
        ) : null}
      </div>

      {successMessage ? (
        <div className="mb-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          {successMessage}
        </div>
      ) : null}

      {activeTab === "subscriptions" ? (
        loading ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
            Loading subscriptions...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-700">
            {error}
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
            No member subscriptions found.
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Member</th>
                    <th className="px-6 py-4 font-semibold">Package</th>
                    <th className="px-6 py-4 font-semibold">Membership</th>
                    <th className="px-6 py-4 font-semibold">Remaining</th>
                    <th className="px-6 py-4 font-semibold">Expiry</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {subscriptions.map((sub) => (
                    <tr key={sub.id}>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">
                          {sub.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {sub.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">{sub.packageType}</td>
                      <td className="px-6 py-4 capitalize">
                        {sub.membershipType}
                      </td>
                      <td className="px-6 py-4">
                        {sub.membershipType === "limited"
                          ? `${sub.remainingSessions}/${sub.totalSessions}`
                          : "Unlimited"}
                      </td>
                      <td className="px-6 py-4">
                        {sub.expiryDate
                          ? new Date(sub.expiryDate).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                            sub.status === "active"
                              ? "bg-emerald-100 text-emerald-700"
                              : sub.status === "expired"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : packagesLoading ? (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
          Loading packages...
        </div>
      ) : packagesError ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-700">
          {packagesError}
        </div>
      ) : packages.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
          No membership packages created yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Package</th>
                  <th className="px-6 py-4 font-semibold">Price</th>
                  <th className="px-6 py-4 font-semibold">Duration</th>
                  <th className="px-6 py-4 font-semibold">Sessions</th>
                  <th className="px-6 py-4 font-semibold">Created</th>
                  <th className="px-6 py-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {packages.map((pkg) => (
                  <tr key={pkg._id}>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">
                        {pkg.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">${pkg.price.toFixed(2)}</td>
                    <td className="px-6 py-4">{pkg.durationInDays} days</td>
                    <td className="px-6 py-4">
                      {pkg.sessionCount === null || pkg.sessionCount === 0
                        ? "Unlimited"
                        : pkg.sessionCount}
                    </td>
                    <td className="px-6 py-4">
                      {pkg.createdAt
                        ? new Date(pkg.createdAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => {
                          setActivePackageId(pkg._id);
                          handleDeletePackage(pkg._id);
                        }}
                        disabled={
                          packageDeleting && activePackageId === pkg._id
                        }
                        className="inline-flex items-center justify-center rounded-3xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {packageDeleting && activePackageId === pkg._id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {packageModalOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 px-4 py-8">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-[2rem] bg-white p-8 shadow-2xl shadow-slate-900/15">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-semibold text-slate-950">
                  Create membership package
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Define a package that gym members can subscribe to.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPackageModalOpen(false)}
                className="rounded-3xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                Close
              </button>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-700">
                Package name
                <input
                  value={packageForm.name}
                  onChange={(event) =>
                    setPackageForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                Price
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={packageForm.price}
                  onChange={(event) =>
                    setPackageForm((current) => ({
                      ...current,
                      price: event.target.value,
                    }))
                  }
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                Duration (days)
                <input
                  type="number"
                  min="1"
                  value={packageForm.durationInDays}
                  onChange={(event) =>
                    setPackageForm((current) => ({
                      ...current,
                      durationInDays: event.target.value,
                    }))
                  }
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
              </label>
              <div className="space-y-2 text-sm text-slate-700">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={packageForm.unlimited}
                    onChange={(event) =>
                      setPackageForm((current) => ({
                        ...current,
                        unlimited: event.target.checked,
                        sessionCount: event.target.checked
                          ? ""
                          : current.sessionCount,
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-500"
                  />
                  <span>Unlimited sessions</span>
                </div>
                {!packageForm.unlimited ? (
                  <input
                    type="number"
                    min="1"
                    value={packageForm.sessionCount}
                    onChange={(event) =>
                      setPackageForm((current) => ({
                        ...current,
                        sessionCount: event.target.value,
                      }))
                    }
                    placeholder="Session quota"
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                ) : (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    Members can use unlimited sessions during this package.
                  </div>
                )}
              </div>
            </div>

            {packagesError ? (
              <div className="mt-5 rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
                {packagesError}
              </div>
            ) : null}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPackageModalOpen(false)}
                className="inline-flex items-center justify-center rounded-3xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={packageSaving}
                onClick={handleCreatePackage}
                className="inline-flex items-center justify-center rounded-3xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {packageSaving ? "Saving..." : "Create package"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

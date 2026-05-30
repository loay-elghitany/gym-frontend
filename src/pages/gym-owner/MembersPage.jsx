import { useState, useEffect } from "react";
import api from "../../api/axios";
import useBodyScrollLock from "../../hooks/useBodyScrollLock";

const roleOptions = [
  { value: "member", label: "Member" },
  { value: "trainer", label: "Trainer" },
];

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "member",
    packageId: "",
    specialty: "",
    bio: "",
  });

  useBodyScrollLock(modalOpen);
  const [packages, setPackages] = useState([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get("/users");
        const data = response?.data?.data?.users || response?.data?.users || [];
        setMembers(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load members",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await api.get("/owner/packages");
        const data = response?.data?.data || [];
        setPackages(Array.isArray(data) ? data : []);
      } catch {
        setPackages([]);
      }
    };

    fetchPackages();
  }, []);

  const openModal = () => {
    setSubmitError(null);
    setForm({
      name: "",
      email: "",
      password: "",
      role: "member",
      packageId: "",
      specialty: "",
      bio: "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitLoading(true);
    setSubmitError(null);

    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        specialty: form.specialty || undefined,
        bio: form.bio || undefined,
      };

      if (form.role === "member") {
        payload.packageId = form.packageId;
      }

      const response = await api.post("/users", payload);

      const added = response?.data?.data || response?.data;
      if (added) {
        setMembers((current) => [added, ...current]);
      }
      setModalOpen(false);
    } catch (err) {
      setSubmitError(
        err?.response?.data?.message || err?.message || "Unable to create user",
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const trainers = members.filter((user) =>
    user.role?.toLowerCase().includes("trainer"),
  );

  const membersOnly = members.filter(
    (user) =>
      user.role &&
      !user.role.toLowerCase().includes("trainer") &&
      user.role.toLowerCase().includes("member"),
  );

  return (
    <main className="space-y-8">
      <section className="rounded-4xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-900/5">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-sky-600">
              Members & Trainers
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
              Team directory
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-600">
              View every active member and trainer in your gym, then invite new
              team members with a single form.
            </p>
          </div>
          <button
            type="button"
            onClick={openModal}
            className="inline-flex items-center justify-center rounded-3xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Add New Member/Trainer
          </button>
        </div>
      </section>

      <section className="rounded-4xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500">
            Loading member directory...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
            {error}
          </div>
        ) : members.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-600">
            No members or trainers yet. Use the button above to add someone.
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.32em] text-sky-600">
                    Trainers
                  </p>
                  <h2 className="text-2xl font-semibold text-slate-950">
                    Active trainers
                  </h2>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                  {trainers.length} total
                </span>
              </div>
              <div className="overflow-hidden rounded-4xl border border-slate-200 bg-slate-50">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-100 text-slate-600">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Name</th>
                        <th className="px-4 py-3 font-semibold">Email</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {trainers.map((trainer) => (
                        <tr
                          key={trainer.id || trainer._id || trainer.email}
                          className="hover:bg-slate-50"
                        >
                          <td className="whitespace-nowrap px-4 py-4 font-medium text-slate-950">
                            {trainer.name || "—"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                            {trainer.email || "—"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4">
                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                              {trainer.active === false ? "Inactive" : "Active"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.32em] text-sky-600">
                    Members
                  </p>
                  <h2 className="text-2xl font-semibold text-slate-950">
                    Active members
                  </h2>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                  {membersOnly.length} total
                </span>
              </div>
              <div className="overflow-hidden rounded-4xl border border-slate-200 bg-slate-50">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-100 text-slate-600">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Name</th>
                        <th className="px-4 py-3 font-semibold">Email</th>
                        <th className="px-4 py-3 font-semibold">Joined</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {membersOnly.map((member) => (
                        <tr
                          key={member.id || member._id || member.email}
                          className="hover:bg-slate-50"
                        >
                          <td className="whitespace-nowrap px-4 py-4 font-medium text-slate-950">
                            {member.name || "—"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                            {member.email || "—"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                            {member.createdAt || member.joinedAt
                              ? new Date(
                                  member.createdAt || member.joinedAt,
                                ).toLocaleDateString()
                              : "Unknown"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                member?.subscription?.status === "paused"
                                  ? "bg-rose-100 text-rose-700"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {member?.subscription?.status === "paused"
                                ? `Frozen${member?.subscription?.frozenUntil ? ` until ${new Date(member.subscription.frozenUntil).toLocaleDateString()}` : ""}`
                                : member?.subscription?.status || "Active"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 px-4 py-8">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-[2rem] bg-white p-8 shadow-2xl shadow-slate-900/10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-950">
                  Add new member or trainer
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Enter contact details and role to invite a new gym account.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-3xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                Close
              </button>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-700">
                  Name
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    placeholder="Full name"
                    required
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  Email
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    placeholder="email@example.com"
                    required
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-700">
                  Password
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    placeholder="Create a password"
                    required
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  Role
                  <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  >
                    {roleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {form.role === "trainer" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2 text-sm text-slate-700">
                    Specialty
                    <input
                      name="specialty"
                      value={form.specialty}
                      onChange={handleChange}
                      className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                      placeholder="Strength & Conditioning"
                    />
                  </label>
                  <label className="space-y-2 text-sm text-slate-700">
                    Short bio
                    <input
                      name="bio"
                      value={form.bio}
                      onChange={handleChange}
                      className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                      placeholder="Elite fitness coach with 10+ years experience"
                    />
                  </label>
                </div>
              )}

              {form.role === "member" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2 text-sm text-slate-700">
                    Select Membership Package
                    <select
                      name="packageId"
                      value={form.packageId}
                      onChange={handleChange}
                      required
                      className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    >
                      <option value="" disabled>
                        Choose a package
                      </option>
                      {packages.map((pkg) => (
                        <option
                          key={pkg._id || pkg.id}
                          value={pkg._id || pkg.id}
                        >
                          {pkg.name || pkg.packageType || "Untitled package"}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : null}

              {submitError ? (
                <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
                  {submitError}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="inline-flex items-center justify-center rounded-3xl border border-slate-200 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="inline-flex items-center justify-center rounded-3xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitLoading ? "Creating..." : "Create account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}

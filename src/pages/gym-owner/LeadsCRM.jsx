import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function LeadsCRM() {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchLeads();
    fetchStats();
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await api.get("/gym/leads");
      setLeads(response.data.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get("/gym/leads/stats");
      setStats(response.data.data);
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  };

  const updateLeadStatus = async (leadId, newStatus) => {
    setUpdatingId(leadId);
    // Optimistically update UI, revert on error
    let previousLeads;
    setLeads((prev) => {
      previousLeads = prev;
      return prev.map((lead) =>
        lead._id === leadId ? { ...lead, status: newStatus } : lead,
      );
    });
    try {
      await api.patch(`/gym/leads/${leadId}/status`, { status: newStatus });
      fetchStats();
    } catch (err) {
      // revert
      setLeads(previousLeads || []);
      setError(err?.response?.data?.message || "Failed to update lead");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredLeads =
    filter === "All" ? leads : leads.filter((lead) => lead.status === filter);

  const getStatusColor = (status) => {
    switch (status) {
      case "New":
        return "bg-blue-100 text-blue-700";
      case "Contacted":
        return "bg-amber-100 text-amber-700";
      case "Converted":
        return "bg-emerald-100 text-emerald-700";
      case "Lost":
        return "bg-rose-100 text-rose-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-slate-600">Loading leads...</div>
      </div>
    );
  }

  return (
    <main className="space-y-8 p-6 lg:p-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">
          Lead Generation
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Leads CRM
        </h1>
        <p className="mt-2 text-slate-600">
          Manage and convert leads from your landing page
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-600">Total Leads</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">
              {stats.total}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-600">New</p>
            <p className="mt-2 text-3xl font-semibold text-blue-600">
              {stats.new}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-600">Contacted</p>
            <p className="mt-2 text-3xl font-semibold text-amber-600">
              {stats.contacted}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-600">Converted</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-600">
              {stats.converted}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-600">Conversion Rate</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">
              {stats.conversionRate}%
            </p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {["All", "New", "Contacted", "Converted", "Lost"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              filter === status
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Leads Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                Name
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                Phone
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                Email
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                Status
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                Created
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLeads.length > 0 ? (
              filteredLeads.map((lead) => (
                <tr key={lead._id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    {lead.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {lead.phone}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {lead.email || "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(
                        lead.status,
                      )}`}
                    >
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={lead.status}
                      onChange={(e) =>
                        updateLeadStatus(lead._id, e.target.value)
                      }
                      disabled={updatingId === lead._id}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-900 outline-none transition focus:border-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Converted">Converted</option>
                      <option value="Lost">Lost</option>
                    </select>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-sm text-slate-500"
                >
                  No leads found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

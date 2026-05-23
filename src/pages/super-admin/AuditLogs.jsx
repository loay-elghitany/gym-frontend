import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get("/superadmin/audit-logs");
      setLogs(response.data?.data || []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load audit logs",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadLogs();
  }, []);

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
              Audit trail
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-950">
              Platform activity
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Review the last 200 administrative actions and system changes.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-700">
            Loading audit logs...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
            {error}
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((entry) => (
              <div
                key={entry._id}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      {entry.action}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {entry.actorName || "System"}
                    </p>
                  </div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                    {new Date(entry.createdAt).toLocaleString()}
                  </p>
                </div>
                {entry.targetType ? (
                  <p className="mt-3 text-sm text-slate-700">
                    Target: {entry.targetType}
                  </p>
                ) : null}
                {entry.details ? (
                  <div className="mt-3 text-sm text-slate-600">
                    {Object.entries(entry.details).map(([key, value]) => (
                      <div key={key}>
                        <span className="font-semibold text-slate-900">
                          {key}:
                        </span>{" "}
                        {value}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

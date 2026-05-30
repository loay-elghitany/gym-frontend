import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../../api/axios";
import ChurnRadarPanel from "../../components/ChurnRadarPanel";

export default function ReportsPage() {
  const { t } = useTranslation();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const response = await api.get("/owner/reports/dashboard");
        setDashboard(response.data?.data || null);
      } catch (error) {
        setLoadError(
          error?.response?.data?.message ||
            error?.message ||
            "Unable to load dashboard metrics",
        );
        setDashboard(null);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const handleDownloadCsv = async () => {
    try {
      setDownloadError(null);
      setDownloadLoading(true);
      const response = await api.get("/owner/reports/export?format=xlsx", {
        responseType: "blob",
      });
      const contentDisposition =
        response.headers["content-disposition"] ||
        response.headers["Content-Disposition"] ||
        "";
      let filename = "members-report.csv";

      const filenameMatch = contentDisposition.match(
        /filename\*?=(?:UTF-8''|"|')?([^"';\n]+)/i,
      );
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"\s]/g, "");
      }

      const contentType =
        response.headers["content-type"] ||
        response.headers["Content-Type"] ||
        "application/octet-stream";
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setDownloadError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to download members report.",
      );
    } finally {
      setDownloadLoading(false);
    }
  };

  return (
    <main className="space-y-6">
      {/* Dashboard Metrics */}
      {loadError && (
        <div className="rounded-4xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <p className="font-semibold">Error loading metrics:</p>
          <p>{loadError}</p>
        </div>
      )}

      {/* Metrics Grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          // Skeleton loaders
          Array.from({ length: 5 }).map((_, i) => (
            <article
              key={i}
              className="animate-pulse rounded-3xl border border-slate-200 bg-slate-50 p-6"
            >
              <div className="h-4 w-32 rounded bg-slate-200" />
              <div className="mt-4 h-10 w-24 rounded bg-slate-200" />
              <div className="mt-2 h-3 w-40 rounded bg-slate-200" />
            </article>
          ))
        ) : dashboard ? (
          <>
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                Active Members
              </p>
              <p className="mt-4 text-4xl font-bold text-slate-950">
                {dashboard.activeMembers ?? 0}
              </p>
              <p className="mt-2 text-xs text-slate-600">
                Currently active subscriptions
              </p>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                New Trainees
              </p>
              <p className="mt-4 text-4xl font-bold text-emerald-600">
                {dashboard.newTraineesThisMonth ?? 0}
              </p>
              <p className="mt-2 text-xs text-slate-600">This month</p>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                Expiring Soon
              </p>
              <p className="mt-4 text-4xl font-bold text-orange-600">
                {dashboard.expiringSoon ?? 0}
              </p>
              <p className="mt-2 text-xs text-slate-600">Next 7 days</p>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                Monthly Revenue
              </p>
              <p className="mt-4 text-4xl font-bold text-sky-600">
                ${(dashboard.monthlyRevenue ?? 0).toFixed(2)}
              </p>
              <p className="mt-2 text-xs text-slate-600">Current month</p>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                Expected 30-Day Revenue
              </p>
              <p className="mt-4 text-4xl font-bold text-cyan-600">
                ${(dashboard.expected30DayRevenue ?? 0).toFixed(2)}
              </p>
              <p className="mt-2 text-xs text-slate-600">
                Renewals in next 30 days
              </p>
            </article>
          </>
        ) : (
          <article className="col-span-full rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-600">
            No data available
          </article>
        )}
      </section>

      {/* Detailed Reports Section */}
      <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">
              Detailed reports
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Use the widgets above for quick insights; export CSV for deep
              analysis.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDownloadCsv}
              disabled={downloadLoading}
              className="inline-flex items-center justify-center rounded-3xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {downloadLoading ? "Downloading..." : "Download Members Report"}
            </button>
          </div>
        </div>
        {downloadError ? (
          <div className="mt-4 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {downloadError}
          </div>
        ) : null}
      </section>
    </main>
  );
}

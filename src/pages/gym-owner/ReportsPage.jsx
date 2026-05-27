import { useEffect, useState } from "react";
import api from "../../api/axios";
import ChurnRadarPanel from "../../components/ChurnRadarPanel";

export default function ReportsPage() {
  const [dashboard, setDashboard] = useState({ expected30DayRevenue: 0 });
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await api.get("/owner/reports/dashboard");
        setDashboard(response.data?.data || { expected30DayRevenue: 0 });
      } catch {
        setDashboard({ expected30DayRevenue: 0 });
      }
    };

    loadDashboard();
  }, []);

  const handleDownloadCsv = async () => {
    try {
      setDownloadError(null);
      setDownloadLoading(true);
      const response = await api.get("/owner/reports/export", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "members.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setDownloadError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to download members CSV.",
      );
    } finally {
      setDownloadLoading(false);
    }
  };

  return (
    <main className="space-y-6">
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
              {downloadLoading ? "Downloading..." : "Download Members CSV"}
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

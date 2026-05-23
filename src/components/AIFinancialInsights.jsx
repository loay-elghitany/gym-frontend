import { useEffect, useState } from "react";
import api from "../api/axios";

export default function AIFinancialInsights({ expectedRevenue }) {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForecast = async () => {
      setLoading(true);
      try {
        const res = await api.get("/owner/metrics/forecast");
        setForecast(res?.data?.data || null);
      } catch {
        setForecast(null);
      } finally {
        setLoading(false);
      }
    };
    fetchForecast();
  }, []);

  const alertText =
    forecast && forecast.renewalRate < 0.5
      ? "Renewal dip predicted — consider a short flash sale to recover revenue."
      : null;

  return (
    <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-950">
        AI Financial Insights
      </h3>
      <p className="mt-2 text-sm text-slate-600">
        Predictive revenue for the next 30 days
      </p>
      {loading ? (
        <div className="mt-4 h-24 animate-pulse rounded bg-slate-100" />
      ) : forecast ? (
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500">Expected 30d revenue</div>
            <div className="text-xl font-semibold text-slate-950">
              $
              {Math.round(
                expectedRevenue !== undefined
                  ? expectedRevenue
                  : forecast?.expectedRenewals || 0,
              )}
            </div>
          </div>
          <div className="mt-3 h-28 w-full overflow-hidden">
            <svg
              className="w-full h-full"
              viewBox="0 0 300 60"
              preserveAspectRatio="none"
            >
              <polyline
                fill="none"
                stroke="#0ea5a4"
                strokeWidth="2"
                points={(forecast.daily || [])
                  .map((d, i) => {
                    const x = (i / (forecast.daily.length - 1 || 1)) * 300;
                    const vals = forecast.daily.map((p) => p.expected || 0);
                    const max = Math.max(...vals, 1);
                    const y = 60 - ((d.expected || 0) / max) * 50;
                    return `${x},${y}`;
                  })
                  .join(" ")}
              />
            </svg>
          </div>
          {alertText ? (
            <div className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {alertText}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 text-sm text-slate-600">
          Unable to load forecast
        </div>
      )}
    </div>
  );
}

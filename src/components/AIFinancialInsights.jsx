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
}

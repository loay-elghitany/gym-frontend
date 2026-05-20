import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function VolumeAndMarkers({ userId }) {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/workoutlogs?userId=${userId || user?._id}`);
        setLogs(res?.data?.data?.logs || []);
      } catch (err) {
        setLogs([]);
      }
    };
    if (userId || user?._id) fetch();
  }, [userId, user]);

  const points = logs
    .slice(0, 12)
    .reverse()
    .map((l, i, arr) => ({
      x: (i / (arr.length - 1 || 1)) * 100,
      y: l.totalVolume || 0,
    }));

  const max = Math.max(...points.map((p) => p.y), 1);

  return (
    <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-950">
        Performance Volume
      </h3>
      <p className="mt-2 text-sm text-slate-600">
        12-session recent total volume
      </p>
      <div className="mt-4 h-28 w-full">
        <svg
          viewBox="0 0 100 30"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <polyline
            fill="none"
            stroke="#06b6d4"
            strokeWidth="0.8"
            points={points
              .map((p) => `${p.x},${30 - (p.y / max) * 25}`)
              .join(" ")}
          />
        </svg>
      </div>

      <div className="mt-4">
        <h4 className="text-sm font-semibold text-slate-900">
          Biomedical markers
        </h4>
        <div className="mt-2 space-y-2 text-sm text-slate-600">
          <div>
            Vitamin D:{" "}
            {user?.healthProfile?.bloodMarkers?.vitaminD?.value ?? "—"}{" "}
            {user?.healthProfile?.bloodMarkers?.vitaminD?.unit}
          </div>
          <div>
            Iron: {user?.healthProfile?.bloodMarkers?.iron?.value ?? "—"}{" "}
            {user?.healthProfile?.bloodMarkers?.iron?.unit}
          </div>
          <div>
            Testosterone:{" "}
            {user?.healthProfile?.bloodMarkers?.testosterone?.value ?? "—"}{" "}
            {user?.healthProfile?.bloodMarkers?.testosterone?.unit}
          </div>
        </div>
      </div>
    </div>
  );
}

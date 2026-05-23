import { useEffect, useState } from "react";
import api from "../api/axios";

export default function CommunityLeaderboard() {
  const [challenges, setChallenges] = useState([]);
  const [selected, setSelected] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get("/challenges");
        setChallenges(res?.data?.data?.challenges || []);
        if (res?.data?.data?.challenges?.[0])
          setSelected(res.data.data.challenges[0]._id);
      } catch {
        setChallenges([]);
      }
    };
    fetch();
  }, []);

  useEffect(() => {
    if (!selected) return;
    const fetchBoard = async () => {
      try {
        const res = await api.get(`/challenges/${selected}/leaderboard`);
        setLeaderboard(res?.data?.data?.leaderboard || []);
      } catch {
        setLeaderboard([]);
      }
    };
    fetchBoard();
  }, [selected]);

  return (
    <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-950">
          Community Leaderboard
        </h3>
        <select
          value={selected || ""}
          onChange={(e) => setSelected(e.target.value)}
          className="rounded-2xl border px-3 py-2 text-sm"
        >
          {challenges.map((c) => (
            <option key={c._id} value={c._id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 space-y-3">
        {leaderboard.length ? (
          leaderboard.map((row, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-200" />
                <div>
                  <div className="font-medium text-slate-900">
                    {row.user?.name || "Member"}
                  </div>
                  <div className="text-xs text-slate-500">
                    {row.attendanceCount} sessions •{" "}
                    {Math.round(row.totalVolume)} volume
                  </div>
                </div>
              </div>
              <div className="text-sm font-semibold text-slate-950">
                #{idx + 1}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            No participants yet.
          </div>
        )}
      </div>
    </div>
  );
}

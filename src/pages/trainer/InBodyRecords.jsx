import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import useBodyScrollLock from "../../hooks/useBodyScrollLock";

const pageSize = 6;

export default function InBodyRecords() {
  const [members, setMembers] = useState([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [records, setRecords] = useState([]);
  const [latestRecord, setLatestRecord] = useState(null);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [savingRecord, setSavingRecord] = useState(false);
  const [message, setMessage] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("inbody"); // "inbody", "checkins", or "progress"
  const [checkIns, setCheckIns] = useState([]);
  const [loadingCheckIns, setLoadingCheckIns] = useState(false);
  const [feedbacks, setFeedbacks] = useState({});
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [progressPhotos, setProgressPhotos] = useState([]);
  const [memberInBodyRecords, setMemberInBodyRecords] = useState([]);
  const [loadingProgress, setLoadingProgress] = useState(false);

  const [scanData, setScanData] = useState({
    weight: "",
    skeletalMuscleMass: "",
    bodyFatMass: "",
    bodyFatPercentage: "",
    bmi: "",
    bmr: "",
    visceralFatLevel: "",
    date: new Date().toISOString().slice(0, 10),
  });

  useBodyScrollLock(modalOpen);

  useEffect(() => {
    const loadMembers = async () => {
      setLoadingMembers(true);
      try {
        const res = await api.get("/users");
        const data = res?.data?.data?.users || res?.data?.users || [];
        setMembers(Array.isArray(data) ? data : []);
      } catch (err) {
        setMessage(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load members",
        );
      } finally {
        setLoadingMembers(false);
      }
    };
    loadMembers();
  }, []);

  const memberOptions = useMemo(
    () =>
      members
        .filter((member) => member.role === "member")
        .filter((member) => {
          const query = memberSearch.trim().toLowerCase();
          if (!query) return true;
          return (
            member.name?.toLowerCase().includes(query) ||
            member.email?.toLowerCase().includes(query)
          );
        }),
    [members, memberSearch],
  );

  useEffect(() => {
    const loadRecords = async () => {
      if (!selectedMemberId) {
        setRecords([]);
        setLatestRecord(null);
        return;
      }
      setLoadingRecords(true);
      setMessage(null);
      try {
        const res = await api.get(`/trainer/inbody/${selectedMemberId}`);
        const data = res?.data?.data || {};
        setRecords(Array.isArray(data.records) ? data.records : []);
        setLatestRecord(data.latestRecord || null);
        setCurrentPage(1);
      } catch (err) {
        setMessage(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load records",
        );
      } finally {
        setLoadingRecords(false);
      }
    };
    loadRecords();
  }, [selectedMemberId]);

  useEffect(() => {
    const loadCheckIns = async () => {
      if (!selectedMemberId || activeTab !== "checkins") {
        setCheckIns([]);
        return;
      }
      setLoadingCheckIns(true);
      try {
        const res = await api.get(`/trainer/checkins/${selectedMemberId}`);
        setCheckIns(Array.isArray(res?.data?.data) ? res.data.data : []);
      } catch (err) {
        console.error("Failed to load check-ins:", err);
      } finally {
        setLoadingCheckIns(false);
      }
    };
    loadCheckIns();
  }, [selectedMemberId, activeTab]);

  useEffect(() => {
    const loadProgress = async () => {
      if (!selectedMemberId || activeTab !== "progress") {
        setProgressPhotos([]);
        setMemberInBodyRecords([]);
        return;
      }
      setLoadingProgress(true);
      try {
        const res = await api.get(`/member/progress/${selectedMemberId}`);
        const data = res?.data?.data || {};
        setProgressPhotos(
          Array.isArray(data.progressPhotos) ? data.progressPhotos : [],
        );
        setMemberInBodyRecords(
          Array.isArray(data.inBodyRecords) ? data.inBodyRecords : [],
        );
      } catch (err) {
        console.error("Failed to load progress:", err);
        setProgressPhotos([]);
        setMemberInBodyRecords([]);
      } finally {
        setLoadingProgress(false);
      }
    };
    loadProgress();
  }, [selectedMemberId, activeTab]);

  const selectedMember = useMemo(
    () => members.find((member) => member._id === selectedMemberId) || null,
    [members, selectedMemberId],
  );

  const handleAddFeedback = async (checkInId) => {
    const text = (feedbacks[checkInId] || "").trim();
    if (!text) return;
    setSubmittingFeedback(true);
    try {
      await api.patch(`/trainer/checkins/${checkInId}/feedback`, {
        feedback: text,
      });
      // Clear only this check-in's input
      setFeedbacks((prev) => ({ ...prev, [checkInId]: "" }));
      // Reload check-ins
      const res = await api.get(`/trainer/checkins/${selectedMemberId}`);
      setCheckIns(Array.isArray(res?.data?.data) ? res.data.data : []);
    } catch (err) {
      setMessage(err?.response?.data?.message || "Failed to add feedback");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const pageRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return records.slice(start, start + pageSize);
  }, [records, currentPage]);

  const latestMetrics = latestRecord || {};

  const maxBarValue = Math.max(
    latestMetrics.weight || 0,
    latestMetrics.skeletalMuscleMass || 0,
    latestMetrics.bodyFatMass || 0,
    1,
  );

  const trendRecords = useMemo(() => {
    const sorted = [...records].sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );
    return sorted.slice(-8);
  }, [records]);

  const trendPoints = useMemo(() => {
    if (!trendRecords.length) return { pbf: [], smm: [], labels: [] };
    const values = trendRecords.map((item) => ({
      pbf: item.bodyFatPercentage || 0,
      smm: item.skeletalMuscleMass || 0,
      label: new Date(item.date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
    }));
    const maxValue = Math.max(
      ...values.map((item) => Math.max(item.pbf, item.smm)),
      1,
    );
    return {
      pbf: values.map((item, index) => ({
        x: (index / (values.length - 1 || 1)) * 100,
        y: 100 - (item.pbf / maxValue) * 100,
      })),
      smm: values.map((item, index) => ({
        x: (index / (values.length - 1 || 1)) * 100,
        y: 100 - (item.smm / maxValue) * 100,
      })),
      labels: values.map((item) => item.label),
    };
  }, [trendRecords]);

  const openModal = () => {
    setScanData({
      weight: "",
      skeletalMuscleMass: "",
      bodyFatMass: "",
      bodyFatPercentage: "",
      bmi: "",
      bmr: "",
      visceralFatLevel: "",
      date: new Date().toISOString().slice(0, 10),
    });
    setModalOpen(true);
    setMessage(null);
  };

  const handleScanSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMemberId) {
      setMessage("Select a member before saving a scan.");
      return;
    }
    setSavingRecord(true);
    setMessage(null);
    try {
      const res = await api.post("/trainer/inbody", {
        memberId: selectedMemberId,
        ...scanData,
      });
      if (res?.data?.success) {
        setMessage("New scan saved successfully.");
        setModalOpen(false);
        const newRecord = res.data.data;
        setRecords((current) => [newRecord, ...current]);
        setLatestRecord(newRecord);
      }
    } catch (err) {
      setMessage(
        err?.response?.data?.message || err?.message || "Unable to save scan",
      );
    } finally {
      setSavingRecord(false);
    }
  };

  return (
    <main className="space-y-8 px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <section className="rounded-4xl border border-slate-700 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/40">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-sky-400">
              InBody Analytics
            </p>
            <h1 className="text-3xl font-semibold text-white">
              Member Composition Dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Select a member to review their latest body composition scan,
              compare muscle and fat, and track progress with historical
              metrics.
            </p>
          </div>
          <div className="max-w-sm">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Search member
            </label>
            <input
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="Search by name or email"
              className="w-full rounded-3xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-700 bg-slate-950/80 p-4">
            <label className="text-xs uppercase tracking-[0.24em] text-slate-500">
              Selected member
            </label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              disabled={loadingMembers}
              className="mt-3 w-full rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            >
              <option value="" disabled>
                {loadingMembers ? "Loading members..." : "Choose member"}
              </option>
              {memberOptions.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.name} — {member.email}
                </option>
              ))}
            </select>
            {selectedMember ? (
              <p className="mt-3 text-sm text-slate-400">
                {selectedMember.name} • {selectedMember.email}
              </p>
            ) : null}
          </div>
          <div className="rounded-3xl border border-slate-700 bg-slate-950/80 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                  Latest scan
                </p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {latestRecord
                    ? new Date(latestRecord.date).toLocaleDateString()
                    : "No scan yet"}
                </p>
              </div>
              <button
                type="button"
                onClick={openModal}
                className="rounded-3xl bg-sky-500 px-4 py-2 text-xs font-semibold uppercase text-slate-950 transition hover:bg-sky-400"
              >
                New Scan
              </button>
            </div>
            <p className="mt-3 text-sm text-slate-400">
              Add the latest body composition entry and track trends over time.
            </p>
          </div>
        </div>
      </section>

      {message ? (
        <div className="rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-sm text-slate-200">
          {message}
        </div>
      ) : null}

      {/* Tab Navigation */}
      {selectedMemberId && (
        <div className="flex gap-2 border-b border-slate-700 pb-4">
          <button
            onClick={() => setActiveTab("inbody")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === "inbody"
                ? "bg-sky-500 text-slate-950"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            InBody Records
          </button>
          <button
            onClick={() => setActiveTab("checkins")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === "checkins"
                ? "bg-sky-500 text-slate-950"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            Weekly Check-ins
          </button>
          <button
            onClick={() => setActiveTab("progress")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === "progress"
                ? "bg-sky-500 text-slate-950"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            📸 Visual Progress
          </button>
        </div>
      )}

      {activeTab === "checkins" && selectedMemberId ? (
        <section className="rounded-4xl border border-slate-700 bg-slate-950/90 p-6">
          <h2 className="text-2xl font-semibold text-white">
            {selectedMember?.name}'s Weekly Check-ins
          </h2>
          {loadingCheckIns ? (
            <div className="mt-4 text-sm text-slate-400">
              Loading check-ins...
            </div>
          ) : checkIns.length > 0 ? (
            <div className="mt-6 space-y-4">
              {checkIns.map((checkIn) => (
                <div
                  key={checkIn._id}
                  className="rounded-3xl border border-slate-700 bg-slate-900/80 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-semibold text-white">
                          Week {checkIn.weekNumber}, {checkIn.year}
                        </p>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            checkIn.trainerFeedback
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-amber-500/20 text-amber-400"
                          }`}
                        >
                          {checkIn.trainerFeedback ? "Reviewed" : "Pending"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(checkIn.createdAt).toLocaleDateString()}
                      </p>
                      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-slate-500">Weight</p>
                          <p className="font-semibold text-white">
                            {checkIn.currentWeight || "-"} kg
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Fatigue Level</p>
                          <p className="font-semibold text-white">
                            {checkIn.fatigueLevel}/10
                          </p>
                        </div>
                      </div>
                      {checkIn.notes && (
                        <div className="mt-4">
                          <p className="text-xs text-slate-500">Notes</p>
                          <p className="mt-1 text-sm text-slate-300">
                            {checkIn.notes}
                          </p>
                        </div>
                      )}
                      {checkIn.trainerFeedback && (
                        <div className="mt-4 rounded-2xl bg-emerald-500/10 p-4">
                          <p className="text-xs font-semibold text-emerald-400">
                            Your Feedback
                          </p>
                          <p className="mt-1 text-sm text-emerald-200">
                            {checkIn.trainerFeedback}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  {!checkIn.trainerFeedback && (
                    <div className="mt-4 rounded-2xl bg-slate-800 p-4">
                      <p className="text-xs font-semibold text-slate-400">
                        Add Feedback
                      </p>
                      <div className="mt-3 flex gap-2">
                        <input
                          type="text"
                          value={feedbacks[checkIn._id] || ""}
                          onChange={(e) =>
                            setFeedbacks((prev) => ({
                              ...prev,
                              [checkIn._id]: e.target.value,
                            }))
                          }
                          placeholder="Encouragement or guidance..."
                          className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                        />
                        <button
                          onClick={() => handleAddFeedback(checkIn._id)}
                          disabled={
                            submittingFeedback ||
                            !(feedbacks[checkIn._id] || "").trim()
                          }
                          className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {submittingFeedback ? "Sending..." : "Send"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-700 bg-slate-950/50 p-8 text-center text-sm text-slate-500">
              No weekly check-ins submitted yet
            </div>
          )}
        </section>
      ) : (
        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-700 bg-slate-950/90 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                  Weight
                </p>
                <p className="mt-4 text-3xl font-semibold text-white">
                  {latestMetrics.weight ? `${latestMetrics.weight} kg` : "—"}
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Body scale and weight progress.
                </p>
              </div>
              <div className="rounded-3xl border border-slate-700 bg-slate-950/90 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                  Muscle mass
                </p>
                <p className="mt-4 text-3xl font-semibold text-white">
                  {latestMetrics.skeletalMuscleMass
                    ? `${latestMetrics.skeletalMuscleMass} kg`
                    : "—"}
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Skeletal muscle measurement from the most recent scan.
                </p>
              </div>
              <div className="rounded-3xl border border-slate-700 bg-slate-950/90 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                  Body fat
                </p>
                <p className="mt-4 text-3xl font-semibold text-white">
                  {latestMetrics.bodyFatPercentage
                    ? `${latestMetrics.bodyFatPercentage}%`
                    : "—"}
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Percentage of fat mass from the latest composite scan.
                </p>
              </div>
              <div className="rounded-3xl border border-slate-700 bg-slate-950/90 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                  BMR
                </p>
                <p className="mt-4 text-3xl font-semibold text-white">
                  {latestMetrics.bmr ? `${latestMetrics.bmr} kcal` : "—"}
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Resting metabolic rate estimated from the scan.
                </p>
              </div>
            </div>

            <div className="rounded-4xl border border-slate-700 bg-slate-950/90 p-6 shadow-lg shadow-slate-950/20">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    Muscle-Fat Analysis
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Compare weight, muscle mass, and fat mass for the latest
                    scan.
                  </p>
                </div>
              </div>
              <div className="mt-6 space-y-4">
                {latestRecord ? (
                  <div className="grid gap-4 sm:grid-cols-3">
                    {[
                      { label: "Weight", value: latestMetrics.weight || 0 },
                      {
                        label: "Muscle",
                        value: latestMetrics.skeletalMuscleMass || 0,
                      },
                      { label: "Fat", value: latestMetrics.bodyFatMass || 0 },
                    ].map((item) => {
                      const width = `${Math.round((item.value / maxBarValue) * 100)}%`;
                      return (
                        <div
                          key={item.label}
                          className="space-y-2 rounded-3xl bg-slate-900 p-4"
                        >
                          <p className="text-sm font-semibold text-slate-300">
                            {item.label}
                          </p>
                          <p className="text-3xl font-semibold text-white">
                            {item.value || 0}
                          </p>
                          <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                            <div
                              className="h-full rounded-full bg-sky-500"
                              style={{ width }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-3xl bg-slate-900 p-6 text-sm text-slate-400">
                    Select a member and save a scan to populate the analysis.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-4xl border border-slate-700 bg-slate-950/90 p-6 shadow-lg shadow-slate-950/20">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    Trendline Overview
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Body fat percentage and skeletal muscle mass over time.
                  </p>
                </div>
              </div>
              {trendRecords.length ? (
                <div className="mt-6 overflow-hidden rounded-3xl bg-slate-900 p-4">
                  <div className="relative h-64 w-full">
                    <svg viewBox="0 0 100 100" className="h-full w-full">
                      <defs>
                        <linearGradient
                          id="trendA"
                          x1="0%"
                          y1="0%"
                          x2="0%"
                          y2="100%"
                        >
                          <stop
                            offset="0%"
                            stopColor="#38bdf8"
                            stopOpacity="0.8"
                          />
                          <stop
                            offset="100%"
                            stopColor="#38bdf8"
                            stopOpacity="0.1"
                          />
                        </linearGradient>
                        <linearGradient
                          id="trendB"
                          x1="0%"
                          y1="0%"
                          x2="0%"
                          y2="100%"
                        >
                          <stop
                            offset="0%"
                            stopColor="#f97316"
                            stopOpacity="0.8"
                          />
                          <stop
                            offset="100%"
                            stopColor="#f97316"
                            stopOpacity="0.1"
                          />
                        </linearGradient>
                      </defs>
                      <polyline
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="1.8"
                        points={trendPoints.smm
                          .map((point) => `${point.x},${point.y}`)
                          .join(" ")}
                      />
                      <polyline
                        fill="none"
                        stroke="#f97316"
                        strokeWidth="1.8"
                        points={trendPoints.pbf
                          .map((point) => `${point.x},${point.y}`)
                          .join(" ")}
                      />
                      {trendPoints.labels.map((label, index) => (
                        <g key={label}>
                          <line
                            x1={
                              (index / (trendPoints.labels.length - 1 || 1)) *
                              100
                            }
                            y1="0"
                            x2={
                              (index / (trendPoints.labels.length - 1 || 1)) *
                              100
                            }
                            y2="100"
                            stroke="rgba(148, 163, 184, 0.12)"
                            strokeWidth="0.4"
                          />
                        </g>
                      ))}
                    </svg>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-3xl bg-slate-900 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                        Latest SMM
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-white">
                        {latestMetrics.skeletalMuscleMass || "—"}
                      </p>
                    </div>
                    <div className="rounded-3xl bg-slate-900 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                        Latest PBF
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-white">
                        {latestMetrics.bodyFatPercentage
                          ? `${latestMetrics.bodyFatPercentage}%`
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-3xl bg-slate-900 p-6 text-sm text-slate-400">
                  Members with scan history will display trend lines here.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-4xl border border-slate-700 bg-slate-950/90 p-6 shadow-lg shadow-slate-950/20">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Scan history
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Recent InBody records for the selected member.
                </p>
              </div>
              <button
                type="button"
                onClick={openModal}
                className="rounded-3xl bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-600"
              >
                Add scan
              </button>
            </div>

            <div className="mt-6 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
              <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-300">
                <thead className="bg-slate-950/90 text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Weight</th>
                    <th className="px-4 py-3">Muscle</th>
                    <th className="px-4 py-3">Fat %</th>
                    <th className="px-4 py-3">BMR</th>
                    <th className="px-4 py-3">Visceral</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {loadingRecords ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-4 py-6 text-center text-slate-500"
                      >
                        Loading records...
                      </td>
                    </tr>
                  ) : pageRecords.length ? (
                    pageRecords.map((record) => (
                      <tr
                        key={record._id}
                        className="border-b border-slate-800"
                      >
                        <td className="px-4 py-4 text-slate-200">
                          {new Date(record.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4">{record.weight || "—"}</td>
                        <td className="px-4 py-4">
                          {record.skeletalMuscleMass || "—"}
                        </td>
                        <td className="px-4 py-4">
                          {record.bodyFatPercentage || "—"}%
                        </td>
                        <td className="px-4 py-4">{record.bmr || "—"}</td>
                        <td className="px-4 py-4">
                          {record.visceralFatLevel || "—"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-4 py-6 text-center text-slate-500"
                      >
                        {selectedMemberId
                          ? "No scans have been recorded for this member yet."
                          : "Select a member to load InBody history."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 text-sm text-slate-400">
              <span>
                Page {currentPage} of{" "}
                {Math.max(1, Math.ceil(records.length / pageSize))}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((value) => Math.max(1, value - 1))
                  }
                  disabled={currentPage === 1}
                  className="rounded-3xl border border-slate-700 bg-slate-800 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((value) =>
                      Math.min(
                        Math.max(1, Math.ceil(records.length / pageSize)),
                        value + 1,
                      ),
                    )
                  }
                  disabled={currentPage >= Math.ceil(records.length / pageSize)}
                  className="rounded-3xl border border-slate-700 bg-slate-800 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Visual Progress Tab - Photo Gallery and Member-Uploaded InBody Records */}
      {activeTab === "progress" && selectedMemberId ? (
        <section className="space-y-6 rounded-4xl border border-slate-700 bg-slate-950/90 p-6">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Member Progress
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              View progress photos and InBody records uploaded by{" "}
              {selectedMember?.name || "the member"}.
            </p>
          </div>

          {loadingProgress ? (
            <div className="flex items-center justify-center rounded-3xl bg-slate-900 py-12">
              <p className="text-sm text-slate-400">Loading progress data...</p>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Progress Photos Gallery */}
              <div className="rounded-3xl border border-slate-700 bg-slate-900 p-4">
                <h3 className="mb-4 font-semibold text-white">
                  📸 Progress Photos
                </h3>
                {progressPhotos && progressPhotos.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {progressPhotos
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map((photo) => (
                        <div
                          key={photo._id}
                          className="group relative overflow-hidden rounded-2xl bg-slate-800"
                        >
                          <img
                            src={photo.photoUrl}
                            alt={`${photo.viewType} view - ${new Date(photo.date).toLocaleDateString()}`}
                            className="h-40 w-full object-cover transition group-hover:scale-105"
                          />
                          <div className="absolute inset-0 flex flex-col items-center justify-end bg-linear-to-t from-slate-950/80 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
                            <p className="text-xs text-slate-200 capitalize">
                              {photo.viewType}
                            </p>
                            <p className="text-xs text-slate-400">
                              {new Date(photo.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">
                    No progress photos yet.
                  </p>
                )}
              </div>

              {/* InBody Records - Member Uploaded */}
              <div className="rounded-3xl border border-slate-700 bg-slate-900 p-4">
                <h3 className="mb-4 font-semibold text-white">
                  📊 InBody Records (Member)
                </h3>
                {memberInBodyRecords && memberInBodyRecords.length > 0 ? (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {memberInBodyRecords
                      .filter((record) => record.uploadedBy === "member")
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map((record) => (
                        <div
                          key={record._id}
                          className="rounded-2xl border border-slate-700 bg-slate-800 p-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-white">
                                {new Date(record.date).toLocaleDateString()}
                              </p>
                              <div className="mt-2 space-y-1 text-xs text-slate-400">
                                {record.weight && (
                                  <p>
                                    <span className="text-slate-300">
                                      Weight:
                                    </span>{" "}
                                    {record.weight} kg
                                  </p>
                                )}
                                {record.fatPercentage && (
                                  <p>
                                    <span className="text-slate-300">
                                      Fat %:
                                    </span>{" "}
                                    {record.fatPercentage}%
                                  </p>
                                )}
                                {record.muscleMass && (
                                  <p>
                                    <span className="text-slate-300">
                                      Muscle Mass:
                                    </span>{" "}
                                    {record.muscleMass} kg
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className="inline-block rounded-full bg-sky-500/20 px-2 py-1 text-xs font-semibold text-sky-300">
                              Member
                            </span>
                          </div>
                          {record.fileUrl && (
                            <a
                              href={record.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-block text-xs text-sky-400 hover:text-sky-300 underline"
                            >
                              View scan
                            </a>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">
                    No InBody records uploaded yet.
                  </p>
                )}
              </div>
            </div>
          )}
        </section>
      ) : null}

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-4xl border border-slate-700 bg-slate-950 p-6 shadow-2xl shadow-slate-950/70">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  New InBody Scan
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Record the current body composition metrics for the selected
                  member.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-3xl bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-700"
              >
                Close
              </button>
            </div>
            <form className="mt-6 grid gap-4" onSubmit={handleScanSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-slate-300">
                  <span className="text-xs uppercase tracking-[0.24em] text-slate-500">
                    Scan date
                  </span>
                  <input
                    type="date"
                    value={scanData.date}
                    onChange={(e) =>
                      setScanData((current) => ({
                        ...current,
                        date: e.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-white focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  />
                </label>
                <label className="block text-sm text-slate-300">
                  <span className="text-xs uppercase tracking-[0.24em] text-slate-500">
                    Weight (kg)
                  </span>
                  <input
                    type="number"
                    value={scanData.weight}
                    onChange={(e) =>
                      setScanData((current) => ({
                        ...current,
                        weight: e.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-white focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    min="0"
                  />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-slate-300">
                  <span className="text-xs uppercase tracking-[0.24em] text-slate-500">
                    Skeletal muscle mass
                  </span>
                  <input
                    type="number"
                    value={scanData.skeletalMuscleMass}
                    onChange={(e) =>
                      setScanData((current) => ({
                        ...current,
                        skeletalMuscleMass: e.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-white focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    min="0"
                  />
                </label>
                <label className="block text-sm text-slate-300">
                  <span className="text-xs uppercase tracking-[0.24em] text-slate-500">
                    Body fat mass
                  </span>
                  <input
                    type="number"
                    value={scanData.bodyFatMass}
                    onChange={(e) =>
                      setScanData((current) => ({
                        ...current,
                        bodyFatMass: e.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-white focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    min="0"
                  />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-slate-300">
                  <span className="text-xs uppercase tracking-[0.24em] text-slate-500">
                    Body fat %
                  </span>
                  <input
                    type="number"
                    value={scanData.bodyFatPercentage}
                    onChange={(e) =>
                      setScanData((current) => ({
                        ...current,
                        bodyFatPercentage: e.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-white focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    min="0"
                    max="100"
                  />
                </label>
                <label className="block text-sm text-slate-300">
                  <span className="text-xs uppercase tracking-[0.24em] text-slate-500">
                    BMI
                  </span>
                  <input
                    type="number"
                    value={scanData.bmi}
                    onChange={(e) =>
                      setScanData((current) => ({
                        ...current,
                        bmi: e.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-white focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    min="0"
                  />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-slate-300">
                  <span className="text-xs uppercase tracking-[0.24em] text-slate-500">
                    BMR
                  </span>
                  <input
                    type="number"
                    value={scanData.bmr}
                    onChange={(e) =>
                      setScanData((current) => ({
                        ...current,
                        bmr: e.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-white focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    min="0"
                  />
                </label>
                <label className="block text-sm text-slate-300">
                  <span className="text-xs uppercase tracking-[0.24em] text-slate-500">
                    Visceral fat
                  </span>
                  <input
                    type="number"
                    value={scanData.visceralFatLevel}
                    onChange={(e) =>
                      setScanData((current) => ({
                        ...current,
                        visceralFatLevel: e.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-white focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    min="0"
                  />
                </label>
              </div>
              <div className="mt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-3xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRecord}
                  className="rounded-3xl bg-sky-500 px-6 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400 disabled:opacity-60"
                >
                  {savingRecord ? "Saving..." : "Save scan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}

import { useEffect, useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/authContextValue";

export default function WeeklyCheckIn() {
  const { user } = useAuth();

  // ============ ALL HOOKS AT TOP ============

  // Tab state
  const [activeTab, setActiveTab] = useState("checkin");

  // Weekly check-in state
  const [formData, setFormData] = useState({
    currentWeight: "",
    fatigueLevel: 5,
    notes: "",
    photos: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [myCheckIns, setMyCheckIns] = useState([]);
  const [checkInsLoading, setCheckInsLoading] = useState(true);

  // Progress photos state
  const [progressPhotos, setProgressPhotos] = useState([]);
  const [photoLoading, setPhotoLoading] = useState(true);
  const [photoError, setPhotoError] = useState("");
  const [photoSuccess, setPhotoSuccess] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [selectedViewType, setSelectedViewType] = useState("front");
  const [dragActive, setDragActive] = useState(false);

  // InBody records state
  const [inBodyRecords, setInBodyRecords] = useState([]);
  const [inBodyLoading, setInBodyLoading] = useState(true);
  const [inBodyError, setInBodyError] = useState("");
  const [inBodySuccess, setInBodySuccess] = useState(false);
  const [uploadingInBody, setUploadingInBody] = useState(false);
  const [inBodyPreview, setInBodyPreview] = useState(null);
  const [inBodyFormData, setInBodyFormData] = useState({
    weight: "",
    fatPercentage: "",
    muscleMass: "",
    fileUrl: "",
  });

  // Fetch check-ins
  useEffect(() => {
    fetchMyCheckIns();
  }, []);

  // Fetch progress photos when tab is active
  useEffect(() => {
    if (activeTab === "photos") {
      fetchProgressPhotos();
    }
  }, [activeTab]);

  // Fetch InBody records when tab is active
  useEffect(() => {
    if (activeTab === "inbody") {
      fetchInBodyRecords();
    }
  }, [activeTab]);

  // ============ CHECK-IN FUNCTIONS ============

  const fetchMyCheckIns = async () => {
    try {
      const response = await api.get("/trainee/my-checkins");
      setMyCheckIns(response.data.data || []);
    } catch (err) {
      console.error("Failed to load check-ins:", err);
    } finally {
      setCheckInsLoading(false);
    }
  };

  const handleCheckInSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const payload = {
        ...formData,
        currentWeight: Number(formData.currentWeight),
        fatigueLevel: Number(formData.fatigueLevel),
      };
      if (user?.trainerId) payload.trainerId = user.trainerId;
      await api.post("/trainee/checkin", payload);
      setSuccess(true);
      setFormData({
        currentWeight: "",
        fatigueLevel: 5,
        notes: "",
        photos: [],
      });
      fetchMyCheckIns();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to submit check-in");
    } finally {
      setLoading(false);
    }
  };

  // ============ PROGRESS PHOTOS FUNCTIONS ============

  const fetchProgressPhotos = async () => {
    setPhotoLoading(true);
    try {
      const response = await api.get("/member/progress-photos");
      setProgressPhotos(response.data.data || []);
    } catch (err) {
      setPhotoError("Failed to load progress photos");
      console.error(err);
    } finally {
      setPhotoLoading(false);
    }
  };

  const handlePhotoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      setPhotoPreview(preview);
    }
  };

  const handlePhotoDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handlePhotoDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      setPhotoPreview(preview);
    }
  };

  const handleUploadProgressPhoto = async () => {
    if (!photoPreview) {
      setPhotoError("Please select a photo");
      return;
    }

    setUploadingPhoto(true);
    setPhotoError("");
    setPhotoSuccess(false);

    try {
      await api.post("/member/progress-photos", {
        photoUrl: photoPreview,
        viewType: selectedViewType,
      });

      setPhotoSuccess(true);
      setPhotoPreview(null);
      setSelectedViewType("front");
      await fetchProgressPhotos();
    } catch (err) {
      setPhotoError(err?.response?.data?.message || "Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeleteProgressPhoto = async (photoId) => {
    try {
      await api.delete(`/member/progress-photos/${photoId}`);
      await fetchProgressPhotos();
    } catch (err) {
      setPhotoError("Failed to delete photo");
    }
  };

  // ============ INBODY FUNCTIONS ============

  const fetchInBodyRecords = async () => {
    setInBodyLoading(true);
    try {
      const response = await api.get("/member/inbody-records");
      setInBodyRecords(response.data.data || []);
    } catch (err) {
      setInBodyError("Failed to load InBody records");
      console.error(err);
    } finally {
      setInBodyLoading(false);
    }
  };

  const handleInBodyFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      setInBodyPreview(preview);
    }
  };

  const handleUploadInBodyRecord = async (e) => {
    e.preventDefault();
    setUploadingInBody(true);
    setInBodyError("");
    setInBodySuccess(false);

    try {
      await api.post("/member/inbody-records", {
        weight: Number(inBodyFormData.weight),
        fatPercentage: inBodyFormData.fatPercentage
          ? Number(inBodyFormData.fatPercentage)
          : null,
        muscleMass: inBodyFormData.muscleMass
          ? Number(inBodyFormData.muscleMass)
          : null,
        fileUrl: inBodyPreview || inBodyFormData.fileUrl,
      });

      setInBodySuccess(true);
      setInBodyFormData({
        weight: "",
        fatPercentage: "",
        muscleMass: "",
        fileUrl: "",
      });
      setInBodyPreview(null);
      await fetchInBodyRecords();
    } catch (err) {
      setInBodyError(err?.response?.data?.message || "Failed to upload record");
    } finally {
      setUploadingInBody(false);
    }
  };

  // ============ RENDER ============

  return (
    <main className="space-y-8 p-6 lg:p-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">
          Transformation & Progress
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Your Progress Tracker
        </h1>
        <p className="mt-2 text-slate-600">
          Upload your photos, InBody scans, and track your transformation
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("checkin")}
          className={`px-4 py-3 text-sm font-semibold transition ${
            activeTab === "checkin"
              ? "border-b-2 border-slate-950 text-slate-950"
              : "text-slate-600 hover:text-slate-950"
          }`}
        >
          📋 Weekly Check-in
        </button>
        <button
          onClick={() => setActiveTab("photos")}
          className={`px-4 py-3 text-sm font-semibold transition ${
            activeTab === "photos"
              ? "border-b-2 border-slate-950 text-slate-950"
              : "text-slate-600 hover:text-slate-950"
          }`}
        >
          📸 Progress Photos
        </button>
        <button
          onClick={() => setActiveTab("inbody")}
          className={`px-4 py-3 text-sm font-semibold transition ${
            activeTab === "inbody"
              ? "border-b-2 border-slate-950 text-slate-950"
              : "text-slate-600 hover:text-slate-950"
          }`}
        >
          📊 InBody Scans
        </button>
      </div>

      {/* Weekly Check-in Tab */}
      {activeTab === "checkin" && (
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Check-in Form */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm backdrop-blur-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Submit This Week's Check-in
            </h2>
            <form onSubmit={handleCheckInSubmit} className="mt-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Current Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.currentWeight}
                  onChange={(e) =>
                    setFormData({ ...formData, currentWeight: e.target.value })
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  placeholder="75.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Fatigue Level (1-10)
                </label>
                <div className="mt-2 flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.fatigueLevel}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fatigueLevel: e.target.value,
                      })
                    }
                    className="flex-1"
                  />
                  <span className="text-2xl font-semibold text-slate-900">
                    {formData.fatigueLevel}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  1 = Very Fresh, 10 = Extremely Exhausted
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Notes for Trainer
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={4}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  placeholder="How are you feeling? Any challenges or achievements?"
                />
              </div>

              {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  ✓ Check-in submitted successfully!
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {loading ? "Submitting..." : "Submit Check-in"}
              </button>
            </form>
          </div>

          {/* Check-in History */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm backdrop-blur-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Your Check-in History
            </h2>
            {checkInsLoading ? (
              <div className="mt-4 text-sm text-slate-600">Loading...</div>
            ) : myCheckIns.length > 0 ? (
              <div className="mt-4 space-y-4">
                {myCheckIns.map((checkIn) => (
                  <div
                    key={checkIn._id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Week {checkIn.weekNumber}, {checkIn.year}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(checkIn.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          checkIn.trainerFeedback
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {checkIn.trainerFeedback ? "Reviewed" : "Pending"}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500">Weight</p>
                        <p className="font-semibold text-slate-900">
                          {checkIn.currentWeight || "-"} kg
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Fatigue</p>
                        <p className="font-semibold text-slate-900">
                          {checkIn.fatigueLevel}/10
                        </p>
                      </div>
                    </div>
                    {checkIn.notes && (
                      <div className="mt-3">
                        <p className="text-xs text-slate-500">Notes</p>
                        <p className="text-sm text-slate-700">
                          {checkIn.notes}
                        </p>
                      </div>
                    )}
                    {checkIn.trainerFeedback && (
                      <div className="mt-3 rounded-2xl bg-emerald-50 p-3">
                        <p className="text-xs font-semibold text-emerald-700">
                          Trainer Feedback
                        </p>
                        <p className="mt-1 text-sm text-emerald-900">
                          {checkIn.trainerFeedback}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 text-sm text-slate-500">
                No check-ins submitted yet
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress Photos Tab */}
      {activeTab === "photos" && (
        <div className="space-y-8">
          {/* Upload Section */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm backdrop-blur-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Upload Progress Photos
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Track your body transformation with front, back, or side photos
            </p>

            <form className="mt-6 space-y-6">
              {/* Drag and Drop Zone */}
              <div
                onDragEnter={handlePhotoDrag}
                onDragLeave={handlePhotoDrag}
                onDragOver={handlePhotoDrag}
                onDrop={handlePhotoDrop}
                className={`relative rounded-3xl border-2 border-dashed px-8 py-12 text-center transition ${
                  dragActive
                    ? "border-sky-500 bg-sky-50"
                    : "border-slate-300 bg-slate-50 hover:border-slate-400"
                }`}
              >
                {photoPreview ? (
                  <div className="space-y-4">
                    <div className="relative aspect-square max-w-xs mx-auto overflow-hidden rounded-2xl">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <p className="text-sm font-medium text-slate-900">
                      Preview ready to upload
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-4xl">📸</p>
                    <p className="text-sm font-semibold text-slate-900">
                      Drop your photo here or click to select
                    </p>
                    <p className="text-xs text-slate-600">
                      PNG, JPG up to 10MB
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoFileChange}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  disabled={uploadingPhoto}
                />
              </div>

              {/* View Type Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Photo View Type
                </label>
                <div className="mt-3 grid grid-cols-4 gap-3">
                  {["front", "back", "side", "other"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedViewType(type)}
                      className={`rounded-2xl px-4 py-3 text-xs font-semibold transition ${
                        selectedViewType === type
                          ? "bg-slate-950 text-white"
                          : "border border-slate-200 bg-white text-slate-900 hover:border-slate-300"
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {photoError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {photoError}
                </div>
              )}

              {photoSuccess && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  ✓ Photo uploaded successfully!
                </div>
              )}

              <button
                type="button"
                onClick={handleUploadProgressPhoto}
                disabled={uploadingPhoto || !photoPreview}
                className="w-full rounded-full bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {uploadingPhoto ? "Uploading..." : "Upload Photo"}
              </button>
            </form>
          </div>

          {/* Photos Gallery */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm backdrop-blur-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Your Progress Gallery
            </h2>

            {photoLoading ? (
              <div className="mt-4 text-sm text-slate-600">Loading...</div>
            ) : progressPhotos.length > 0 ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {progressPhotos.map((photo) => (
                  <div
                    key={photo._id}
                    className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm transition hover:shadow-md"
                  >
                    <div className="aspect-square overflow-hidden bg-slate-100">
                      <img
                        src={photo.photoUrl}
                        alt={photo.viewType}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    </div>
                    <div className="absolute inset-0 bg-linear-to-t from-slate-950/80 to-transparent opacity-0 transition group-hover:opacity-100" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 transition group-hover:opacity-100">
                      <p className="text-xs font-semibold uppercase text-sky-200">
                        {photo.viewType}
                      </p>
                      <p className="text-xs text-slate-300">
                        {new Date(photo.date).toLocaleDateString()}
                      </p>
                      <button
                        onClick={() => handleDeleteProgressPhoto(photo._id)}
                        className="mt-2 w-full rounded-lg bg-rose-500 px-2 py-1 text-xs font-semibold text-white transition hover:bg-rose-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 text-sm text-slate-500">
                No photos uploaded yet. Start your transformation journey!
              </div>
            )}
          </div>
        </div>
      )}

      {/* InBody Scans Tab */}
      {activeTab === "inbody" && (
        <div className="space-y-8">
          {/* Upload Section */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm backdrop-blur-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Upload InBody Scan
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Track your body composition metrics
            </p>

            <form
              onSubmit={handleUploadInBodyRecord}
              className="mt-6 space-y-6"
            >
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={inBodyFormData.weight}
                    onChange={(e) =>
                      setInBodyFormData({
                        ...inBodyFormData,
                        weight: e.target.value,
                      })
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    placeholder="75.5"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Fat % (optional)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={inBodyFormData.fatPercentage}
                    onChange={(e) =>
                      setInBodyFormData({
                        ...inBodyFormData,
                        fatPercentage: e.target.value,
                      })
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    placeholder="25.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Muscle Mass (kg, optional)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={inBodyFormData.muscleMass}
                    onChange={(e) =>
                      setInBodyFormData({
                        ...inBodyFormData,
                        muscleMass: e.target.value,
                      })
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    placeholder="55.0"
                  />
                </div>
              </div>

              {/* File Upload for Scan Image */}
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Upload Scan Image (optional)
                </label>
                <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  {inBodyPreview ? (
                    <div className="space-y-3">
                      <div className="relative aspect-video max-w-xs overflow-hidden rounded-lg">
                        <img
                          src={inBodyPreview}
                          alt="InBody Preview"
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setInBodyPreview(null)}
                        className="text-sm font-medium text-sky-600 hover:text-sky-700"
                      >
                        Change image
                      </button>
                    </div>
                  ) : (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleInBodyFileChange}
                      className="w-full"
                    />
                  )}
                </div>
              </div>

              {inBodyError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {inBodyError}
                </div>
              )}

              {inBodySuccess && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  ✓ InBody record uploaded successfully!
                </div>
              )}

              <button
                type="submit"
                disabled={uploadingInBody || !inBodyFormData.weight}
                className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {uploadingInBody ? "Uploading..." : "Save InBody Record"}
              </button>
            </form>
          </div>

          {/* Records History */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm backdrop-blur-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Your InBody Records
            </h2>

            {inBodyLoading ? (
              <div className="mt-4 text-sm text-slate-600">Loading...</div>
            ) : inBodyRecords.length > 0 ? (
              <div className="mt-6 space-y-3">
                {inBodyRecords
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((record, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {new Date(record.date).toLocaleDateString()}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-4 text-xs">
                          <div>
                            <p className="text-slate-600">Weight</p>
                            <p className="font-semibold text-slate-900">
                              {record.weight} kg
                            </p>
                          </div>
                          {record.fatPercentage && (
                            <div>
                              <p className="text-slate-600">Fat %</p>
                              <p className="font-semibold text-slate-900">
                                {record.fatPercentage}%
                              </p>
                            </div>
                          )}
                          {record.muscleMass && (
                            <div>
                              <p className="text-slate-600">Muscle Mass</p>
                              <p className="font-semibold text-slate-900">
                                {record.muscleMass} kg
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                        {record.uploadedBy === "member"
                          ? "Member Upload"
                          : "Trainer Entry"}
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="mt-4 text-sm text-slate-500">
                No InBody records yet. Add your first scan!
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

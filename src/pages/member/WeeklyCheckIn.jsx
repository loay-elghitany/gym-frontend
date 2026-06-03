import { useEffect, useState } from "react";
import api from "../../api/axios";
import DeleteConfirmationModal from "../../components/DeleteConfirmationModal";
import { uploadToCloudinary } from "../../utils/cloudinaryUpload";
import { useAuth } from "../../context/authContextValue";

export default function WeeklyCheckIn() {
  const { user } = useAuth();

  // ============ ALL HOOKS AT TOP ============

  // Wizard step state (1 = Metrics, 2 = Photos, 3 = InBody)
  const [currentStep, setCurrentStep] = useState(1);

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
  const [photoFile, setPhotoFile] = useState(null);
  const [selectedViewType, setSelectedViewType] = useState("front");
  const [dragActive, setDragActive] = useState(false);

  // InBody records state
  const [inBodyRecords, setInBodyRecords] = useState([]);
  const [inBodyLoading, setInBodyLoading] = useState(true);
  const [inBodyError, setInBodyError] = useState("");
  const [inBodySuccess, setInBodySuccess] = useState(false);
  const [uploadingInBody, setUploadingInBody] = useState(false);
  const [inBodyPreview, setInBodyPreview] = useState(null);
  const [inBodyFile, setInBodyFile] = useState(null);
  const [inBodyFormData, setInBodyFormData] = useState({
    weight: "",
    fatPercentage: "",
    muscleMass: "",
    fileUrl: "",
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteKind, setDeleteKind] = useState(null); // 'photo' or 'inbody'

  // Load user's data on mount
  useEffect(() => {
    fetchMyCheckIns();
    fetchProgressPhotos();
    fetchInBodyRecords();
  }, []);

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

  // New unified submit: uploads images, composes payload, sends single POST
  const handleSubmitAll = async (e) => {
    e?.preventDefault?.();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      // 1) Upload any selected photo files and inBody file
      const photoUploads = [];
      // progressPhotosToUpload is an array of { file, preview, viewType }
      if (progressPhotosToUpload && progressPhotosToUpload.length) {
        for (const p of progressPhotosToUpload) {
          if (p.file) {
            const url = await uploadToCloudinary(p.file);
            photoUploads.push({ url, viewType: p.viewType || "front" });
          } else if (p.preview) {
            // preview may be a data URL: upload not possible, skip
            photoUploads.push({
              url: p.preview,
              viewType: p.viewType || "front",
            });
          }
        }
      }

      let inBodyFileUrl = inBodyFormData.fileUrl || null;
      if (inBodyFile) {
        inBodyFileUrl = await uploadToCloudinary(inBodyFile);
      }

      // 2) Compose unified payload
      const payload = {
        currentWeight: formData.currentWeight
          ? Number(formData.currentWeight)
          : undefined,
        fatigueLevel: formData.fatigueLevel
          ? Number(formData.fatigueLevel)
          : undefined,
        notes: formData.notes || undefined,
        photos: photoUploads.map((p) => ({ url: p.url, viewType: p.viewType })),
        inBody: inBodyFormData.weight
          ? {
              weight: Number(inBodyFormData.weight),
              fatPercentage: inBodyFormData.fatPercentage
                ? Number(inBodyFormData.fatPercentage)
                : undefined,
              muscleMass: inBodyFormData.muscleMass
                ? Number(inBodyFormData.muscleMass)
                : undefined,
              fileUrl: inBodyFileUrl,
            }
          : undefined,
      };
      if (user?.trainerId) payload.trainerId = user.trainerId;

      // 3) Send single POST
      await api.post("/trainee/checkin", payload);

      setSuccess(true);
      // reset wizard state and refresh member progress
      setCurrentStep(1);
      setFormData({
        currentWeight: "",
        fatigueLevel: 5,
        notes: "",
        photos: [],
      });
      setProgressPhotosToUpload([]);
      setInBodyFormData({
        weight: "",
        fatPercentage: "",
        muscleMass: "",
        fileUrl: "",
      });
      setInBodyFile(null);
      setInBodyPreview(null);
      await fetchMyCheckIns();
      await fetchProgressPhotos();
      await fetchInBodyRecords();
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to submit check-in",
      );
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
      setPhotoFile(file);
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
      setPhotoFile(file);
    }
  };

  // Queue for photos to be uploaded with the unified submit
  const [progressPhotosToUpload, setProgressPhotosToUpload] = useState([]);

  const handleAddPhotoToQueue = (file) => {
    if (!file) return;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const preview = URL.createObjectURL(file);
    setProgressPhotosToUpload((cur) => [
      ...cur,
      { id, file, preview, viewType: "front" },
    ]);
  };

  const updateQueuedPhotoViewType = (id, viewType) => {
    setProgressPhotosToUpload((cur) =>
      cur.map((p) => (p.id === id ? { ...p, viewType } : p)),
    );
  };

  const handleRemoveQueuedPhoto = (id) => {
    setProgressPhotosToUpload((cur) => cur.filter((p) => p.id !== id));
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
      // If a local file is selected, upload to Cloudinary first
      let urlToSend = photoPreview;
      if (photoFile) {
        urlToSend = await uploadToCloudinary(photoFile);
      }

      await api.post("/member/progress-photos", {
        photoUrl: urlToSend,
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
      setPhotoFile(null);
    }
  };

  const handleDeleteProgressPhoto = (photoId) => {
    setDeleteTarget(photoId);
    setDeleteKind("photo");
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !deleteKind) return setDeleteModalOpen(false);
    const target = deleteTarget;
    const kind = deleteKind;
    setDeleteModalOpen(false);

    if (kind === "photo") {
      // optimistic UI
      const prev = progressPhotos;
      setProgressPhotos((cur) => cur.filter((p) => p._id !== target));
      try {
        await api.delete(`/member/progress-photos/${target}`);
      } catch (err) {
        setPhotoError("Failed to delete photo");
        setProgressPhotos(prev);
      }
    }

    if (kind === "inbody") {
      const prev = inBodyRecords;
      setInBodyRecords((cur) =>
        cur.filter((r) => String(r._id) !== String(target)),
      );
      try {
        await api.delete(`/member/inbody-records/${target}`);
      } catch (err) {
        setInBodyError("Failed to delete record");
        setInBodyRecords(prev);
      }
    }

    setDeleteTarget(null);
    setDeleteKind(null);
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
      setInBodyFile(file);
    }
  };

  const handleUploadInBodyRecord = async (e) => {
    e.preventDefault();
    setUploadingInBody(true);
    setInBodyError("");
    setInBodySuccess(false);

    try {
      let fileUrlToSend = inBodyFormData.fileUrl || null;
      if (inBodyFile) {
        fileUrlToSend = await uploadToCloudinary(inBodyFile);
      }

      await api.post("/member/inbody-records", {
        weight: Number(inBodyFormData.weight),
        fatPercentage: inBodyFormData.fatPercentage
          ? Number(inBodyFormData.fatPercentage)
          : null,
        muscleMass: inBodyFormData.muscleMass
          ? Number(inBodyFormData.muscleMass)
          : null,
        fileUrl: fileUrlToSend,
      });

      setInBodySuccess(true);
      setInBodyFormData({
        weight: "",
        fatPercentage: "",
        muscleMass: "",
        fileUrl: "",
      });
      setInBodyPreview(null);
      setInBodyFile(null);
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

      {/* Unified 3-step Wizard */}
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Weekly Check-in Wizard
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Complete the three steps and submit once.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`px-3 py-2 rounded-full text-sm font-semibold ${currentStep === 1 ? "bg-sky-500 text-slate-950" : "bg-slate-50 text-slate-600"}`}
                >
                  1
                </div>
                <div
                  className={`px-3 py-2 rounded-full text-sm font-semibold ${currentStep === 2 ? "bg-sky-500 text-slate-950" : "bg-slate-50 text-slate-600"}`}
                >
                  2
                </div>
                <div
                  className={`px-3 py-2 rounded-full text-sm font-semibold ${currentStep === 3 ? "bg-sky-500 text-slate-950" : "bg-slate-50 text-slate-600"}`}
                >
                  3
                </div>
              </div>
            </div>

            <div className="mt-6">
              {/* Step 1: Metrics */}
              {currentStep === 1 && (
                <form className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Current Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.currentWeight}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          currentWeight: e.target.value,
                        })
                      }
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-sky-500"
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
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-sky-500"
                      placeholder="How are you feeling? Any challenges or achievements?"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="rounded-3xl bg-sky-500 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400"
                    >
                      Next: Photos
                    </button>
                  </div>
                </form>
              )}

              {/* Step 2: Photos */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Upload Progress Photos
                    </label>
                    <p className="mt-1 text-sm text-slate-600">
                      Drag & drop or click to add multiple photos. Local
                      previews shown instantly.
                    </p>
                  </div>

                  <div
                    onDragEnter={handlePhotoDrag}
                    onDragLeave={handlePhotoDrag}
                    onDragOver={handlePhotoDrag}
                    onDrop={(e) => {
                      handlePhotoDrop(e);
                      if (e.dataTransfer.files?.[0])
                        handleAddPhotoToQueue(e.dataTransfer.files[0]);
                    }}
                    className={`relative rounded-3xl border-2 border-dashed px-4 py-10 text-center transition ${dragActive ? "border-sky-500 bg-sky-50" : "border-slate-300 bg-slate-50 hover:border-slate-400"}`}
                  >
                    <p className="text-4xl">📸</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      Drop photos here or click to select
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        Array.from(e.target.files || []).forEach((f) =>
                          handleAddPhotoToQueue(f),
                        );
                      }}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {progressPhotosToUpload && progressPhotosToUpload.length ? (
                      progressPhotosToUpload.map((p) => (
                        <div
                          key={p.id}
                          className="relative overflow-hidden rounded-2xl bg-slate-50"
                        >
                          <div className="aspect-square overflow-hidden">
                            <img
                              src={p.preview}
                              alt="preview"
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="p-2">
                            <select
                              value={p.viewType}
                              onChange={(e) =>
                                updateQueuedPhotoViewType(p.id, e.target.value)
                              }
                              className="mt-2 w-full rounded-xl border border-slate-200 px-2 py-1 text-sm"
                            >
                              <option value="front">Front</option>
                              <option value="back">Back</option>
                              <option value="side">Side</option>
                              <option value="other">Other</option>
                            </select>
                            <button
                              onClick={() => handleRemoveQueuedPhoto(p.id)}
                              className="mt-2 w-full rounded-lg bg-rose-500 px-2 py-1 text-xs font-semibold text-white"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-slate-500">
                        No new photos selected
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="rounded-3xl border border-slate-200 px-5 py-2 text-sm font-semibold"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="rounded-3xl bg-sky-500 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400"
                    >
                      Next: InBody
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: InBody */}
              {currentStep === 3 && (
                <form className="space-y-6" onSubmit={handleSubmitAll}>
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
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900"
                        placeholder="75.5"
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
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900"
                        placeholder="25.5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">
                        Muscle Mass (kg)
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
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900"
                        placeholder="55.0"
                      />
                    </div>
                  </div>

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
                            onClick={() => {
                              setInBodyPreview(null);
                              setInBodyFile(null);
                            }}
                            className="text-sm font-medium text-sky-600"
                          >
                            Change image
                          </button>
                        </div>
                      ) : (
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            handleInBodyFileChange(e);
                          }}
                          className="w-full"
                        />
                      )}
                    </div>
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

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="rounded-3xl border border-slate-200 px-5 py-2 text-sm font-semibold"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="rounded-3xl bg-sky-500 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400"
                    >
                      {loading ? "Submitting..." : "Submit All"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Check-in History */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
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
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${checkIn.trainerFeedback ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
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

        {/* Right column: Gallery & InBody records */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Your Progress Gallery
            </h2>
            {photoLoading ? (
              <div className="mt-4 text-sm text-slate-600">Loading...</div>
            ) : progressPhotos.length > 0 ? (
              <div className="mt-4 grid gap-3 grid-cols-2">
                {progressPhotos.map((photo) => (
                  <div
                    key={photo._id}
                    className="overflow-hidden rounded-2xl bg-slate-50"
                  >
                    <img
                      src={photo.photoUrl}
                      alt={photo.viewType}
                      className="h-40 w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 text-sm text-slate-500">
                No photos uploaded yet.
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Your InBody Records
            </h2>
            {inBodyLoading ? (
              <div className="mt-4 text-sm text-slate-600">Loading...</div>
            ) : inBodyRecords.length > 0 ? (
              <div className="mt-4 space-y-3">
                {inBodyRecords
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((record) => (
                    <div
                      key={record._id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <p className="text-sm font-semibold text-slate-900">
                        {new Date(record.date).toLocaleDateString()}
                      </p>
                      <div className="mt-2 text-xs text-slate-700">
                        Weight: {record.weight || "-"} kg{" "}
                        {record.fatPercentage
                          ? ` • Fat: ${record.fatPercentage}%`
                          : ""}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="mt-4 text-sm text-slate-500">
                No InBody records yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

import { useEffect, useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/authContextValue";
import { detectTenantFromLocation } from "../../utils/tenantUtils";
import { uploadToCloudinary } from "../../utils/cloudinaryUpload";

const defaultConfig = {
  heroTitle: "",
  heroSubtitle: "",
  aboutText: "",
  themeColor: "#2563eb",
  logoUrl: "",
  coverUrl: "",
  galleryUrls: [],
  trainers: [],
  facebookUrl: "",
  instagramUrl: "",
  whatsappNumber: "",
  isActive: false,
};

export default function LandingPageBuilder() {
  const { tenant } = useAuth();
  const [config, setConfig] = useState(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState({
    logo: false,
    cover: false,
    gallery: false,
    trainer: false,
  });
  const [previews, setPreviews] = useState({ logo: null, cover: null });
  const [editingTrainerIndex, setEditingTrainerIndex] = useState(null);
  const [trainerForm, setTrainerForm] = useState({
    id: "",
    name: "",
    specialty: "",
    bio: "",
    imageUrl: "",
  });

  const currentTenantSlug =
    tenant?.slug || detectTenantFromLocation(window.location)?.slug || null;

  useEffect(() => {
    let isMounted = true;

    const loadCurrentConfig = async () => {
      if (!currentTenantSlug) {
        setLoading(false);
        setError("Tenant context is not available.");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await api.get(`/landing/${currentTenantSlug}`);
        const payload = response?.data?.data;

        if (!isMounted) {
          return;
        }

        // Explicitly map trainers from the API response
        const trainersFromResponse = Array.isArray(
          payload?.landingPageConfig?.trainers,
        )
          ? payload.landingPageConfig.trainers
          : [];

        setConfig({
          heroTitle: payload?.landingPageConfig?.heroTitle || "",
          heroSubtitle: payload?.landingPageConfig?.heroSubtitle || "",
          aboutText: payload?.landingPageConfig?.aboutText || "",
          themeColor: payload?.landingPageConfig?.themeColor || "#2563eb",
          logoUrl: payload?.landingPageConfig?.logoUrl || "",
          coverUrl: payload?.landingPageConfig?.coverUrl || "",
          galleryUrls: Array.isArray(payload?.landingPageConfig?.galleryUrls)
            ? payload.landingPageConfig.galleryUrls
            : [],
          trainers: trainersFromResponse,
          facebookUrl: payload?.landingPageConfig?.facebookUrl || "",
          instagramUrl: payload?.landingPageConfig?.instagramUrl || "",
          whatsappNumber: payload?.landingPageConfig?.whatsappNumber || "",
          isActive: Boolean(payload?.landingPageConfig?.isActive),
        });
      } catch (err) {
        if (!isMounted) {
          return;
        }
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load current landing page settings.",
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadCurrentConfig();

    return () => {
      isMounted = false;
    };
  }, [currentTenantSlug]);

  const updateField = (field, value) => {
    setConfig((previous) => ({
      ...previous,
      [field]: value,
    }));
    setStatus("");
    setError("");
  };

  const handleUpload = async (field, file) => {
    if (!file) {
      return;
    }

    const uploadKey = field === "coverUrl" ? "cover" : "logo";

    setUploading((previous) => ({ ...previous, [uploadKey]: true }));
    setError("");

    try {
      const url = await uploadToCloudinary(file);
      updateField(field, url);
      setStatus(
        `${uploadKey === "cover" ? "Hero cover" : "Logo"} uploaded successfully.`,
      );
    } catch (err) {
      setError(err?.message || "Upload failed.");
    } finally {
      setUploading((previous) => ({ ...previous, [uploadKey]: false }));
    }
  };

  const handleFileSelected = (field, file) => {
    if (!file) return;
    const key = field === "coverUrl" ? "cover" : "logo";
    try {
      const objectUrl = URL.createObjectURL(file);
      setPreviews((p) => ({ ...p, [key]: objectUrl }));
    } catch (err) {
      // ignore URL creation errors
    }
    // start upload (this will replace preview with official URL when done)
    handleUpload(field, file);
  };

  // Revoke object URLs when component unmounts
  useEffect(() => {
    return () => {
      try {
        if (previews.logo) URL.revokeObjectURL(previews.logo);
        if (previews.cover) URL.revokeObjectURL(previews.cover);
      } catch (err) {
        // noop
      }
    };
  }, [previews]);

  const handleGalleryUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploading((previous) => ({ ...previous, gallery: true }));
    setError("");

    try {
      const url = await uploadToCloudinary(file);
      setConfig((previous) => ({
        ...previous,
        galleryUrls: [...previous.galleryUrls, url],
      }));
      setStatus("Gallery image added successfully.");
    } catch (err) {
      setError(err?.message || "Upload failed.");
    } finally {
      setUploading((previous) => ({ ...previous, gallery: false }));
      event.target.value = "";
    }
  };

  const handleGalleryDrop = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    setUploading((previous) => ({ ...previous, gallery: true }));
    setError("");

    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const previewUrl = URL.createObjectURL(file);
        setConfig((previous) => ({
          ...previous,
          galleryUrls: [...previous.galleryUrls, previewUrl],
        }));
        const url = await uploadToCloudinary(file);
        setConfig((previous) => ({
          ...previous,
          galleryUrls: previous.galleryUrls.map((u) =>
            u === previewUrl ? url : u,
          ),
        }));
      }
      setStatus("Gallery images added successfully.");
    } catch (err) {
      setError(err?.message || "Upload failed.");
    } finally {
      setUploading((previous) => ({ ...previous, gallery: false }));
    }
  };

  const handleAddTrainer = () => {
    if (!trainerForm.name.trim()) {
      setError("Trainer name is required.");
      return;
    }
    if (editingTrainerIndex !== null) {
      // Update existing trainer
      const updatedTrainers = [...config.trainers];
      updatedTrainers[editingTrainerIndex] = {
        ...trainerForm,
        id: trainerForm.id || `trainer-${Date.now()}`,
      };
      setConfig((prev) => ({ ...prev, trainers: updatedTrainers }));
      setEditingTrainerIndex(null);
      setStatus("Trainer updated successfully.");
    } else {
      // Add new trainer
      const newTrainer = {
        ...trainerForm,
        id: trainerForm.id || `trainer-${Date.now()}`,
      };
      setConfig((prev) => ({
        ...prev,
        trainers: [...prev.trainers, newTrainer],
      }));
      setStatus("Trainer added successfully.");
    }
    setTrainerForm({ id: "", name: "", specialty: "", bio: "", imageUrl: "" });
    setError("");
  };

  const handleEditTrainer = (index) => {
    setTrainerForm(config.trainers[index]);
    setEditingTrainerIndex(index);
  };

  const handleRemoveTrainer = (index) => {
    setConfig((prev) => ({
      ...prev,
      trainers: prev.trainers.filter((_, i) => i !== index),
    }));
    setStatus("Trainer removed successfully.");
  };

  const handleCancelEditTrainer = () => {
    setTrainerForm({ id: "", name: "", specialty: "", bio: "", imageUrl: "" });
    setEditingTrainerIndex(null);
  };

  const handleTrainerImageUpload = async (file) => {
    if (!file) return;
    setUploading((prev) => ({ ...prev, trainer: true }));
    setError("");
    try {
      const url = await uploadToCloudinary(file);
      setTrainerForm((prev) => ({ ...prev, imageUrl: url }));
      setStatus("Trainer image uploaded successfully.");
    } catch (err) {
      setError(err?.message || "Failed to upload trainer image.");
    } finally {
      setUploading((prev) => ({ ...prev, trainer: false }));
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setStatus("");

    try {
      // Prepare the request payload with explicit trainers array
      const requestPayload = {
        heroTitle: config.heroTitle,
        heroSubtitle: config.heroSubtitle,
        aboutText: config.aboutText,
        themeColor: config.themeColor,
        logoUrl: config.logoUrl,
        coverUrl: config.coverUrl,
        galleryUrls: config.galleryUrls.filter(Boolean),
        trainers: Array.isArray(config.trainers)
          ? config.trainers.filter((t) => t.name && t.name.trim())
          : [],
        facebookUrl: config.facebookUrl,
        instagramUrl: config.instagramUrl,
        whatsappNumber: config.whatsappNumber,
        isActive: config.isActive,
      };

      const response = await api.put("/gym/landing-config", requestPayload);

      setStatus("Landing page updated successfully.");

      // Extract trainers from response with explicit fallback to current config
      const responseTrainers = Array.isArray(response?.data?.data?.trainers)
        ? response.data.data.trainers
        : config.trainers;

      setConfig({
        heroTitle: response?.data?.data?.heroTitle || config.heroTitle,
        heroSubtitle: response?.data?.data?.heroSubtitle || config.heroSubtitle,
        aboutText: response?.data?.data?.aboutText || config.aboutText,
        themeColor: response?.data?.data?.themeColor || config.themeColor,
        logoUrl: response?.data?.data?.logoUrl || config.logoUrl,
        coverUrl: response?.data?.data?.coverUrl || config.coverUrl,
        galleryUrls: Array.isArray(response?.data?.data?.galleryUrls)
          ? response.data.data.galleryUrls
          : config.galleryUrls,
        trainers: responseTrainers,
        facebookUrl: response?.data?.data?.facebookUrl || config.facebookUrl,
        instagramUrl: response?.data?.data?.instagramUrl || config.instagramUrl,
        whatsappNumber:
          response?.data?.data?.whatsappNumber || config.whatsappNumber,
        isActive: Boolean(response?.data?.data?.isActive),
      });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to save landing page settings.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row">
      {/* Left Panel - Settings */}
      <div className="w-full lg:w-[55%] overflow-y-auto scrollbar-hide">
        <div className="p-6 lg:p-8">
          {/* Page Header */}
          <div className="mb-8 space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">
              Landing Page Builder
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Make your gym storefront unforgettable
            </h1>
            <p className="text-base leading-8 text-slate-600">
              Design a polished public landing page, connect your social
              profile, and publish it instantly for your subdomain visitors.
            </p>
          </div>

          {/* Sticky Action Bar */}
          <div className="sticky top-0 z-10 mb-6 bg-white/80 backdrop-blur-md pb-4 pt-2 border-b border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
                  config.isActive
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {config.isActive
                  ? "Public page enabled"
                  : "Public page disabled"}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={config.isActive}
                onClick={() => updateField("isActive", !config.isActive)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
                  config.isActive ? "bg-sky-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                    config.isActive ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* General Section */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950 mb-6">
                General
              </h2>
              <div className="grid gap-6 lg:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Hero title
                  <input
                    value={config.heroTitle}
                    onChange={(event) =>
                      updateField("heroTitle", event.target.value)
                    }
                    placeholder="Train harder. Stay motivated."
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500"
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Theme color
                  <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                    <input
                      type="color"
                      value={config.themeColor}
                      onChange={(event) =>
                        updateField("themeColor", event.target.value)
                      }
                      className="h-10 w-10 rounded-lg border-0 bg-transparent"
                    />
                    <span className="text-sm text-slate-600">
                      {config.themeColor}
                    </span>
                  </div>
                </label>
              </div>

              <label className="mt-6 block text-sm font-medium text-slate-700">
                Hero subtitle
                <textarea
                  value={config.heroSubtitle}
                  onChange={(event) =>
                    updateField("heroSubtitle", event.target.value)
                  }
                  rows={4}
                  placeholder="Highlight your coaching style, classes, and community."
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500"
                />
              </label>

              <label className="mt-6 block text-sm font-medium text-slate-700">
                About text
                <textarea
                  value={config.aboutText}
                  onChange={(event) =>
                    updateField("aboutText", event.target.value)
                  }
                  rows={5}
                  placeholder="Describe your facilities, coaching philosophy, and community vibe."
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500"
                />
              </label>
            </div>

            {/* Media Section */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950 mb-2">
                Media
              </h2>
              <p className="text-sm text-slate-600 mb-6">
                Upload your logo, hero cover, and gallery images to Cloudinary.
              </p>

              <div className="grid gap-4 lg:grid-cols-2">
                <div
                  className="rounded-2xl bg-slate-50 p-4"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer?.files?.[0];
                    if (file) handleFileSelected("logoUrl", file);
                  }}
                >
                  <p className="text-sm font-semibold text-slate-900">Logo</p>
                  {previews.logo || config.logoUrl ? (
                    <img
                      src={previews.logo || config.logoUrl}
                      alt="Logo preview"
                      className="mt-3 h-20 w-auto rounded-xl object-contain"
                    />
                  ) : (
                    <div className="mt-3 flex items-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-white/20 p-6">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-slate-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16V4m0 0L3 8m4-4 4 4M17 8v8a4 4 0 01-4 4H7"
                        />
                      </svg>
                      <div className="text-sm text-slate-600">
                        Drag & drop logo here, or click to browse
                      </div>
                    </div>
                  )}
                  <label className="mt-3 block">
                    <span className="sr-only">Upload logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) =>
                        handleFileSelected("logoUrl", event.target.files?.[0])
                      }
                      className="block w-full text-sm text-slate-600 sr-only"
                    />
                    <div className="mt-3 cursor-pointer text-sm text-slate-600">
                      Click to upload
                    </div>
                  </label>
                  {uploading.logo ? (
                    <p className="mt-3 text-sm text-slate-500">
                      Uploading logo...
                    </p>
                  ) : null}
                </div>

                <div
                  className="rounded-2xl bg-slate-50 p-4"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer?.files?.[0];
                    if (file) handleFileSelected("coverUrl", file);
                  }}
                >
                  <p className="text-sm font-semibold text-slate-900">
                    Hero cover
                  </p>
                  {previews.cover || config.coverUrl ? (
                    <img
                      src={previews.cover || config.coverUrl}
                      alt="Cover preview"
                      className="mt-3 h-32 w-full rounded-xl object-cover"
                    />
                  ) : (
                    <div className="mt-3 flex h-32 w-full items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white/10 p-4">
                      <div className="text-sm text-slate-600">
                        Drag & drop cover image or click to browse
                      </div>
                    </div>
                  )}
                  <label className="mt-3 block">
                    <span className="sr-only">Upload hero cover</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) =>
                        handleFileSelected("coverUrl", event.target.files?.[0])
                      }
                      className="block w-full text-sm text-slate-600 sr-only"
                    />
                    <div className="mt-3 cursor-pointer text-sm text-slate-600">
                      Click to upload
                    </div>
                  </label>
                  {uploading.cover ? (
                    <p className="mt-3 text-sm text-slate-500">
                      Uploading cover...
                    </p>
                  ) : null}
                </div>
              </div>

              <div
                className="mt-6 rounded-2xl bg-slate-50 p-4"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const files = e.dataTransfer?.files;
                  if (files && files.length > 0) handleGalleryDrop(files);
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Gallery images
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Add multiple photos to showcase your facilities and
                      energy.
                    </p>
                  </div>
                  <label className="inline-flex cursor-pointer items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                    Upload gallery image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleGalleryDrop(e.target.files)}
                      multiple
                      className="sr-only"
                    />
                  </label>
                </div>
                {uploading.gallery ? (
                  <p className="mt-3 text-sm text-slate-500">
                    Uploading gallery image...
                  </p>
                ) : null}
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {config.galleryUrls.length > 0 ? (
                    config.galleryUrls.map((url, index) => (
                      <div
                        key={`${url}-${index}`}
                        className="rounded-2xl border border-slate-200 bg-white p-2"
                      >
                        <img
                          src={url}
                          alt={`Gallery ${index + 1}`}
                          className="h-28 w-full rounded-xl object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setConfig((previous) => ({
                              ...previous,
                              galleryUrls: previous.galleryUrls.filter(
                                (_, currentIndex) => currentIndex !== index,
                              ),
                            }))
                          }
                          className="mt-3 text-sm font-semibold text-rose-600"
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-sm text-slate-500 sm:col-span-2 xl:col-span-3">
                      No gallery images yet. Add a few photos to make your page
                      feel premium.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Team / Trainers Section */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950 mb-2">
                Team / Trainers
              </h2>
              <p className="text-sm text-slate-600 mb-6">
                Add marketing trainers to showcase on your landing page. These
                are independent of your system user accounts.
              </p>

              {/* Trainer Form */}
              <div className="mb-8 rounded-xl bg-slate-50 p-4 border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">
                  {editingTrainerIndex !== null
                    ? "Edit Trainer"
                    : "Add New Trainer"}
                </h3>

                <div className="space-y-4">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <label className="block text-sm font-medium text-slate-700">
                      Trainer name *
                      <input
                        value={trainerForm.name}
                        onChange={(e) =>
                          setTrainerForm((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        placeholder="John Smith"
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-sky-500"
                      />
                    </label>
                    <label className="block text-sm font-medium text-slate-700">
                      Specialty
                      <input
                        value={trainerForm.specialty}
                        onChange={(e) =>
                          setTrainerForm((prev) => ({
                            ...prev,
                            specialty: e.target.value,
                          }))
                        }
                        placeholder="Strength & Conditioning"
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-sky-500"
                      />
                    </label>
                  </div>

                  <label className="block text-sm font-medium text-slate-700">
                    Bio
                    <textarea
                      value={trainerForm.bio}
                      onChange={(e) =>
                        setTrainerForm((prev) => ({
                          ...prev,
                          bio: e.target.value,
                        }))
                      }
                      rows={3}
                      placeholder="A brief description of this trainer's experience and coaching style..."
                      className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-sky-500"
                    />
                  </label>

                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">
                      Trainer Image
                    </p>
                    <div className="flex items-center gap-4">
                      {trainerForm.imageUrl ? (
                        <img
                          src={trainerForm.imageUrl}
                          alt="Trainer"
                          className="h-20 w-20 rounded-xl object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="h-20 w-20 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xs text-slate-500">
                          No image
                        </div>
                      )}
                      <label className="inline-flex cursor-pointer items-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
                        {uploading.trainer ? "Uploading..." : "Upload Image"}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleTrainerImageUpload(e.target.files?.[0])
                          }
                          disabled={uploading.trainer}
                          className="sr-only"
                        />
                      </label>
                      {trainerForm.imageUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            setTrainerForm((prev) => ({
                              ...prev,
                              imageUrl: "",
                            }))
                          }
                          className="text-sm font-semibold text-rose-600"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleAddTrainer}
                      className="flex-1 rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
                    >
                      {editingTrainerIndex !== null
                        ? "Update Trainer"
                        : "Add Trainer"}
                    </button>
                    {editingTrainerIndex !== null && (
                      <button
                        type="button"
                        onClick={handleCancelEditTrainer}
                        className="flex-1 rounded-lg bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-300"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Trainers List */}
              <div>
                <p className="text-sm font-semibold text-slate-900 mb-3">
                  Trainers on Landing Page ({config.trainers.length})
                </p>
                {config.trainers.length > 0 ? (
                  <div className="space-y-3">
                    {config.trainers.map((trainer, index) => (
                      <div
                        key={trainer.id || index}
                        className="flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4"
                      >
                        {trainer.imageUrl ? (
                          <img
                            src={trainer.imageUrl}
                            alt={trainer.name}
                            className="h-16 w-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-16 w-16 rounded-lg bg-slate-200 flex items-center justify-center text-xs text-slate-500">
                            No image
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900">
                            {trainer.name}
                          </p>
                          {trainer.specialty && (
                            <p className="text-xs text-slate-600">
                              {trainer.specialty}
                            </p>
                          )}
                          {trainer.bio && (
                            <p className="mt-1 text-xs text-slate-600 line-clamp-2">
                              {trainer.bio}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditTrainer(index)}
                            className="rounded-lg bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-200"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveTrainer(index)}
                            className="rounded-lg bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-200"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center">
                    <p className="text-sm text-slate-600">
                      No trainers added yet. Add one above to display on your
                      landing page.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Contact & Social Section */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950 mb-6">
                Contact & Social
              </h2>
              <div className="grid gap-4 lg:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Facebook URL
                  <input
                    value={config.facebookUrl}
                    onChange={(event) =>
                      updateField("facebookUrl", event.target.value)
                    }
                    placeholder="https://facebook.com/yourgym"
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500"
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Instagram URL
                  <input
                    value={config.instagramUrl}
                    onChange={(event) =>
                      updateField("instagramUrl", event.target.value)
                    }
                    placeholder="https://instagram.com/yourgym"
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500"
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700 lg:col-span-2">
                  WhatsApp number
                  <input
                    value={config.whatsappNumber}
                    onChange={(event) =>
                      updateField("whatsappNumber", event.target.value)
                    }
                    placeholder="966500000000"
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500"
                  />
                </label>
              </div>
            </div>

            {/* Status Messages */}
            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            {status ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {status}
              </div>
            ) : null}

            <p className="text-sm text-slate-500">
              {loading
                ? "Loading your current settings..."
                : "Changes are applied to your subdomain instantly."}
            </p>
          </form>
        </div>
      </div>

      {/* Right Panel - Live Preview */}
      <div className="w-full lg:w-[45%] bg-slate-50 flex items-center justify-center sticky top-0 h-screen border-l border-slate-200 p-6 lg:p-8">
        <div className="w-[320px] h-[650px] bg-white rounded-[3rem] border-8 border-slate-900 shadow-2xl overflow-hidden relative">
          {/* Mobile Frame Content */}
          <div className="h-full overflow-y-auto">
            {/* Header */}
            <div className="p-4 flex items-center gap-3 border-b border-slate-100">
              {config.logoUrl ? (
                <img
                  src={config.logoUrl}
                  alt="Logo"
                  className="h-10 w-10 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-sm font-semibold text-slate-600">
                  {tenant?.displayName?.[0] || "G"}
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-slate-900">
                  {tenant?.displayName || "Your gym"}
                </p>
                <p className="text-[10px] text-slate-500">Landing Page</p>
              </div>
            </div>

            {/* Hero Section */}
            <div
              className="relative h-48 bg-slate-900 flex flex-col justify-end p-4"
              style={{
                backgroundImage: config.coverUrl
                  ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url(${config.coverUrl})`
                  : "linear-gradient(135deg, #1e293b, #0f172a)",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <h2 className="text-xl font-bold text-white leading-tight">
                {config.heroTitle || "Your hero title"}
              </h2>
              <p className="mt-2 text-xs text-slate-200 line-clamp-2">
                {config.heroSubtitle || "Add a compelling subtitle"}
              </p>
              <button
                type="button"
                className="mt-3 rounded-full px-4 py-2 text-xs font-semibold text-white"
                style={{ backgroundColor: config.themeColor }}
              >
                Join Now
              </button>
            </div>

            {/* About Section */}
            <div className="p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">
                About
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {config.aboutText ||
                  "Describe your gym and what makes it special..."}
              </p>
            </div>

            {/* Gallery Preview */}
            {config.galleryUrls.length > 0 && (
              <div className="p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">
                  Gallery
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {config.galleryUrls.slice(0, 4).map((url, index) => (
                    <img
                      key={`${url}-${index}`}
                      src={url}
                      alt={`Gallery ${index + 1}`}
                      className="h-20 w-full rounded-lg object-cover"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Social Links */}
            {(config.facebookUrl ||
              config.instagramUrl ||
              config.whatsappNumber) && (
              <div className="p-4 border-t border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">
                  Connect
                </h3>
                <div className="flex gap-2">
                  {config.facebookUrl && (
                    <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                      <span className="text-[10px] text-white font-bold">
                        f
                      </span>
                    </div>
                  )}
                  {config.instagramUrl && (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center">
                      <span className="text-[10px] text-white font-bold">
                        ig
                      </span>
                    </div>
                  )}
                  {config.whatsappNumber && (
                    <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                      <span className="text-[10px] text-white font-bold">
                        wa
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

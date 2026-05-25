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

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setStatus("");

    try {
      const response = await api.put("/gym/landing-config", {
        ...config,
        galleryUrls: config.galleryUrls.filter(Boolean),
      });

      setStatus("Landing page updated successfully.");
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
    <main className="space-y-8">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg shadow-slate-900/5">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-3xl space-y-4">
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

          <div className="flex flex-col items-end gap-3">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
                config.isActive
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {config.isActive ? "Public page enabled" : "Public page disabled"}
            </span>
            <p className="text-sm text-slate-500">
              Your public page is available at your gym subdomain root.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
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

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Public landing page
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Turn the storefront on only when you are ready to publish it.
                </p>
              </div>
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
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Media</h2>
            <p className="mt-2 text-sm text-slate-600">
              Upload your logo, hero cover, and gallery images to Cloudinary.
            </p>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Logo</p>
                {config.logoUrl ? (
                  <img
                    src={config.logoUrl}
                    alt="Logo preview"
                    className="mt-3 h-20 w-auto rounded-xl object-contain"
                  />
                ) : null}
                <label className="mt-3 block">
                  <span className="sr-only">Upload logo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      handleUpload("logoUrl", event.target.files?.[0])
                    }
                    className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-sky-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                  />
                </label>
                {uploading.logo ? (
                  <p className="mt-3 text-sm text-slate-500">
                    Uploading logo...
                  </p>
                ) : null}
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Hero cover
                </p>
                {config.coverUrl ? (
                  <img
                    src={config.coverUrl}
                    alt="Cover preview"
                    className="mt-3 h-32 w-full rounded-xl object-cover"
                  />
                ) : null}
                <label className="mt-3 block">
                  <span className="sr-only">Upload hero cover</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      handleUpload("coverUrl", event.target.files?.[0])
                    }
                    className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-sky-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                  />
                </label>
                {uploading.cover ? (
                  <p className="mt-3 text-sm text-slate-500">
                    Uploading cover...
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Gallery images
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Add multiple photos to showcase your facilities and energy.
                  </p>
                </div>
                <label className="inline-flex cursor-pointer items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                  Upload gallery image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleGalleryUpload}
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

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Contact & social
            </h2>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
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

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {saving ? "Saving..." : "Save public landing page"}
            </button>
            <p className="text-sm text-slate-500">
              {loading
                ? "Loading your current settings..."
                : "Changes are applied to your subdomain instantly."}
            </p>
          </div>

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
        </form>

        <aside className="space-y-6">
          <div
            className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 text-white shadow-lg"
            style={{
              backgroundImage: config.coverUrl
                ? `linear-gradient(rgba(15,23,42,0.82), rgba(15,23,42,0.9)), url(${config.coverUrl})`
                : "linear-gradient(135deg, #0f172a, #1d4ed8)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-3">
                {config.logoUrl ? (
                  <img
                    src={config.logoUrl}
                    alt="Logo"
                    className="h-12 w-12 rounded-2xl border border-white/20 bg-white/10 object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-lg font-semibold">
                    {tenant?.displayName?.[0] || "G"}
                  </div>
                )}
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-200">
                    {tenant?.displayName || "Your gym"}
                  </p>
                  <p className="text-lg font-semibold">Preview</p>
                </div>
              </div>

              <h2 className="mt-6 text-3xl font-semibold leading-tight">
                {config.heroTitle || "Your hero title goes here"}
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-200">
                {config.heroSubtitle ||
                  "Add a powerful subtitle to convert your visitors into members."}
              </p>
              <button
                type="button"
                className="mt-6 rounded-full px-5 py-3 text-sm font-semibold text-white"
                style={{ backgroundColor: config.themeColor }}
              >
                View Plans
              </button>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

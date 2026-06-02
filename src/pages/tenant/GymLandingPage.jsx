import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import { getTenantSlugFromHost } from "../../utils/tenantUtils";

const formatPrice = (amount) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(amount) || 0);

const formatDuration = (days) => {
  if (!days) {
    return "Flexible duration";
  }

  if (days === 30) {
    return "Monthly";
  }

  if (days === 90) {
    return "Quarterly";
  }

  if (days === 365) {
    return "Yearly";
  }

  return `${days} days`;
};

export default function GymLandingPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState(null);
  const [leadForm, setLeadForm] = useState({ name: "", phone: "", email: "" });
  const [submittingLead, setSubmittingLead] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState(false);
  const [leadError, setLeadError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadLandingPage = async () => {
      const tenantSlug = getTenantSlugFromHost(window.location.hostname);

      if (!tenantSlug) {
        setLoading(false);
        setError("This storefront is unavailable.");
        return;
      }

      try {
        const response = await api.get(`/landing/${tenantSlug}`);
        if (!isMounted) {
          return;
        }

        setPayload(response?.data?.data || null);
      } catch (err) {
        if (!isMounted) {
          return;
        }
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load this gym storefront.",
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadLandingPage();

    return () => {
      isMounted = false;
    };
  }, []);

  const config = payload?.landingPageConfig || {};
  const gymName = payload?.gymName || "Gym";
  const plans = payload?.plans || [];
  const isActive = Boolean(payload?.isActive);

  const whatsappLink = useMemo(() => {
    const cleanNumber = String(config.whatsappNumber || "").replace(
      /[^0-9+]/g,
      "",
    );

    if (!cleanNumber) {
      return null;
    }

    return `https://wa.me/${cleanNumber}`;
  }, [config.whatsappNumber]);

  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    setSubmittingLead(true);
    setLeadError("");
    setLeadSuccess(false);

    try {
      const tenantSlug = getTenantSlugFromHost(window.location.hostname);
      await api.post(`/landing/${tenantSlug}/leads`, leadForm);
      setLeadSuccess(true);
      setLeadForm({ name: "", phone: "", email: "" });
    } catch (err) {
      setLeadError(
        err?.response?.data?.message || "Failed to submit. Please try again.",
      );
    } finally {
      setSubmittingLead(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
        <div className="mx-auto max-w-5xl">
          <div className="animate-pulse rounded-[2rem] border border-white/10 bg-white/5 p-8">
            <div className="h-5 w-40 rounded-full bg-white/10" />
            <div className="mt-6 h-12 w-3/4 rounded bg-white/10" />
            <div className="mt-4 h-4 w-full rounded bg-white/10" />
            <div className="mt-4 h-4 w-5/6 rounded bg-white/10" />
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-white/5 p-10 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
            Public storefront
          </p>
          <h1 className="mt-4 text-3xl font-semibold">
            This storefront is unavailable
          </h1>
          <p className="mt-4 text-slate-200">{error}</p>
        </div>
      </main>
    );
  }

  if (!isActive) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-white/5 p-10 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
            Coming soon
          </p>
          <h1 className="mt-4 text-3xl font-semibold">
            {gymName} is preparing its public page
          </h1>
          <p className="mt-4 text-slate-200">
            The owner has not enabled the public landing page yet. Please check
            back soon.
          </p>
          <a
            href="/login"
            className="mt-8 inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950"
          >
            Sign in to your dashboard
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section
        className="relative overflow-hidden"
        style={{
          backgroundImage: config.coverUrl
            ? `linear-gradient(rgba(15,23,42,0.8), rgba(15,23,42,0.88)), url(${config.coverUrl})`
            : "linear-gradient(135deg, #0f172a, #1d4ed8)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="mx-auto flex max-w-7xl flex-col px-6 pb-16 pt-6 lg:px-8">
          <nav className="flex items-center justify-between rounded-full border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
            <div className="flex items-center gap-3">
              {config.logoUrl ? (
                <img
                  src={config.logoUrl}
                  alt={`${gymName} logo`}
                  className="h-10 w-10 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-sm font-semibold text-white">
                  {gymName?.[0] || "G"}
                </div>
              )}
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-slate-200">
                  Public storefront
                </p>
                <p className="text-lg font-semibold text-white">{gymName}</p>
              </div>
            </div>
            <a
              href="/login"
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950"
            >
              Sign in
            </a>
          </nav>

          <div className="grid min-h-[70vh] items-center gap-8 py-16 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-sky-200">
                Premium gym experience
              </p>
              <h1 className="mt-5 text-4xl font-semibold leading-tight text-white sm:text-5xl">
                {config.heroTitle || `Welcome to ${gymName}`}
              </h1>
              <p className="mt-5 text-lg leading-8 text-slate-200">
                {config.heroSubtitle ||
                  "Discover a modern gym experience with expert coaching, members-only classes, and a vibrant community."}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#pricing"
                  className="rounded-full px-5 py-3 text-sm font-semibold text-white shadow-lg"
                  style={{ backgroundColor: config.themeColor || "#2563eb" }}
                >
                  View Plans
                </a>
                {whatsappLink ? (
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white"
                  >
                    Contact via WhatsApp
                  </a>
                ) : null}
              </div>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-6 text-white backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-200">
                Claim Your Free Trial
              </p>
              {leadSuccess ? (
                <div className="mt-4 rounded-2xl bg-emerald-500/20 p-4 text-center">
                  <p className="font-semibold text-emerald-200">
                    ✓ Thank you! We'll contact you shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleLeadSubmit} className="mt-4 space-y-3">
                  <input
                    type="text"
                    placeholder="Your name"
                    value={leadForm.name}
                    onChange={(e) =>
                      setLeadForm({ ...leadForm, name: e.target.value })
                    }
                    required
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40"
                  />
                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={leadForm.phone}
                    onChange={(e) =>
                      setLeadForm({ ...leadForm, phone: e.target.value })
                    }
                    required
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40"
                  />
                  <input
                    type="email"
                    placeholder="Email (optional)"
                    value={leadForm.email}
                    onChange={(e) =>
                      setLeadForm({ ...leadForm, email: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40"
                  />
                  {leadError && (
                    <p className="text-xs text-rose-300">{leadError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={submittingLead}
                    className="w-full rounded-full px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ backgroundColor: config.themeColor || "#2563eb" }}
                  >
                    {submittingLead ? "Submitting..." : "Get Started"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">
            Our team
          </p>
          <h2 className="mt-4 text-3xl font-semibold text-slate-950">
            Meet Our Trainers
          </h2>
        </div>

        <div className="mt-8">
          {config.trainers && config.trainers.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {config.trainers.map((trainer, index) => (
                <article
                  key={trainer.id || index}
                  className="group relative overflow-hidden rounded-2xl bg-slate-950/5 shadow-lg shadow-slate-900/5 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-2xl hover:shadow-sky-500/20"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={
                        trainer.imageUrl ||
                        "https://images.unsplash.com/photo-1544785349-c4a5301826fd?auto=format&fit=crop&w=800&q=60"
                      }
                      alt={trainer.name}
                      className="w-full aspect-4/5 object-cover transition-all duration-500 ease-in-out group-hover:scale-105"
                    />

                    <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-slate-950/95 to-transparent" />

                    <div className="absolute inset-x-0 bottom-0 px-4 pb-4 text-white">
                      <p className="text-base font-semibold tracking-tight">
                        {trainer.name}
                      </p>
                    </div>

                    <div className="absolute inset-x-4 bottom-0 z-10 translate-y-full rounded-3xl border border-white/20 bg-white/20 p-5 backdrop-blur-md opacity-0 transition-all duration-500 ease-in-out delay-75 group-hover:translate-y-0 group-hover:opacity-100">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200">
                        Specialty
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-950">
                        {trainer.specialty || "Strength & Conditioning"}
                      </p>
                      <p className="mt-3 text-sm leading-6 text-slate-700 line-clamp-4">
                        {trainer.bio ||
                          "A dedicated coach focused on helping members achieve their strongest, healthiest selves."}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-[1rem] border border-dashed border-slate-200 bg-white px-6 py-10 text-sm text-slate-500">
              No trainers listed yet. Add trainer profiles in the dashboard to
              show here.
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">
              About & facilities
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-slate-950">
              Crafted for performance, comfort, and consistency
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              {config.aboutText ||
                "A premium gym experience powered by world-class coaches, modern equipment, and a welcoming community that keeps members engaged from day one."}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {(config.galleryUrls && config.galleryUrls.length > 0
              ? config.galleryUrls
              : [
                  "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=80",
                  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80",
                  "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=80",
                  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80",
                ]
            ).map((url, index) => (
              <img
                key={`${url}-${index}`}
                src={url}
                alt={`Gallery ${index + 1}`}
                className="h-48 w-full rounded-[1.5rem] object-cover shadow-lg"
              />
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">
              Pricing
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-slate-950">
              Flexible plans for every member
            </h2>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {plans.length > 0 ? (
              plans.map((plan) => (
                <article
                  key={plan._id}
                  className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 shadow-sm"
                >
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {formatDuration(plan.durationInDays)}
                  </p>
                  <h3 className="mt-4 text-2xl font-semibold text-slate-950">
                    {plan.name}
                  </h3>
                  <p className="mt-4 text-4xl font-semibold text-slate-950">
                    {formatPrice(plan.price)}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {plan.sessionCount
                      ? `${plan.sessionCount} training sessions included`
                      : "Access to the full gym experience"}
                  </p>
                  <a
                    href={whatsappLink || "#contact"}
                    className="mt-6 inline-flex rounded-full px-4 py-2 text-sm font-semibold text-white"
                    style={{ backgroundColor: config.themeColor || "#2563eb" }}
                  >
                    Join now
                  </a>
                </article>
              ))
            ) : (
              <div className="rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-sm text-slate-500 lg:col-span-3">
                Owner plans are not available yet. Check back soon for
                membership options.
              </div>
            )}
          </div>
        </div>
      </section>

      <footer id="contact" className="bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-300">
              Contact
            </p>
            <h2 className="mt-3 text-2xl font-semibold">{gymName}</h2>
            <p className="mt-2 text-sm text-slate-200">
              Ready to move, train, and stay motivated? Start your next fitness
              journey today.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {whatsappLink ? (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white"
              >
                WhatsApp
              </a>
            ) : null}
            {config.facebookUrl ? (
              <a
                href={config.facebookUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white"
              >
                Facebook
              </a>
            ) : null}
            {config.instagramUrl ? (
              <a
                href={config.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white"
              >
                Instagram
              </a>
            ) : null}
          </div>
        </div>
      </footer>
    </main>
  );
}

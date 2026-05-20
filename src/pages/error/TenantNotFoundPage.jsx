import { Link } from "react-router-dom";

export default function TenantNotFoundPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-12">
      <section className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-10 shadow-lg">
        <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">
          Tenant not found
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900">
          We couldn't find that gym workspace.
        </h1>
        <p className="mt-4 text-sm text-slate-600">
          The gym slug or subdomain you visited does not match an active tenant.
          Please check the URL or return to the main landing page to continue.
        </p>

        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Return to SaaS homepage
          </Link>
        </div>
      </section>
    </main>
  );
}

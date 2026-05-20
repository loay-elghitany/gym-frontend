import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-12">
      <section className="w-full max-w-xl rounded-4xl border border-slate-200 bg-white px-8 py-12 text-center shadow-xl shadow-slate-900/5">
        <p className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-500">
          Page not found
        </p>
        <h1 className="mt-6 text-5xl font-semibold tracking-tight text-slate-950">
          404
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          The page you were looking for couldn&apos;t be found. You can return
          to the landing page and continue from there.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Return to homepage
        </Link>
      </section>
    </main>
  );
}

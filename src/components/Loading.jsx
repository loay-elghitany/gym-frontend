export default function Loading({ message = "Loading..." }) {
  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
        <div
          className="w-full max-w-md rounded-[28px] border border-slate-200/80 bg-white/90 px-6 py-8 text-center shadow-[0_24px_80px_-26px_rgba(15,23,42,0.28)] backdrop-blur-sm sm:px-8"
          style={{ animation: "fadeIn 0.45s ease-out" }}
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 via-cyan-500 to-emerald-500 p-[1px] shadow-lg shadow-sky-500/30">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-950">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/80 border-t-transparent" />
            </div>
          </div>
          <p className="mt-5 text-sm font-semibold uppercase tracking-[0.28em] text-sky-600">
            Loading Gym Data...
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
          <div className="mt-5 flex items-center justify-center gap-1.5">
            <span className="h-2 w-2 animate-pulse rounded-full bg-sky-500" />
            <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          </div>
        </div>
      </div>
    </>
  );
}

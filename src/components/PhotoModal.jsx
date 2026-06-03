import { useEffect } from "react";

export default function PhotoModal({ open, url, alt, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative max-h-[90vh] max-w-[90vw] overflow-auto rounded-3xl bg-white p-4 shadow-lg">
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700"
          >
            Close
          </button>
        </div>
        <div className="mt-2 flex items-center justify-center">
          <img
            src={url}
            alt={alt}
            className="max-h-[80vh] max-w-[80vw] object-contain"
          />
        </div>
      </div>
    </div>
  );
}

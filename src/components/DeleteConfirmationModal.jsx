export default function DeleteConfirmationModal({ open, title = "Delete item", message = "Are you sure?", onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative rounded-3xl bg-white p-6 shadow-lg max-w-sm w-full">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <div className="mt-4 flex justify-end gap-3">
          <button onClick={onCancel} className="rounded-2xl px-4 py-2 text-sm font-semibold border border-slate-200">Cancel</button>
          <button onClick={onConfirm} className="rounded-2xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white">Delete</button>
        </div>
      </div>
    </div>
  );
}

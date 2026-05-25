import { useEffect, useRef, useState } from "react";
import api from "../api/axios";

export default function ExerciseAutocomplete({
  value,
  onValueChange,
  onSelect,
  placeholder = "Search exercise",
  disabled = false,
  className = "",
}) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef(null);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const runSearch = async (term) => {
    const trimmed = term.trim();

    if (!trimmed) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    try {
      setIsSearching(true);
      const response = await api.get("/exercises/search", {
        params: { q: trimmed },
      });

      const matches = Array.isArray(response?.data?.data)
        ? response.data.data
        : [];

      setResults(matches);
      setIsOpen(true);
      setActiveIndex(-1);
    } catch (error) {
      console.error("Unable to load exercise suggestions", error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleChange = (event) => {
    const nextValue = event.target.value;
    setQuery(nextValue);
    onValueChange(nextValue);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!nextValue.trim()) {
      setResults([]);
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    debounceRef.current = setTimeout(() => {
      runSearch(nextValue);
    }, 260);

    setIsOpen(true);
  };

  const handleSelect = (item) => {
    const preferredName = item?.nameAr?.trim() || item?.nameEn?.trim() || "";
    setQuery(preferredName);
    onSelect(item);
    setResults([]);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (event) => {
    if (!isOpen || !results.length) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) =>
        current < results.length - 1 ? current + 1 : 0,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) =>
        current > 0 ? current - 1 : results.length - 1,
      );
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      handleSelect(results[activeIndex]);
    }

    if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const currentLabel = query.trim() || placeholder;

  return (
    <div className={`relative ${className}`}>
      <input
        value={query}
        onChange={handleChange}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          window.setTimeout(() => {
            setIsOpen(false);
            setActiveIndex(-1);
          }, 120);
        }}
        onKeyDown={handleKeyDown}
        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
      />

      {isOpen ? (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
          {isSearching ? (
            <div className="px-4 py-3 text-sm text-slate-500">
              Searching exercises...
            </div>
          ) : results.length ? (
            <div className="max-h-72 overflow-y-auto">
              {results.map((item, index) => {
                const label =
                  item?.nameAr && item?.nameEn
                    ? `${item.nameAr} • ${item.nameEn}`
                    : item?.nameAr || item?.nameEn || "Exercise";

                return (
                  <button
                    type="button"
                    key={item?._id || `${item?.nameEn}-${index}`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSelect(item)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                      activeIndex === index
                        ? "bg-slate-100"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    {item?.gifUrl ? (
                      <img
                        src={item.gifUrl}
                        alt={label}
                        className="h-12 w-12 rounded-2xl border border-slate-200 object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                        GIF
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900">
                        {label}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item?.targetMuscle || "Smart exercise library"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-3 text-sm text-slate-500">
              {currentLabel === placeholder
                ? "Type to search the global exercise library."
                : "No exact matches found — your custom text will still be saved."}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

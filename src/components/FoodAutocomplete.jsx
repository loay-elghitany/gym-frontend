import { useEffect, useRef, useState } from "react";
import api from "../api/axios";

export default function FoodAutocomplete({
  value,
  onValueChange,
  onSelect,
  placeholder = "Search food or type custom",
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
      const response = await api.get("/foods/search", {
        params: { q: trimmed },
      });

      const matches = Array.isArray(response?.data?.data)
        ? response.data.data
        : [];

      setResults(matches);
      setIsOpen(true);
      setActiveIndex(-1);
    } catch (error) {
      console.error("Unable to load food suggestions", error);
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
    <div className={`relative w-full ${className}`}>
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
        className="w-full min-h-[3rem] rounded-3xl border border-slate-200 bg-slate-50/95 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 sm:text-sm"
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
      />

      {isOpen ? (
        <div className="absolute top-full left-0 z-50 mt-1 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-xl backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/95">
          {isSearching ? (
            <div className="px-4 py-4 text-sm text-slate-500 dark:text-slate-200">
              Searching foods...
            </div>
          ) : results.length ? (
            <div className="max-h-72 overflow-y-auto sm:max-h-60">
              {results.map((item, index) => {
                const label =
                  item?.nameAr && item?.nameEn
                    ? `${item.nameAr} • ${item.nameEn}`
                    : item?.nameAr || item?.nameEn || "Food";

                return (
                  <button
                    type="button"
                    key={item?._id || `${item?.nameEn}-${index}`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSelect(item)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition sm:min-h-[3.75rem] ${
                      activeIndex === index
                        ? "bg-emerald-50 dark:bg-slate-700"
                        : "hover:bg-slate-50 dark:hover:bg-slate-700/80"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold leading-5 text-slate-900 dark:text-slate-100">
                        {label}
                      </p>
                      <p className="mt-1 truncate text-xs leading-4 text-slate-500 dark:text-slate-300">
                        {item?.baseUnit || "100g"} • {item?.calories || 0} kcal
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-4 text-sm leading-6 text-slate-500 dark:text-slate-200">
              {currentLabel === placeholder
                ? "Type to search the smart food library."
                : "No exact match found — your custom food name will still be saved."}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

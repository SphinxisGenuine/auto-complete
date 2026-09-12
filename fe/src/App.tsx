import React, { useCallback, useEffect, useRef, useState } from "react";
async function fetchSuggestions(query: string): Promise<string[]> {
  const res = await fetch(`http://localhost:3000/autocomplete?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("suggest request failed");
  const data = await res.json();
  return Array.isArray(data.result) ? data.result.map((item: { word: string }) => item.word) : [];
}

async function postSelection(query: string, selected: string): Promise<void> {
  await fetch(`http://localhost:3000/selection`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, selected }),
  });
}


const DEBOUNCE_MS = 150;

export default function AutocompleteSearch() {
  const [dark, setDark] = useState(true);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showInvalid, setShowInvalid] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);
  const confirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch suggestions whenever the query changes, debounced.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (!trimmed) {
      setSuggestions([]);
      setActiveIndex(-1);
      setIsOpen(false);
      setLatencyMs(null);
      setShowInvalid(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const thisRequest = ++requestIdRef.current;
      const start = performance.now();
      try {
        const results = await fetchSuggestions(trimmed);
        if (thisRequest !== requestIdRef.current) return; // stale response
        setLatencyMs(Math.round(performance.now() - start));
        setSuggestions(results);
        setActiveIndex(results.length ? 0 : -1);
        setIsOpen(results.length > 0);
        setShowInvalid(results.length === 0);
      } catch {
        if (thisRequest !== requestIdRef.current) return;
        setSuggestions([]);
        setActiveIndex(-1);
        setIsOpen(false);
        setShowInvalid(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const commitSelection = useCallback(
    async (pick: string) => {
      const originalQuery = query;
      setIsOpen(false);
      setSuggestions([]);
      setActiveIndex(-1);
      setQuery("");
      setLatencyMs(null);
      setShowInvalid(false);
      setConfirmed(pick);

      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
      confirmTimeoutRef.current = setTimeout(() => setConfirmed(null), 2200);

      try {
        await postSelection(originalQuery, pick);
      } catch {
        // Selection call failing shouldn't block the UI; log and move on.
        console.error("selection request failed for", pick);
      }
    },
    [query]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
      return;
    }

    if (e.key === "Tab" || e.key === "Enter") {
      e.preventDefault();
      const pick = suggestions[activeIndex] ?? suggestions[0];
      if (pick) commitSelection(pick);
      return;
    }

    if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  // ---- Theme tokens -------------------------------------------------------
  const theme = dark
    ? {
      bg: "bg-[#12140F]",
      panel: "bg-[#1A1D16]",
      border: "border-[#2C3024]",
      text: "text-[#E9ECE2]",
      subtext: "text-[#8B9280]",
      accent: "text-[#7FB88A]",
      accentBg: "bg-[#7FB88A]",
      highlight: "bg-[#26301F]",
      ring: "focus:ring-[#7FB88A]/40",
    }
    : {
      bg: "bg-[#F4F5EF]",
      panel: "bg-white",
      border: "border-[#DADDD0]",
      text: "text-[#1B1E17]",
      subtext: "text-[#6B7263]",
      accent: "text-[#2F6F4E]",
      accentBg: "bg-[#2F6F4E]",
      highlight: "bg-[#E7EEE3]",
      ring: "focus:ring-[#2F6F4E]/30",
    };

  return (
    <div
      className={`min-h-screen w-full ${theme.bg} ${theme.text} flex items-center justify-center transition-colors duration-300 font-sans`}
    >
      {/* Theme toggle */}
      <button
        onClick={() => setDark((d) => !d)}
        aria-label="Toggle dark mode"
        className={`absolute top-6 right-6 h-9 w-9 rounded-full border ${theme.border} ${theme.panel} flex items-center justify-center transition-colors hover:opacity-80`}
      >
        {dark ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="4.2" />
            <path d="M12 2.5v2.2M12 19.3v2.2M4.2 4.2l1.5 1.5M18.3 18.3l1.5 1.5M2.5 12h2.2M19.3 12h2.2M4.2 19.8l1.5-1.5M18.3 5.7l1.5-1.5" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11Z" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Center column: search box + dropdown */}
      <div className="w-full max-w-md px-6">
        <div className="relative">
          <div
            className={`flex items-center gap-3 rounded-lg border ${theme.border} ${theme.panel} px-4 py-3 shadow-sm transition-shadow focus-within:shadow-md`}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className={theme.subtext}
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
            </svg>

            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setConfirmed(null);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => suggestions.length > 0 && setIsOpen(true)}
              placeholder="Start typing…"
              spellCheck={false}
              className={`flex-1 bg-transparent outline-none font-mono text-[15px] placeholder:${theme.subtext} ${theme.text}`}
            />

            <span
              className={`font-mono text-xs tabular-nums w-10 text-right ${theme.subtext}`}
              title="Last suggestion response time"
            >
              {latencyMs !== null ? `${latencyMs}ms` : ""}
            </span>
          </div>

          {/* Suggestions dropdown */}
          {isOpen && suggestions.length > 0 && (
            <ul
              role="listbox"
              className={`absolute left-0 right-0 mt-2 rounded-lg border ${theme.border} ${theme.panel} shadow-lg overflow-hidden z-10`}
            >
              {suggestions.map((s, i) => (
                <li
                  key={s}
                  role="option"
                  aria-selected={i === activeIndex}
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    commitSelection(s);
                  }}
                  className={`px-4 py-2.5 font-mono text-sm cursor-pointer transition-colors ${i === activeIndex ? `${theme.highlight} ${theme.accent}` : ""
                    }`}
                >
                  {s}
                </li>
              ))}
            </ul>
          )}

          {/* Subtle invalid-word hint */}
          {showInvalid && !confirmed && (
            <p className={`mt-2 text-xs font-mono ${theme.subtext} px-1`}>
              Please enter a valid word.
            </p>
          )}

          {/* Selection confirmation */}
          {confirmed && (
            <div
              className={`absolute left-0 right-0 mt-2 rounded-lg border ${theme.border} ${theme.panel} px-4 py-2.5 text-sm flex items-center gap-2 animate-[fadeIn_0.15s_ease-out]`}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                className={theme.accent}
              >
                <path d="M4 12.5l5 5L20 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className={theme.subtext}>
                Selected <span className={`font-mono ${theme.text}`}>{confirmed}</span>
              </span>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-2px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
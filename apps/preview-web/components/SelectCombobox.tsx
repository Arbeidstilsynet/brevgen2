"use client";

import { type ReactNode, useEffect, useId, useRef, useState } from "react";

export interface ComboboxOption<T extends string = string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

interface SelectComboboxProps<T extends string = string> {
  label: string;
  options: ComboboxOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  placeholder?: string;
  disabled?: boolean;
}

const PAGE_SIZE = 10;

export function SelectCombobox<T extends string = string>({
  label,
  options,
  value,
  onChange,
  placeholder = "Velg...",
  disabled = false,
}: Readonly<SelectComboboxProps<T>>) {
  const id = useId();
  const comboId = `${id}-combo`;
  const listboxId = `${id}-listbox`;
  const labelId = `${id}-label`;

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searchString, setSearchString] = useState("");
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const containerRef = useRef<HTMLDivElement>(null);
  const comboRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);
  const activeOptionId = activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined;

  const open = () => {
    if (disabled) return;
    setIsOpen(true);
    const idx = options.findIndex((o) => o.value === value);
    setActiveIndex(Math.max(idx, 0));
  };

  const close = () => {
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const selectOption = (index: number) => {
    const option = options[index];
    if (option) {
      onChange(option.value);
    }
    close();
    comboRef.current?.focus();
  };

  // Scroll active option into view
  useEffect(() => {
    if (!isOpen || activeIndex < 0) return;
    const optionEl = document.getElementById(`${id}-option-${activeIndex}`);
    optionEl?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, id, isOpen]);

  const findOptionByChar = (char: string) => {
    const newSearch = searchString + char;
    setSearchString(newSearch);

    clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => setSearchString(""), 500);

    // Find first match starting after current active index
    const startIndex = Math.max(activeIndex, 0);
    const allRepeated = newSearch.length > 1 && new Set(newSearch).size === 1;

    let matchIndex: number;
    if (allRepeated) {
      // Same character typed repeatedly: cycle through options starting with that char
      const singleChar = newSearch[0].toLowerCase();
      const matches = options
        .map((o, i) => ({ option: o, index: i }))
        .filter(({ option }) => option.label.toLowerCase().startsWith(singleChar));
      if (matches.length === 0) return;
      const currentMatchIndex = matches.findIndex(({ index }) => index === activeIndex);
      const nextMatch = matches[(currentMatchIndex + 1) % matches.length];
      matchIndex = nextMatch.index;
    } else {
      // Multi-char: find first option matching the full string
      const lowerSearch = newSearch.toLowerCase();
      matchIndex = options.findIndex(
        (o, i) => i > startIndex && o.label.toLowerCase().startsWith(lowerSearch),
      );
      if (matchIndex === -1) {
        matchIndex = options.findIndex((o) => o.label.toLowerCase().startsWith(lowerSearch));
      }
    }

    if (matchIndex >= 0) {
      setActiveIndex(matchIndex);
      if (!isOpen) open();
    }
  };

  const handleClosedKeyDown = (e: React.KeyboardEvent) => {
    const { key } = e;
    switch (key) {
      case "ArrowDown":
      case "ArrowUp":
      case "Enter":
      case " ":
        e.preventDefault();
        open();
        if (key === "ArrowUp" && options.length > 0) {
          setActiveIndex(0);
        }
        return;
      case "Home":
        e.preventDefault();
        open();
        setActiveIndex(0);
        return;
      case "End":
        e.preventDefault();
        open();
        setActiveIndex(options.length - 1);
        return;
    }

    if (key.length === 1 && key !== " ") {
      findOptionByChar(key);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      handleClosedKeyDown(e);
      return;
    }

    const { key } = e;

    // Listbox is open
    switch (key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, options.length - 1));
        return;
      case "ArrowUp":
        e.preventDefault();
        if (e.altKey) {
          selectOption(activeIndex);
        } else {
          setActiveIndex((i) => Math.max(i - 1, 0));
        }
        return;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        return;
      case "End":
        e.preventDefault();
        setActiveIndex(options.length - 1);
        return;
      case "PageUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - PAGE_SIZE, 0));
        return;
      case "PageDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + PAGE_SIZE, options.length - 1));
        return;
      case "Enter":
      case " ":
        e.preventDefault();
        selectOption(activeIndex);
        return;
      case "Escape":
        e.preventDefault();
        close();
        comboRef.current?.focus();
        return;
      case "Tab":
        selectOption(activeIndex);
        return;
    }

    if (key.length === 1) {
      e.preventDefault();
      findOptionByChar(key);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div id={labelId} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </div>
      <div //NOSONAR
        ref={comboRef}
        id={comboId}
        role="combobox"
        aria-labelledby={labelId}
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-activedescendant={activeOptionId}
        tabIndex={disabled ? -1 : 0}
        className={`flex items-center justify-between gap-2 p-2 border rounded-sm text-sm cursor-default
          focus:outline-none focus:ring-2 focus:ring-blue-500 transition
          ${disabled ? "border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed opacity-60" : "border-gray-300 bg-white"}
        `}
        onClick={() => {
          if (disabled) return;
          if (isOpen) {
            close();
          } else {
            open();
          }
        }}
        onKeyDown={handleKeyDown}
        onBlur={(e) => {
          if (!containerRef.current?.contains(e.relatedTarget)) {
            close();
          }
        }}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption ? (
            <>
              {selectedOption.icon}
              {selectedOption.label}
            </>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {isOpen && (
        <div //NOSONAR
          id={listboxId}
          role="listbox"
          aria-labelledby={labelId}
          tabIndex={-1}
          className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-sm border border-gray-300 bg-white shadow-lg"
        >
          {options.map((option, index) => (
            <div //NOSONAR
              key={option.value}
              id={`${id}-option-${index}`}
              role="option"
              aria-selected={option.value === value}
              className={`flex items-center gap-2 px-3 py-2 text-sm cursor-default select-none
                ${index === activeIndex ? "bg-blue-600 text-white" : "text-gray-900"}
                ${option.value === value && index !== activeIndex ? "font-semibold" : ""}
              `}
              onMouseDown={() => selectOption(index)}
              onMouseEnter={() => setActiveIndex(index)}
              tabIndex={-1}
            >
              {option.icon}
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

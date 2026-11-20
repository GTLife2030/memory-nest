"use client";

import { cn } from "@/lib/cn";

export type Option = { value: string; label: string; hint?: string };

type ChoiceProps = {
  name: string;
  legend: string;
  /** Hide the legend visually when the step heading already says the same. */
  legendHidden?: boolean;
  hint?: string;
  options: Option[];
  className?: string;
};

const card =
  "flex min-target cursor-pointer items-start gap-4 rounded-card border bg-linen p-5 transition-colors duration-200 ease-out has-[:checked]:border-terracotta-dark has-[:checked]:bg-sand has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-terracotta-dark border-taupe hover:bg-sand";

/** One choice out of a few, as large cards. Native radio buttons, so keyboard and screen readers just work. */
export function RadioCards({
  name,
  legend,
  legendHidden,
  hint,
  options,
  value,
  onChange,
  className,
}: ChoiceProps & { value: string; onChange: (value: string) => void }) {
  return (
    <fieldset className={className}>
      <legend className={cn("text-lg font-medium", legendHidden && "sr-only")}>{legend}</legend>
      {hint ? <p className="text-taupe-dark mt-1">{hint}</p> : null}
      <div className="mt-4 flex flex-col gap-3">
        {options.map((option) => (
          <label key={option.value} className={card}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="accent-terracotta-dark mt-1 size-5 shrink-0 outline-none"
            />
            <span>
              <span className="text-ink block text-lg font-medium">{option.label}</span>
              {option.hint ? <span className="text-taupe-dark block">{option.hint}</span> : null}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Any number of choices, as chips. Native checkboxes. */
export function CheckChips({
  name,
  legend,
  legendHidden,
  hint,
  options,
  values,
  onChange,
  className,
}: ChoiceProps & { values: string[]; onChange: (values: string[]) => void }) {
  return (
    <fieldset className={className}>
      <legend className={cn("text-lg font-medium", legendHidden && "sr-only")}>{legend}</legend>
      {hint ? <p className="text-taupe-dark mt-1">{hint}</p> : null}
      <div className="mt-4 flex flex-wrap gap-3">
        {options.map((option) => {
          const checked = values.includes(option.value);
          return (
            <label
              key={option.value}
              className="min-target rounded-pill border-taupe bg-linen text-ink hover:bg-sand has-[:checked]:border-terracotta-dark has-[:checked]:bg-terracotta-dark has-[:focus-visible]:outline-terracotta-dark inline-flex cursor-pointer items-center gap-2 border px-5 transition-colors duration-200 ease-out has-[:checked]:text-white has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-3"
            >
              <input
                type="checkbox"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() =>
                  onChange(
                    checked ? values.filter((v) => v !== option.value) : [...values, option.value],
                  )
                }
                className="accent-ink size-4 outline-none"
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

import { useId } from "react";

const scenes = {
  winkel: (
    <>
      <rect x="0.7" y="1.1" width="2.6" height="1.9" fill="#5e5346" opacity="0.55" />
      <rect x="1" y="1.5" width="0.9" height="0.8" fill="#eadfcf" opacity="0.7" />
      <rect x="2.3" y="1.9" width="0.6" height="1.1" fill="#2e2a26" opacity="0.6" />
    </>
  ),
  kermis: (
    <>
      <rect x="0.3" y="0.9" width="3.4" height="0.5" fill="#5e5346" opacity="0.5" />
      <circle cx="0.8" cy="0.7" r="0.08" fill="#fbf8f3" />
      <circle cx="1.6" cy="0.7" r="0.08" fill="#fbf8f3" />
      <circle cx="2.4" cy="0.7" r="0.08" fill="#fbf8f3" />
      <circle cx="3.2" cy="0.7" r="0.08" fill="#fbf8f3" />
      <ellipse cx="1.5" cy="2.3" rx="0.3" ry="0.75" fill="#2e2a26" opacity="0.6" />
      <ellipse cx="2.3" cy="2.35" rx="0.3" ry="0.7" fill="#2e2a26" opacity="0.5" />
      <circle cx="2.75" cy="2.2" r="0.28" fill="#eadfcf" opacity="0.75" />
    </>
  ),
  tuin: (
    <>
      <rect x="0" y="1.9" width="4" height="1.1" fill="#5f7a5a" opacity="0.45" />
      <rect x="1.1" y="2.1" width="1.8" height="0.6" fill="#eadfcf" opacity="0.8" />
      <ellipse cx="2" cy="2.35" rx="0.35" ry="0.2" fill="#2e2a26" opacity="0.5" />
      <line x1="0.2" y1="0.8" x2="3.8" y2="0.6" stroke="#2e2a26" strokeWidth="0.03" opacity="0.6" />
      <rect x="1" y="0.75" width="0.4" height="0.5" fill="#fbf8f3" opacity="0.8" />
      <rect x="1.8" y="0.7" width="0.5" height="0.45" fill="#fbf8f3" opacity="0.7" />
    </>
  ),
};

export type PhotoScene = keyof typeof scenes;

/**
 * Illustrated stand-in for a family photo. The mock-up never uses real photographs.
 * Pass an empty label when nearby text already names the photo; it is then decorative.
 */
export function PlaceholderPhoto({ scene, label }: { scene: PhotoScene; label: string }) {
  const id = useId();
  return (
    <svg
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
      viewBox="0 0 4 3"
      className="block w-full"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d8c4a4" />
          <stop offset="1" stopColor="#8b7d6b" />
        </linearGradient>
      </defs>
      <rect width="4" height="3" fill={`url(#${id})`} />
      {scenes[scene]}
    </svg>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

type Item = { href: string; label: string };

/** Section navigation of the nest. Plain links, always visible, the current one marked. */
export function NestNav({ items, label }: { items: Item[]; label: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label={label}>
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => {
          const current =
            item.href === "/voorbeeld/nest"
              ? pathname === item.href
              : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "min-target rounded-pill inline-flex items-center border px-5 transition-colors duration-200 ease-out",
                  current
                    ? "border-ink bg-ink text-white"
                    : "border-taupe bg-linen text-ink hover:bg-sand",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

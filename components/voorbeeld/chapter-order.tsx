"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Card, IconButton } from "@/components/ui";
import { chapters as initial, stories } from "@/lib/voorbeeld/data";

/**
 * Chapter order with plain up and down buttons: works with a keyboard, a screen reader and
 * unsteady hands, which drag-and-drop does not. Each move is announced.
 */
export function ChapterOrder() {
  const t = useTranslations("voorbeeld.nest.chapters");
  const [order, setOrder] = useState(initial);
  const [announcement, setAnnouncement] = useState("");

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    const [item] = next.splice(index, 1);
    if (!item) return;
    next.splice(target, 0, item);
    setOrder(next);
    setAnnouncement(t("moved", { title: item.title, position: target + 1 }));
  };

  return (
    <>
      <p role="status" className="sr-only">
        {announcement}
      </p>
      <ol className="flex flex-col gap-4">
        {order.map((chapter, index) => {
          const items = stories.filter((story) => story.chapterId === chapter.id);
          return (
            <li key={chapter.id}>
              <Card className="flex items-start gap-4">
                <span
                  aria-hidden="true"
                  className="font-heading text-taupe-dark text-3xl tabular-nums"
                >
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-2xl">{chapter.title}</h2>
                  {items.length === 0 ? <p className="text-taupe-dark mt-2">{t("empty")}</p> : null}
                  <ul className="mt-2 flex flex-col gap-1">
                    {items.map((story) => (
                      <li key={story.id}>
                        <Link
                          href={`/voorbeeld/nest/verhalen/${story.id}`}
                          className="text-terracotta-dark underline underline-offset-4"
                        >
                          {story.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col">
                  <IconButton
                    label={t("up", { title: chapter.title })}
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUp className="size-6" />
                  </IconButton>
                  <IconButton
                    label={t("down", { title: chapter.title })}
                    disabled={index === order.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown className="size-6" />
                  </IconButton>
                </div>
              </Card>
            </li>
          );
        })}
      </ol>
    </>
  );
}

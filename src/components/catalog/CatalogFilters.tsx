"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCallback, useTransition } from "react";

interface CatalogFiltersProps {
  locale: string;
  actors: string[];
}

const ERAS = ["WWII", "COLD_WAR", "MODERN", "DIGITAL_AGE"] as const;

const TYPES = [
  "ASSASSINATION",
  "PROPAGANDA",
  "DECEPTION",
  "INFLUENCE_OP",
  "FALSE_FLAG",
  "INFILTRATION",
  "MIND_CONTROL",
  "SURVEILLANCE",
  "DISINFORMATION",
] as const;

const OUTCOMES = [
  "SUCCESSFUL",
  "FAILED",
  "PARTIAL",
  "ONGOING",
  "UNKNOWN",
] as const;

const LEVELS = [1, 2, 3, 4, 5] as const;

export function CatalogFilters({ locale, actors }: CatalogFiltersProps) {
  const t = useTranslations("catalog");
  const tEnum = useTranslations("enums");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // Read current filter state from URL
  const search = searchParams.get("search") ?? "";
  const sort = searchParams.get("sort") ?? "newest";
  const actor = searchParams.get("actor") ?? "";
  const levels = searchParams.get("level")
    ? searchParams.get("level")!.split(",").map(Number).filter(Boolean)
    : [];
  const eras = searchParams.get("era")
    ? searchParams.get("era")!.split(",").filter(Boolean)
    : [];
  const types = searchParams.get("type")
    ? searchParams.get("type")!.split(",").filter(Boolean)
    : [];
  const outcomes = searchParams.get("outcome")
    ? searchParams.get("outcome")!.split(",").filter(Boolean)
    : [];

  const activeFilterCount =
    (search ? 1 : 0) +
    (sort !== "newest" ? 1 : 0) +
    (actor ? 1 : 0) +
    levels.length +
    eras.length +
    types.length +
    outcomes.length;

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      const query = params.toString();
      startTransition(() => {
        router.push(`/${locale}/catalog${query ? `?${query}` : ""}`);
      });
    },
    [searchParams, router, locale]
  );

  const toggleArrayParam = useCallback(
    (key: string, value: string, currentArray: string[]) => {
      const next = currentArray.includes(value)
        ? currentArray.filter((v) => v !== value)
        : [...currentArray, value];
      updateParams({ [key]: next.length > 0 ? next.join(",") : null });
    },
    [updateParams]
  );

  const toggleLevelParam = useCallback(
    (level: number) => {
      const next = levels.includes(level)
        ? levels.filter((l) => l !== level)
        : [...levels, level];
      updateParams({ level: next.length > 0 ? next.join(",") : null });
    },
    [levels, updateParams]
  );

  const clearAll = useCallback(() => {
    startTransition(() => {
      router.push(`/${locale}/catalog`);
    });
  }, [router, locale]);

  return (
    <aside className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t("filters.clearAll").replace("Clear All Filters", "Filters")}
        </span>
        {activeFilterCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            {activeFilterCount}
          </Badge>
        )}
      </div>

      {/* Search */}
      <div>
        <Input
          placeholder={t("search")}
          value={search}
          onChange={(e) => updateParams({ search: e.target.value || null })}
          className="h-9"
        />
      </div>

      {/* Sort */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("sort.label")}
        </p>
        <Select
          value={sort}
          onValueChange={(val) =>
            updateParams({ sort: val === "newest" ? null : val })
          }
        >
          <SelectTrigger className="h-9 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{t("sort.newest")}</SelectItem>
            <SelectItem value="oldest">{t("sort.oldest")}</SelectItem>
            <SelectItem value="most-viewed">{t("sort.mostViewed")}</SelectItem>
            <SelectItem value="level">{t("sort.icebergLevel")}</SelectItem>
            <SelectItem value="title">{t("sort.title")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Iceberg Level */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("filters.icebergLevel")}
        </p>
        <div className="flex flex-col gap-2">
          {LEVELS.map((level) => (
            <label
              key={level}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <Checkbox
                checked={levels.includes(level)}
                onCheckedChange={() => toggleLevelParam(level)}
              />
              <span>Level {level}</span>
            </label>
          ))}
        </div>
      </div>

      <Separator />

      {/* Era */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("filters.era")}
        </p>
        <div className="flex flex-col gap-2">
          {ERAS.map((era) => (
            <label
              key={era}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <Checkbox
                checked={eras.includes(era)}
                onCheckedChange={() => toggleArrayParam("era", era, eras)}
              />
              <span>{tEnum(`era.${era}`)}</span>
            </label>
          ))}
        </div>
      </div>

      <Separator />

      {/* Type */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("filters.type")}
        </p>
        <div className="flex flex-col gap-2">
          {TYPES.map((type) => (
            <label
              key={type}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <Checkbox
                checked={types.includes(type)}
                onCheckedChange={() => toggleArrayParam("type", type, types)}
              />
              <span>{tEnum(`type.${type}`)}</span>
            </label>
          ))}
        </div>
      </div>

      <Separator />

      {/* Outcome */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("filters.outcome")}
        </p>
        <div className="flex flex-col gap-2">
          {OUTCOMES.map((outcome) => (
            <label
              key={outcome}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <Checkbox
                checked={outcomes.includes(outcome)}
                onCheckedChange={() =>
                  toggleArrayParam("outcome", outcome, outcomes)
                }
              />
              <span>{tEnum(`outcome.${outcome}`)}</span>
            </label>
          ))}
        </div>
      </div>

      <Separator />

      {/* Actor / Country */}
      {actors.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("filters.country")}
          </p>
          <Select
            value={actor || "_all"}
            onValueChange={(val) =>
              updateParams({ actor: val === "_all" ? null : val })
            }
          >
            <SelectTrigger className="h-9 w-full">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All</SelectItem>
              {actors.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Clear All */}
      {activeFilterCount > 0 && (
        <>
          <Separator />
          <Button
            variant="outline"
            size="sm"
            onClick={clearAll}
            className="w-full"
          >
            {t("filters.clearAll")}
          </Button>
        </>
      )}
    </aside>
  );
}

import { NextResponse } from "next/server";
import { getCatalogOperations } from "@/lib/queries";
import type { CatalogFilters } from "@/lib/queries";
import { Era, OperationType, Outcome, OperationStatus } from "@/generated/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const filters: CatalogFilters = {};

  const q = searchParams.get("q");
  if (q) filters.search = q;

  const level = searchParams.get("level");
  if (level) {
    const parsed = level.split(",").map(Number).filter((n) => !isNaN(n));
    if (parsed.length > 0) filters.levels = parsed;
  }

  const era = searchParams.get("era");
  if (era) {
    const parsed = era.split(",").filter((v) => Object.values(Era).includes(v as Era));
    if (parsed.length > 0) filters.eras = parsed as Era[];
  }

  const type = searchParams.get("type");
  if (type) {
    const parsed = type
      .split(",")
      .filter((v) => Object.values(OperationType).includes(v as OperationType));
    if (parsed.length > 0) filters.types = parsed as OperationType[];
  }

  const outcome = searchParams.get("outcome");
  if (outcome) {
    const parsed = outcome
      .split(",")
      .filter((v) => Object.values(Outcome).includes(v as Outcome));
    if (parsed.length > 0) filters.outcomes = parsed as Outcome[];
  }

  const status = searchParams.get("status");
  if (status) {
    const parsed = status
      .split(",")
      .filter((v) => Object.values(OperationStatus).includes(v as OperationStatus));
    if (parsed.length > 0) filters.statuses = parsed as OperationStatus[];
  }

  const actor = searchParams.get("actor");
  if (actor) filters.actor = actor;

  const sort = searchParams.get("sort");
  if (sort) filters.sort = sort;

  const operations = await getCatalogOperations(filters);

  return NextResponse.json(operations);
}

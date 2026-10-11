import { z } from "zod";
import {
  Era,
  OperationType,
  Outcome,
  OperationStatus,
  SourceType,
} from "@/generated/prisma/enums";

export const idSchema = z.string().trim().min(1).max(128);
const titleSchema = z.string().trim().min(1).max(200);
const excerptSchema = z.string().trim().min(1).max(2000);
const bodySchema = z.string().trim().min(1).max(100_000);
const slugSchema = z.string().min(1).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const namesSchema = z.array(z.string().trim().min(1).max(200)).max(50);
const httpUrlSchema = z.url({ protocol: /^https?$/ }).max(2048);

function createSlug(title: string) {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const operationFields = z.strictObject({
  title: titleSchema,
  titleEs: titleSchema,
  slug: slugSchema,
  slugEs: slugSchema,
  aliases: namesSchema,
  icebergLevel: z.number().int().min(1).max(5),
  era: z.enum(Era),
  types: z.array(z.enum(OperationType)).max(Object.keys(OperationType).length),
  actors: namesSchema,
  targets: namesSchema,
  outcome: z.enum(Outcome),
  status: z.enum(OperationStatus),
  bodyEn: bodySchema,
  bodyEs: bodySchema,
  excerpt: excerptSchema,
  excerptEs: excerptSchema,
});

export const newOperationSchema = operationFields.extend({
  titleEs: z.union([titleSchema, z.literal("")]).optional(),
  slug: z.union([slugSchema, z.literal("")]).optional(),
  slugEs: z.union([slugSchema, z.literal("")]).optional(),
  aliases: namesSchema.default([]),
  icebergLevel: operationFields.shape.icebergLevel.default(3),
  era: operationFields.shape.era.default("MODERN"),
  types: operationFields.shape.types.default([]),
  actors: namesSchema.default([]),
  targets: namesSchema.default([]),
  outcome: operationFields.shape.outcome.default("UNKNOWN"),
  status: operationFields.shape.status.default("ALLEGED"),
  bodyEs: z.union([bodySchema, z.literal("")]).optional(),
  excerptEs: z.union([excerptSchema, z.literal("")]).optional(),
}).transform((data) => ({
  ...data,
  titleEs: data.titleEs || data.title,
  slug: data.slug || createSlug(data.title),
  slugEs: data.slugEs || createSlug(data.titleEs || data.title),
  bodyEs: data.bodyEs || data.bodyEn,
  excerptEs: data.excerptEs || data.excerpt,
})).pipe(operationFields);

export const editOperationSchema = operationFields.partial().refine(
  (data) => Object.values(data).some((value) => value !== undefined),
  { message: "At least one operation field is required" }
);

export const sourceSchema = z.strictObject({
  sourceTitle: titleSchema,
  sourceUrl: httpUrlSchema.nullable().default(null),
  sourceType: z.enum(SourceType).default("WEBSITE"),
  credibility: z.number().int().min(1).max(5).default(3),
});

export const contributionSchema = z.discriminatedUnion("type", [
  z.strictObject({
    type: z.literal("NEW_OPERATION"),
    proposedData: newOperationSchema,
  }),
  z.strictObject({
    type: z.literal("EDIT_OPERATION"),
    operationId: idSchema,
    proposedData: editOperationSchema,
  }),
  z.strictObject({
    type: z.literal("ADD_SOURCE"),
    operationId: idSchema,
    proposedData: sourceSchema,
  }),
]);

export const commentSchema = z.object({
  operationId: idSchema,
  body: z.string().trim().min(3).max(10_000),
});

export const moderationStatusSchema = z.enum(["APPROVED", "REJECTED"]);
export const moderationRequestSchema = z.object({
  status: moderationStatusSchema,
  reviewNote: z.string().trim().max(2000).optional(),
});

export function validationError(error: z.ZodError) {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "Input"}: ${issue.message}`)
    .join("; ");
}

export function operationFormData(formData: FormData) {
  const commaSeparated = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string"
      ? value.split(",").map((part) => part.trim()).filter(Boolean)
      : value ?? [];
  };
  const optionalNumber = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" && value !== "" ? Number(value) : value ?? undefined;
  };

  return {
    title: formData.get("title"),
    titleEs: formData.get("titleEs") ?? undefined,
    icebergLevel: optionalNumber("icebergLevel"),
    era: formData.get("era") ?? undefined,
    types: formData.getAll("types"),
    actors: commaSeparated("actors"),
    targets: commaSeparated("targets"),
    outcome: formData.get("outcome") ?? undefined,
    status: formData.get("status") ?? undefined,
    bodyEn: formData.get("bodyEn"),
    bodyEs: formData.get("bodyEs") ?? undefined,
    excerpt: formData.get("excerpt"),
    excerptEs: formData.get("excerptEs") ?? undefined,
  };
}

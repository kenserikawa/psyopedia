import { z } from "zod";
import { Era, OperationStatus, OperationType, Outcome, SourceType } from "./enums";

// Primitivas heredadas del antiguo src/lib/validation.ts.
const titleSchema = z.string().trim().min(1).max(200);
const excerptSchema = z.string().trim().min(1).max(2000);
const slugSchema = z.string().min(1).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const namesSchema = z.array(z.string().trim().min(1).max(200)).max(50);
const httpUrlSchema = z.url({ protocol: /^https?$/ }).max(2048);

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD")
  .refine((value) => {
    const time = Date.parse(value);
    return !Number.isNaN(time) && new Date(time).toISOString().slice(0, 10) === value;
  }, "Fecha inexistente");

const uniqueSlugs = z
  .array(slugSchema)
  .refine((values) => new Set(values).size === values.length, "Valores repetidos");

export const bodySchema = z.string().trim().min(1).max(100_000);

const sourceSchema = z.strictObject({
  url: httpUrlSchema.nullable(),
  title: titleSchema,
  type: z.enum(SourceType),
  credibility: z.number().int().min(1).max(5),
});

export const metaSchema = z.strictObject({
  slug: slugSchema,
  slugEs: slugSchema,
  title: titleSchema,
  titleEs: titleSchema,
  aliases: namesSchema,
  icebergLevel: z.number().int().min(1).max(5),
  era: z.enum(Era),
  types: z.array(z.enum(OperationType)).max(Object.keys(OperationType).length),
  actors: namesSchema,
  targets: namesSchema,
  outcome: z.enum(Outcome),
  status: z.enum(OperationStatus),
  excerpt: excerptSchema,
  excerptEs: excerptSchema,
  coverImage: z.string().min(1).nullable().optional(),
  publishedAt: dateSchema,
  updatedAt: dateSchema.nullable().optional(),
  tags: uniqueSlugs,
  related: uniqueSlugs,
  sources: z.array(sourceSchema),
});
export type Meta = z.infer<typeof metaSchema>;

export const tagsSchema = z.record(slugSchema, z.strictObject({ name: titleSchema, nameEs: titleSchema }));

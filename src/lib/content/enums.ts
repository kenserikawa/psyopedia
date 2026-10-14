// Enums de dominio. Mismo patrón que el cliente generado de Prisma (objeto const + tipo
// homónimo) para que Object.values(Era) y z.enum(Era) sigan funcionando. Sin dependencias:
// se puede importar desde componentes cliente.

export const Era = {
  WWII: "WWII",
  COLD_WAR: "COLD_WAR",
  MODERN: "MODERN",
  DIGITAL_AGE: "DIGITAL_AGE",
} as const;
export type Era = (typeof Era)[keyof typeof Era];

export const OperationType = {
  ASSASSINATION: "ASSASSINATION",
  PROPAGANDA: "PROPAGANDA",
  DECEPTION: "DECEPTION",
  INFLUENCE_OP: "INFLUENCE_OP",
  FALSE_FLAG: "FALSE_FLAG",
  INFILTRATION: "INFILTRATION",
  MIND_CONTROL: "MIND_CONTROL",
  SURVEILLANCE: "SURVEILLANCE",
  DISINFORMATION: "DISINFORMATION",
} as const;
export type OperationType = (typeof OperationType)[keyof typeof OperationType];

export const Outcome = {
  SUCCESSFUL: "SUCCESSFUL",
  FAILED: "FAILED",
  PARTIAL: "PARTIAL",
  ONGOING: "ONGOING",
  UNKNOWN: "UNKNOWN",
} as const;
export type Outcome = (typeof Outcome)[keyof typeof Outcome];

export const OperationStatus = {
  DECLASSIFIED: "DECLASSIFIED",
  LEAKED: "LEAKED",
  ALLEGED: "ALLEGED",
} as const;
export type OperationStatus = (typeof OperationStatus)[keyof typeof OperationStatus];

export const SourceType = {
  GOVERNMENT: "GOVERNMENT",
  ACADEMIC: "ACADEMIC",
  JOURNALISM: "JOURNALISM",
  BOOK: "BOOK",
  LEAKED_DOC: "LEAKED_DOC",
  VIDEO: "VIDEO",
  WEBSITE: "WEBSITE",
} as const;
export type SourceType = (typeof SourceType)[keyof typeof SourceType];

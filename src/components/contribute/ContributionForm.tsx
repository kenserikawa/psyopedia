"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { submitNewOperation } from "@/lib/actions/contributions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ERAS = [
  { value: "WWII", label: "World War II" },
  { value: "COLD_WAR", label: "Cold War" },
  { value: "MODERN", label: "Modern" },
  { value: "DIGITAL_AGE", label: "Digital Age" },
];

const OPERATION_TYPES = [
  { value: "ASSASSINATION", label: "Assassination" },
  { value: "PROPAGANDA", label: "Propaganda" },
  { value: "DECEPTION", label: "Deception" },
  { value: "INFLUENCE_OP", label: "Influence Operation" },
  { value: "FALSE_FLAG", label: "False Flag" },
  { value: "INFILTRATION", label: "Infiltration" },
  { value: "MIND_CONTROL", label: "Mind Control" },
  { value: "SURVEILLANCE", label: "Surveillance" },
  { value: "DISINFORMATION", label: "Disinformation" },
];

const OUTCOMES = [
  { value: "SUCCESSFUL", label: "Successful" },
  { value: "FAILED", label: "Failed" },
  { value: "PARTIAL", label: "Partial" },
  { value: "ONGOING", label: "Ongoing" },
  { value: "UNKNOWN", label: "Unknown" },
];

const OPERATION_STATUSES = [
  { value: "DECLASSIFIED", label: "Declassified" },
  { value: "LEAKED", label: "Leaked" },
  { value: "ALLEGED", label: "Alleged" },
];

interface Props {
  locale: string;
}

export function ContributionForm({ locale: _locale }: Props) {
  const t = useTranslations("contribute");
  const [state, formAction, isPending] = useActionState(submitNewOperation, null);

  if (state?.success) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-lg font-medium text-green-600 dark:text-green-400">
            {t("thankYou")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form action={formAction} className="space-y-8">
      {state?.error && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("newOperation")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">
                Title (EN) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                required
                placeholder="Operation name in English"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="titleEs">Title (ES)</Label>
              <Input
                id="titleEs"
                name="titleEs"
                placeholder="Nombre de la operación en español"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="icebergLevel">Iceberg Level</Label>
              <Select name="icebergLevel" defaultValue="3">
                <SelectTrigger id="icebergLevel">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      Level {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="era">Era</Label>
              <Select name="era" defaultValue="MODERN">
                <SelectTrigger id="era">
                  <SelectValue placeholder="Select era" />
                </SelectTrigger>
                <SelectContent>
                  {ERAS.map((e) => (
                    <SelectItem key={e.value} value={e.value}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="outcome">Outcome</Label>
              <Select name="outcome" defaultValue="UNKNOWN">
                <SelectTrigger id="outcome">
                  <SelectValue placeholder="Select outcome" />
                </SelectTrigger>
                <SelectContent>
                  {OUTCOMES.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Classification Status</Label>
            <Select name="status" defaultValue="ALLEGED">
              <SelectTrigger id="status" className="w-48">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {OPERATION_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Operation Types */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Operation Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {OPERATION_TYPES.map((type) => (
              <div key={type.value} className="flex items-center gap-2">
                <Checkbox id={`type-${type.value}`} name="types" value={type.value} />
                <Label htmlFor={`type-${type.value}`} className="cursor-pointer font-normal">
                  {type.label}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actors & Targets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Actors & Targets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="actors">Actors (comma-separated)</Label>
            <Input
              id="actors"
              name="actors"
              placeholder="CIA, KGB, MI6"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="targets">Targets (comma-separated)</Label>
            <Input
              id="targets"
              name="targets"
              placeholder="Soviet Union, Cuba"
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="excerpt">
              Excerpt (EN) <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="excerpt"
              name="excerpt"
              required
              rows={3}
              placeholder="A brief summary of the operation in English"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="excerptEs">Excerpt (ES)</Label>
            <Textarea
              id="excerptEs"
              name="excerptEs"
              rows={3}
              placeholder="Resumen breve de la operación en español"
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="bodyEn">
              Full Article (EN) <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="bodyEn"
              name="bodyEn"
              required
              rows={10}
              placeholder="Full description of the operation in English (Markdown supported)"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bodyEs">Full Article (ES)</Label>
            <Textarea
              id="bodyEs"
              name="bodyEs"
              rows={10}
              placeholder="Descripción completa de la operación en español (Markdown compatible)"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending} size="lg">
          {isPending ? "Submitting…" : "Submit for Review"}
        </Button>
      </div>
    </form>
  );
}

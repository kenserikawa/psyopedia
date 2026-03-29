"use client";

import { useState, useTransition } from "react";
import {
  approveContribution,
  rejectContribution,
} from "@/lib/actions/moderation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

type Contribution = {
  id: string;
  type: string;
  status: string;
  createdAt: Date;
  proposedData: unknown;
  reviewNote: string | null;
  submittedBy: { name: string | null; email: string | null };
  operation: { title: string; slug: string } | null;
};

interface ModerationQueueProps {
  contributions: Contribution[];
  approveLabel: string;
  rejectLabel: string;
}

function ProposedDataSummary({
  type,
  data,
  operation,
}: {
  type: string;
  data: unknown;
  operation: { title: string; slug: string } | null;
}) {
  const d = data as Record<string, unknown>;

  if (type === "NEW_OPERATION") {
    const title = String(d.title ?? "—");
    const titleEs = d.titleEs ? String(d.titleEs) : null;
    const era = String(d.era ?? "—");
    const level = String(d.icebergLevel ?? "—");
    const excerpt = d.excerpt ? String(d.excerpt) : null;

    return (
      <div className="space-y-1 text-sm">
        <p>
          <span className="font-medium">Title:</span> {title}
        </p>
        {titleEs && (
          <p>
            <span className="font-medium">Title (ES):</span> {titleEs}
          </p>
        )}
        <p>
          <span className="font-medium">Era:</span> {era}
        </p>
        <p>
          <span className="font-medium">Iceberg Level:</span> {level}
        </p>
        {excerpt && (
          <p className="line-clamp-2 text-muted-foreground">{excerpt}</p>
        )}
      </div>
    );
  }

  if (type === "ADD_SOURCE") {
    const sourceTitle = String(d.sourceTitle ?? "—");
    const sourceUrl = d.sourceUrl ? String(d.sourceUrl) : null;
    const sourceType = String(d.sourceType ?? "—");

    return (
      <div className="space-y-1 text-sm">
        {operation && (
          <p>
            <span className="font-medium">Operation:</span> {operation.title}
          </p>
        )}
        <p>
          <span className="font-medium">Source Title:</span> {sourceTitle}
        </p>
        {sourceUrl && (
          <p>
            <span className="font-medium">URL:</span>{" "}
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline break-all"
            >
              {sourceUrl}
            </a>
          </p>
        )}
        <p>
          <span className="font-medium">Type:</span> {sourceType}
        </p>
      </div>
    );
  }

  return (
    <pre className="text-xs overflow-auto max-h-32 bg-muted p-2 rounded">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function ContributionCard({
  contribution,
  approveLabel,
  rejectLabel,
  onProcessed,
}: {
  contribution: Contribution;
  approveLabel: string;
  rejectLabel: string;
  onProcessed: (id: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      const result = await approveContribution(contribution.id);
      if (result.error) {
        setError(result.error);
      } else {
        onProcessed(contribution.id);
      }
    });
  }

  function handleRejectSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await rejectContribution(
        contribution.id,
        reviewNote || undefined
      );
      if (result.error) {
        setError(result.error);
      } else {
        setRejectOpen(false);
        onProcessed(contribution.id);
      }
    });
  }

  const submitterName =
    contribution.submittedBy.name ||
    contribution.submittedBy.email ||
    "Anonymous";

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base">
              <Badge variant="outline" className="mr-2">
                {contribution.type.replace(/_/g, " ")}
              </Badge>
            </CardTitle>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {new Date(contribution.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Submitted by{" "}
            <span className="font-medium text-foreground">{submitterName}</span>
          </p>
        </CardHeader>

        <CardContent>
          <ProposedDataSummary
            type={contribution.type}
            data={contribution.proposedData}
            operation={contribution.operation}
          />
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </CardContent>

        <Separator />

        <CardFooter className="gap-2 pt-4">
          <Button
            size="sm"
            onClick={handleApprove}
            disabled={isPending}
          >
            {approveLabel}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setRejectOpen(true)}
            disabled={isPending}
          >
            {rejectLabel}
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Contribution</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="reviewNote">Review Note (optional)</Label>
            <Textarea
              id="reviewNote"
              placeholder="Explain why this contribution is being rejected..."
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectSubmit}
              disabled={isPending}
            >
              Confirm Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ModerationQueue({
  contributions: initialContributions,
  approveLabel,
  rejectLabel,
}: ModerationQueueProps) {
  const [contributions, setContributions] = useState(initialContributions);

  function handleProcessed(id: string) {
    setContributions((prev) => prev.filter((c) => c.id !== id));
  }

  if (contributions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        No pending contributions.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {contributions.map((c) => (
        <ContributionCard
          key={c.id}
          contribution={c}
          approveLabel={approveLabel}
          rejectLabel={rejectLabel}
          onProcessed={handleProcessed}
        />
      ))}
    </div>
  );
}

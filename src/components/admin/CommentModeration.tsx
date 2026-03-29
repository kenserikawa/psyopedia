"use client";

import { useState, useTransition } from "react";
import { moderateComment } from "@/lib/actions/comments";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type PendingComment = {
  id: string;
  body: string;
  createdAt: Date;
  author: { name: string | null };
  operation: { title: string; slug: string } | null;
};

interface CommentModerationProps {
  comments: PendingComment[];
  approveLabel: string;
  rejectLabel: string;
}

function CommentCard({
  comment,
  approveLabel,
  rejectLabel,
  onProcessed,
}: {
  comment: PendingComment;
  approveLabel: string;
  rejectLabel: string;
  onProcessed: (id: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleModerate(status: "APPROVED" | "REJECTED") {
    setError(null);
    startTransition(async () => {
      const result = await moderateComment(comment.id, status);
      if (result.error) {
        setError(result.error);
      } else {
        onProcessed(comment.id);
      }
    });
  }

  const authorName = comment.author.name ?? "Anonymous";

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            {comment.operation && (
              <Badge variant="outline" className="text-xs">
                {comment.operation.title}
              </Badge>
            )}
            <p className="text-xs text-muted-foreground">
              by{" "}
              <span className="font-medium text-foreground">{authorName}</span>
            </p>
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {new Date(comment.createdAt).toLocaleDateString()}
          </span>
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-sm">{comment.body}</p>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </CardContent>

      <Separator />

      <CardFooter className="gap-2 pt-4">
        <Button
          size="sm"
          onClick={() => handleModerate("APPROVED")}
          disabled={isPending}
        >
          {approveLabel}
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => handleModerate("REJECTED")}
          disabled={isPending}
        >
          {rejectLabel}
        </Button>
      </CardFooter>
    </Card>
  );
}

export function CommentModeration({
  comments: initialComments,
  approveLabel,
  rejectLabel,
}: CommentModerationProps) {
  const [comments, setComments] = useState(initialComments);

  function handleProcessed(id: string) {
    setComments((prev) => prev.filter((c) => c.id !== id));
  }

  if (comments.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        No pending comments.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {comments.map((c) => (
        <CommentCard
          key={c.id}
          comment={c}
          approveLabel={approveLabel}
          rejectLabel={rejectLabel}
          onProcessed={handleProcessed}
        />
      ))}
    </div>
  );
}

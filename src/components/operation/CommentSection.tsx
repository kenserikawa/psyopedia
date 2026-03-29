"use client";

import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { submitComment } from "@/lib/actions/comments";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type Comment = {
  id: string;
  body: string;
  author: { name: string | null };
  createdAt: Date;
  status: string;
};

interface CommentSectionProps {
  operationId: string;
  comments: Comment[];
  locale: string;
}

export function CommentSection({
  operationId,
  comments: initialComments,
  locale,
}: CommentSectionProps) {
  const { data: session, status } = useSession();
  const [comments] = useState(initialComments);
  const [body, setBody] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const labels =
    locale === "es"
      ? {
          title: "Comentarios",
          placeholder: "Escribe un comentario...",
          submit: "Enviar comentario",
          signIn: "Inicia sesión para comentar",
          pending: "Comentario enviado, pendiente de revisión.",
          noComments: "Aún no hay comentarios.",
          anonymous: "Anónimo",
          by: "por",
        }
      : {
          title: "Comments",
          placeholder: "Write a comment...",
          submit: "Submit comment",
          signIn: "Sign in to comment",
          pending: "Comment submitted, pending review.",
          noComments: "No comments yet.",
          anonymous: "Anonymous",
          by: "by",
        };

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await submitComment(operationId, body);
      if (result.error) {
        setError(result.error);
      } else {
        setBody("");
        setSubmitted(true);
      }
    });
  }

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">{labels.title}</h2>

      {/* Comment list */}
      {comments.length === 0 ? (
        <p className="mb-6 text-sm text-muted-foreground">{labels.noComments}</p>
      ) : (
        <div className="mb-6 space-y-3">
          {comments.map((comment) => (
            <Card key={comment.id}>
              <CardHeader className="pb-1 pt-3 px-4">
                <p className="text-xs text-muted-foreground">
                  {comment.author.name ?? labels.anonymous} &mdash;{" "}
                  {new Date(comment.createdAt).toLocaleDateString()}
                </p>
              </CardHeader>
              <CardContent className="pb-3 px-4">
                <p className="text-sm">{comment.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Separator className="mb-6" />

      {/* Comment form */}
      {status === "loading" ? null : session?.user ? (
        submitted ? (
          <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            {labels.pending}
          </p>
        ) : (
          <div className="space-y-3">
            <Textarea
              placeholder={labels.placeholder}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              disabled={isPending}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button onClick={handleSubmit} disabled={isPending || body.trim().length < 3}>
              {labels.submit}
            </Button>
          </div>
        )
      ) : (
        <p className="text-sm text-muted-foreground">{labels.signIn}</p>
      )}
    </section>
  );
}

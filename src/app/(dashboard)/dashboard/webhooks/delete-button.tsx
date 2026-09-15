"use client";
import { useState } from "react";
import { Button } from "@/components/ui/primitives";
import { deleteWebhook } from "./actions";

export function DeleteWebhookButton({ id }: { id: string }) {
  const [pending, setPending] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={async () => {
        if (!confirm("Delete this webhook?")) return;
        setPending(true);
        try {
          await deleteWebhook(id);
        } finally {
          setPending(false);
        }
      }}
    >
      {pending ? "…" : "Delete"}
    </Button>
  );
}

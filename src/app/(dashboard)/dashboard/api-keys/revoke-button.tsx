"use client";
import { useState } from "react";
import { Button } from "@/components/ui/primitives";
import { revokeApiKey } from "./actions";

export function RevokeButton({ keyId }: { keyId: string }) {
  const [pending, setPending] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={async () => {
        if (!confirm("Revoke this key? Apps using it will stop working immediately.")) return;
        setPending(true);
        try {
          await revokeApiKey(keyId);
        } finally {
          setPending(false);
        }
      }}
    >
      {pending ? "Revoking…" : "Revoke"}
    </Button>
  );
}
